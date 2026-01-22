import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import {createClient} from 'redis';

dotenv.config();

await connectDB();

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  console.error("REDIS_URL is not defined in environment variables");
  process.exit(1);
}

export const redisClient = createClient({
  url: redisUrl,
});

redisClient.connect()
.then(() => {
  console.log("Connected to Redis successfully");
})
.catch(console.error);

const app = express();

// middlewares
app.use(express.json());
app.use(cookieParser());

// Import user routes
import userRoutes from './routes/user.js';

//Using routes
app.use('/api/v1/', userRoutes);


app.get('/', (req, res) => {
  res.send('API is running...');
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});