import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import {redisClient} from './config/redis.js';
import cors from 'cors';
dotenv.config();

await connectDB();






redisClient.connect()
.then(() => {
  console.log("Connected to Redis successfully");
})
.catch(console.error);

const app = express();

// middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));
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