import  jwt  from "jsonwebtoken";
import { redisClient } from "../config/redis.js";
import { generateCSRFToken, revokeCSRFToken } from "./csrfMiddleware.js";
import crypto from "crypto";

export const generateToken = async (id,res) => {

  const sessionId = crypto.randomBytes(16).toString("hex");
   
  const accessToken = jwt.sign({ id, sessionId }, process.env.JWT_SECRET_KEY, { expiresIn: '15m' });

  const refreshToken = jwt.sign({ id, sessionId }, process.env.REFRESH_SECRET_KEY, { expiresIn: '7d' });

  const refreshTokenKey = `refresh_token:${id}`;
  const activeSessionKey = `active_session:${id}`;
  const sessionDataKey = `session:${id}`;

  const existingSession = await redisClient.get(activeSessionKey);
  if(existingSession){
    await redisClient.del(`session:${existingSession}`);
    await redisClient.del(refreshToken);
  }

  const sessionData = {
    userId: id,
    sessionId,
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
  };

  await redisClient.setEx(refreshTokenKey, 7 * 24 * 60 * 60, refreshToken); // 7 days expiration
  await redisClient.setEx(sessionDataKey, 7 * 24 * 60 * 60, JSON.stringify(sessionData));
  await redisClient.setEx(activeSessionKey, 7 * 24 * 60 * 60, sessionId);

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: true, // read only https
    sameSite: 'none',
    maxAge: 15 * 60 * 1000, // 15 minute
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: true, // read only https
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  const csrfToken = await generateCSRFToken(id,res);

  return {accessToken, refreshToken, csrfToken, sessionId};
  
};

export const verifyRefreshToken = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY);

    const refreshTokenKey = `refresh_token:${decoded.id}`;
    const storedToken = await redisClient.get(refreshTokenKey); 
    if (storedToken !== refreshToken) {
      return null;
    }

    const activeSessionKey = `active_session:${decoded.id}`;
    const activeSessionId = await redisClient.get(activeSessionKey);
    if (decoded.sessionId !== activeSessionId) {
      return null;
    }
    const sessionDataKey = `session:${decoded.id}`;
    const sessionData = await redisClient.get(sessionDataKey);
    if (!sessionData) {
      return null;
    }

    const parsedSessionData = JSON.parse(sessionData);
    parsedSessionData.lastActivity = new Date().toISOString();
    await redisClient.setEx(sessionDataKey, 7 * 24 * 60 * 60, JSON.stringify(parsedSessionData));
    return decoded;
  } catch (error) {
    return null;
  }
};


export const generateAccessToken = (id, sessionId,res) => {
  const options = {
    expiresIn: '15m',
  };
  const accessToken = jwt.sign({ id, sessionId }, process.env.JWT_SECRET_KEY, options);

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: true, // read only https
    sameSite: 'none',
    maxAge: 15 * 60 * 1000, // 15 minute
  });
};


export const revokeRefreshToken = async (userId) => {
  const activeSessionId = await redisClient.get(`active_session:${userId}`);
  
  await redisClient.del(`refresh_token:${userId}`);
  await redisClient.del(`active_session:${userId}`);

  if(activeSessionId){
    await redisClient.del(`session:${activeSessionId}`);
  }
  await revokeCSRFToken(userId);
};


export const isActiveSession = async (userId, sessionId) => {
  const activeSessionId = await redisClient.get(`active_session:${userId}`);
  return activeSessionId === sessionId;
};