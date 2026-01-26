import jwt from "jsonwebtoken";
import { redisClient } from "../config/redis.js";
import { User } from "../models/user.model.js";
export const isAuth = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      return res.status(403).json({ message: "Please Login - No token provided" });   // 403 is very imp it used in apiIntercepter.js
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    if (!decoded) {
      return res.status(400).json({ message: "Invalid token, authorization denied" });
    }

    const cacheUser = await redisClient.get(`user:${decoded.id}`);

    if (cacheUser) {
      req.user = JSON.parse(cacheUser);
      return next();
    }

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await redisClient.setEx(`user:${user._id}`, 3600, JSON.stringify(user)); // Cache for 1 hour

    req.user = user;
    next();
  } catch (error) {
    // console.error("Authentication error:", error);
    return res.status(500).json({ message: "Server error during authentication" });
  }
}