import crypto from "crypto";
import { redisClient } from "./redis.js";

export const generateCSRFToken = async (userId, res) => {
    const csrfToken = crypto.randomBytes(32).toString("hex");

    const csrfKey = `csrf:${userId}`;

    await redisClient.setEx(csrfKey, 3600, csrfToken); // valid for 1 hour

    res.cookie('csrfToken', csrfToken, {
        httpOnly: false,
        secure: true,
        sameSite: 'none',
        maxAge: 3600 * 1000, // valid for 1 hour
    });

    return csrfToken;
};

export const verifyCSRFToken = async (req, res, next) => {
    try {

        if (req.method === 'GET') {
            return next();
        }

        const userId = req.user._id;
        if (!userId) {
            return res.status(401).json({
                message: "User not authenticated"
            });
        }
        const clientToken =
            req.headers['x-csrf-token'] ||
            req.headers['x-xsrf-token'] ||
            req.cookies['csrfToken'];

        if (!clientToken) {
            return res.status(403).json({
                message: "CSRF token missing. please refresh the page",
                code: "CSRF_TOKEN_MISSING",
            });
        }

        const csrfKey = `csrf:${userId}`;
        const storedToken = await redisClient.get(csrfKey);

        if (!storedToken || storedToken !== clientToken) {
            return res.status(403).json({
                message: "CSRF Token Expired. Please Try Again.",
                code: "CSRF_TOKEN_EXPIRED",
            });
        }

        if (storedToken !== clientToken) {
            return res.status(403).json({
                message: "Invalid CSRF Token. Please refresh the page.",
                code: "CSRF_TOKEN_INVALID",
            });
        }
        next();
    } catch (error) {
        console.log("CSRF Verification Error", error);
        return res.status(500).json({
            message: "CSRF verification failed",
            code: "CSRF_VERIFICATION_ERROR",
        });
    }
};

export const revokeCSRFToken = async (userId) => {
    const csrfKey = `csrf:${userId}`;
    await redisClient.del(csrfKey);
};

export const refreshCSRFToken = async (userId, res) => {
    await revokeCSRFToken(userId);
    return await generateCSRFToken(userId, res);
};