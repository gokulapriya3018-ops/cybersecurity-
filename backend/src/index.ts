import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import simRoutes from './routes/sims';
import authRoutes from './routes/auth';
import progressRoutes from './routes/progress';
import adminRoutes from './routes/admin';
import gamificationRoutes from './routes/gamification';

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
app.use('/api/gamification', gamificationRoutes);

import { prisma } from './db';

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Public broadcast announcement for students
app.get('/api/broadcasts/active', async (req, res) => {
  try {
    const alert = await prisma.broadcastAlert.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ ok: true, alert });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Internal error' });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
