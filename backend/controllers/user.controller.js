import TryCatch from "../middleware/tryCatch.js";
import sanitize from 'mongo-sanitize';
import { loginSchema, registerSchema } from "../config/zod.js";
import { redisClient } from "../index.js";
import { User } from "../models/user.model.js";
import bcrypt from "bcrypt"
import crypto from "crypto";
import sendMail from "../config/sendMail.js";
import { getVerifyEmailHtml, getOtpHtml } from "../config/html.js";
import { generateAccessToken, generateToken, revokeRefreshToken, verifyRefreshToken } from "../config/generateToken.js";


export const registerUser = TryCatch(async (req, res) => {
  const sanitizedBody = sanitize(req.body);

  const validation = registerSchema.safeParse(sanitizedBody);

  if (!validation.success) {
    const zodError = validation.error;
    let firstErrorMessage = "validation failed";
    let allErrors = [];

    if (zodError?.issues && Array.isArray(zodError.issues)) {
      allErrors = zodError.issues.map( issue => ({
        field: issue.path ? issue.path.join('.') : "unknown",
        message: issue.message || "validation error",
        code: issue.code
      }));
      
      firstErrorMessage = allErrors[0]?.message || "validation error";
    }

    return res.status(400).json({ message: firstErrorMessage, errors: allErrors });
  }
  
  const { name, email, password } = validation.data;

  const rateLimitKey = `register_rate-limit:${req.ip}:${email}`;

  // Here you would typically check the number of attempts from Redis
  // and implement rate limiting logic.
  
  if(await redisClient.get(rateLimitKey)) {
    return res.status(429).json({ message: "Too many registration attempts. Please try again later." });
  }

  const existingUser =  await User.findOne({ email }); 
  if (existingUser) {
    return res.status(400).json({ message: "User with this email already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const verifyToken = crypto.randomBytes(32).toString('hex');
  const verifyKey = `verify:${verifyToken}`;
  const datatoStore = JSON.stringify({
     name, 
     email, 
     password: hashedPassword 
    });

    await redisClient.set(verifyKey, datatoStore, {EX: 300}); // 5 min expiration
    // await redisClient.setEx(verifyKey, 300, datatoStore);


    // http://localhost:5173/token/sdakfjoaijfojalskdjfoiaw
    const subject = "Verify your email For Account creation";
    const html = getVerifyEmailHtml({ email, token: verifyToken });

    await sendMail({email, subject, html});

    await redisClient.set(rateLimitKey, "true", {EX: 60}); // 1 attempt per minute

  // Registration logic here
  res.status(201).json({ 
    message: "If your email is valid, a verification link has been sent. Please check your email to verify your account. It will expire in 5 minutes. "
   });
});
//  /--------------verifyUser--------- /  //
export const verifyUser = TryCatch(async (req, res) => {
  const { token } = req.params;
  if(!token){
    return res.status(400).json({ message: "Verification token is required" });
  }
  const verifyKey = `verify:${token}`;

  const userDataJson = await redisClient.get(verifyKey);

  if (!userDataJson) {
    return  res.status(400).json({ message: "Invalid or expired verification token" });
  }
  const userdata = JSON.parse(userDataJson);

  const existingUser =  await User.findOne({ email: userdata.email }); 
  if (existingUser) {
    return res.status(400).json({ message: "User with this email already exists" });
  }
  const newUser = await User.create({
    name: userdata.name,
    email: userdata.email,
    password: userdata.password
  });
  await redisClient.del(verifyKey); // Remove the token after successful verification

  res.status(201).json({ 
    message: "User verified and registered successfully",
    user:{
      _id: newUser._id, 
      name: newUser.name, 
      email: newUser.email}
  });
});

// //---------------login ------------------// //
export const loginUser = TryCatch(async(req,res) =>{
  const sanitizedBody = sanitize(req.body);

  const validation = loginSchema.safeParse(sanitizedBody);

  if (!validation.success) {
    const zodError = validation.error;
    let firstErrorMessage = "validation failed";
    let allErrors = [];

    if (zodError?.issues && Array.isArray(zodError.issues)) {
      allErrors = zodError.issues.map( issue => ({
        field: issue.path ? issue.path.join('.') : "unknown",
        message: issue.message || "validation error",
        code: issue.code
      }));
      
      firstErrorMessage = allErrors[0]?.message || "validation error";
    }

    return res.status(400).json({ message: firstErrorMessage, errors: allErrors });
  }
  
  const { email, password } = validation.data;

  const rateLimitKey = `login_rate-limit:${req.ip}:${email}`;
  if(await redisClient.get(rateLimitKey)) {
    return res.status(429).json({ message: "Too many login attempts. Please try again later." });
  }

  const user = await User.findOne({ email });
  if(!user){
    return res.status(400).json({ message: "Invalid email or password" });
  }
  const comparePassword = await bcrypt.compare(password, user.password);
  if(!comparePassword){
    return res.status(400).json({ message: "Invalid email or password" });
  }

  // const otp = Math.floor(100000 + Math.random() * 900000).toString();  

  const otp = crypto.randomInt(100000, 1000000).toString();

  const otpKey = `otp:${email}`;
  await redisClient.set(otpKey, JSON.stringify(otp), {EX: 300}); // 5 min expiration

  const subject = "Your OTP Code for Login";
  const html = getOtpHtml({ email, otp });

  await sendMail({email, subject, html});

  await redisClient.set(rateLimitKey, "true", {EX: 60}); // 1 attempt per minute
  


  res.status(200).json({
     message: "If your email is valid, an OTP has been sent to your email. It will expire in 5 minutes."  });
  
})

//-------------- verify OTP ------------------//
export const verifyOtp = TryCatch(async(req,res) =>{
  const { email, otp } = req.body;

  if(!email || !otp){
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  const otpKey = `otp:${email}`;
  const storedOtpString = await redisClient.get(otpKey);

  if (!storedOtpString) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }
  const storedOtp = JSON.parse(storedOtpString);

  if(storedOtp !== otp){
    return res.status(400).json({ message: "Invalid OTP" });
  }

  await redisClient.del(otpKey); // Remove OTP after successful verification

  let user = await User.findOne({ email });
  if(!user){
    return res.status(400).json({ message: "User not found" });
  }

  const tokens = await generateToken(user._id, res);

  res.status(200).json({ 
    message: `Welcome back, ${user.name}!`,
    user});
    

  
});


// //---------------- Resend otp---------------// //
export const resendOtp = TryCatch(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const rateLimitKey = `resend_otp_rate-limit:${req.ip}:${email}`;

  // --- rate-limit check
  if (await redisClient.get(rateLimitKey)) {
    return res.status(429).json({
      message: "Please wait 1 minute before requesting another OTP"
    });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  const otpKey = `otp:${email}`;


  await redisClient.del(otpKey);

  const otp = crypto.randomInt(100000, 1000000).toString();

  await redisClient.set(
    otpKey,
    JSON.stringify(otp),
    { EX: 300 } // 5 minutes
  );

  const subject = "Your OTP Code for Login";
  const html = getOtpHtml({ email, otp });

  await sendMail({ email, subject, html });

  // ✅ set resend limit
  await redisClient.set(rateLimitKey, "true", { EX: 60 });

  res.status(200).json({
    message:
      "If your email is valid, a new OTP has been sent. It will expire in 5 minutes."
  });
});

//-------------- my profile ------------------//
export const myProfile = TryCatch(async(req,res) =>{

  const user = req.user;
  res.status(200).json(user);
});

export const refreshToken = TryCatch(async(req,res) =>{ 
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "Please Login - No refresh token provided" });
  }

  const decoded = await verifyRefreshToken(refreshToken);

  if (!decoded) {
    return res.status(400).json({ message: "Invalid refresh token." });
  }

  generateAccessToken(decoded.id, res);

  res.status(200).json({ message: "Access token refreshed successfully." });
});


export const logoutUser = TryCatch(async(req,res) =>{
  const userId = req.user._id;

  await revokeRefreshToken(userId);

  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  await redisClient.del(`user:${userId}`);

  res.status(200).json({ message: "Logged out successfully." });
});















// what is NoSql injection
//  https://portswigger.net/web-security/nosql-injection

// how to prevent NoSql injection
// 1. Input Validation: Always validate and sanitize user inputs to ensure they conform to expected formats.
// 2. Use ORM/ODM: Utilize Object-Relational Mapping (ORM) or Object-Document Mapping (ODM) libraries that abstract database queries and help prevent injection attacks.
// 3. Parameterized Queries: Use parameterized queries or prepared statements to separate code from data, making it difficult for attackers to inject malicious code.
// 4. Least Privilege Principle: Limit database user permissions to only what is necessary for the application to function, reducing the potential impact of an injection attack.
// 5. Regular Security Audits: Conduct regular security audits and code reviews to identify and fix potential vulnerabilities in the application.




// mongo_sanitize is a library that helps prevent NoSQL injection attacks by sanitizing user inputs. It removes any keys that start with '$' or contain '.' from objects, which are commonly used in NoSQL injection attacks.
// To use mongo_sanitize, you can install it via npm and then apply it to user inputs before processing them. Here's an example: 