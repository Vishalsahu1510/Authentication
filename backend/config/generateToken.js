import  jwt  from "jsonwebtoken";
import { redisClient } from "../index.js";

export const generateToken = async (id,res) => {
   
  const options = {
    expiresIn: '15m',        
  };
  const accessToken = jwt.sign({ id }, process.env.JWT_SECRET_KEY, options);

  const refreshToken = jwt.sign({ id }, process.env.REFRESH_SECRET_KEY, { expiresIn: '7d' });

  const refreshTokenKey = `refresh_token:${id}`;

  await redisClient.setEx(refreshTokenKey, 7 * 24 * 60 * 60, refreshToken); // 7 days expiration

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    // secure: true, // read only https
    sameSite: 'Strict',
    maxAge: 15 * 60 * 1000, // 15 minute
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    // secure: true, // read only https
    sameSite: 'None',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return {accessToken, refreshToken};
  
};

export const verifyRefreshToken = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY);

    const refreshTokenKey = `refresh_token:${decoded.id}`;
    const storedToken = await redisClient.get(refreshTokenKey); 
    if (storedToken !== refreshToken) {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
};


export const generateAccessToken = (id,res) => {
  const options = {
    expiresIn: '15m',
  };
  const accessToken = jwt.sign({ id }, process.env.JWT_SECRET_KEY, options);

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    // secure: true, // read only https
    sameSite: 'Strict',
    maxAge: 15 * 60 * 1000, // 15 minute
  });
};


export const revokeRefreshToken = async (userId) => {
  const refreshTokenKey = `refresh_token:${userId}`;
  await redisClient.del(refreshTokenKey);
};
