import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import simRoutes from './routes/sims';
import authRoutes from './routes/auth';
import progressRoutes from './routes/progress';
import adminRoutes from './routes/admin';

dotenv.config();



const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/sims', simRoutes);

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
