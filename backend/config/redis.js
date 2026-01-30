import { createClient } from 'redis';

let redisClient = null;

export const connectRedis = async () => {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.error("REDIS_URL is not defined in environment variables");
    process.exit(1);
  }

  redisClient = createClient({
    url: redisUrl,
  });

  redisClient.on('error', (err) => console.error('Redis Client Error:', err));

  try {
    await redisClient.connect();
    console.log("Connected to Redis successfully");
  } catch (error) {
    console.error("Failed to connect to Redis", error);
    process.exit(1);
  }
};

export { redisClient };

/**
 * Redis Connection Configuration
 * 
 * PROBLEM:
 * Previously, the Redis client was created at the module level like this:
 * 
 *   const redisUrl = process.env.REDIS_URL;
 *   if (!redisUrl) { ... exit ... }
 *   export const redisClient = createClient({ url: redisUrl });
 * 
 * This caused the error: "REDIS_URL is not defined in environment variables"
 * 
 * WHY IT HAPPENED:
 * In ES Modules, all `import` statements are HOISTED and executed BEFORE any
 * code in the importing file runs. So in index.js:
 * 
 *   import dotenv from 'dotenv';
 *   dotenv.config();                    // <-- This line doesn't run first!
 *   import { connectRedis } from './config/redis.js';  // <-- This imports first!
 * 
 * Even though dotenv.config() appears before the redis import in the code,
 * ES Module imports are hoisted to the top, so redis.js executed BEFORE
 * dotenv.config() could load the .env file.
 * 
 * SOLUTION:
 * Move the REDIS_URL check and client creation INSIDE the connectRedis() function.
 * This ensures the environment variables are loaded (via dotenv.config()) before
 * this code runs, since connectRedis() is called AFTER dotenv.config() in index.js.
 */