import db from './database/dbClient.js';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { loggerMiddleware } from './middlewares/loggerMiddleware.js';
import { errorMiddleware } from './middlewares/errorMiddleware.js';
// Importing routes
import authRoutes from './routes/authRoutes.js';
import instituteOptionsRoutes from './routes/instituteOptionsRoutes.js';
import examRoutes from './routes/examRoutes.js';
import bcrypt from 'bcrypt';

dotenv.config();

const app = express();

db.connect()
  .then()
  .catch((error) => console.error('❌ Database connection failed:', error));

// Middleware
app.use(cors({ origin: process.env.FRONTEND_ORIGIN_URL, credentials: true }));
app.use(express.json());
app.use(loggerMiddleware);
app.use(express.urlencoded({ extended: true }));

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash('12345678', saltRounds);
    console.log('Hashed password for 12345678:', hashedPassword);

// Routes
app.get('/api/test', (req, res) => {
  console.log('✅ Backend test route hit!');
  res.json({ message: 'Backend is connected successfully!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/institute-options', instituteOptionsRoutes);
app.use('/api/exams', examRoutes);

// Main route
app.get('/', (req, res) => {
  console.log("User hit a main route!");
  res.json({ message: 'working fine!' });
});

// Error Middleware
app.use(errorMiddleware);

// Start the server and WebSocket
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server listening at http://localhost:${PORT}`);
});

export default app;