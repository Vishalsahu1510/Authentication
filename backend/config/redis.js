import {createClient} from 'redis';
import dotenv from 'dotenv';
dotenv.config();

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  console.error("REDIS_URL is not defined in environment variables");
  process.exit(1);
}

export const redisClient = createClient({
  url: redisUrl,
});