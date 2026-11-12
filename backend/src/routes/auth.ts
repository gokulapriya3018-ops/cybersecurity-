import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-csa-key-2024';

// Helper to generate access token
const generateAccessToken = (user: { id: number; email: string; role: string }) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' } // Extended access token to avoid 401s during labs
  );
};

// Helper to generate refresh token
const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ ok: false, message: 'Email and password required' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ ok: false, message: 'User already exists' });
    }

    // Check if this is the first user
    const userCount = await prisma.user.count();
    const isFirstUser = userCount === 0;

    // Use bcrypt cost factor 12
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: isFirstUser ? 'ADMIN' : 'STUDENT',
        isApproved: isFirstUser ? true : false,
      },
    });

    if (!user.isApproved) {
      return res.status(200).json({ ok: false, message: 'Registration successful. Waiting for admin approval to login.' });
    }

    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken();

    // Store the refresh token session
    await prisma.session.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days expiry
      },
    });

    res.json({
      ok: true,
      token,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ ok: false, message: 'Email and password required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ ok: false, message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ ok: false, message: 'Invalid credentials' });
    }

    if (!user.isApproved) {
      return res.status(403).json({ ok: false, message: 'Your account is pending admin approval.' });
    }

    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken();

    // Store the refresh token session
    await prisma.session.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = (req.headers['user-agent'] as string) || 'Unknown Client';

    // Check for previous login to detect concurrent multi-IP anomaly within 5 minutes
    const lastLogin = await prisma.loginAudit.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    let anomalyDetected = false;
    if (lastLogin && lastLogin.ipAddress !== ipAddress && (Date.now() - new Date(lastLogin.createdAt).getTime()) < 5 * 60 * 1000) {
      anomalyDetected = true;
    }

    // Update User telemetry
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastActiveAt: new Date(),
        ...(anomalyDetected ? { anomalyFlags: { increment: 1 } } : {})
      }
    });

    // Record LoginAudit
    await prisma.loginAudit.create({
      data: {
        userId: user.id,
        ipAddress,
        userAgent
      }
    });

    // Record SecurityEvent
    await prisma.securityEvent.create({
      data: {
        userId: user.id,
        eventType: anomalyDetected ? 'ANOMALY_WARNING' : 'LOGIN_SUCCESS',
        description: anomalyDetected
          ? `Concurrent multi-IP session anomaly detected from ${ipAddress}`
          : `Operator authenticated with clearance via session token`,
        metadata: JSON.stringify({ ip: ipAddress, userAgent })
      }
    });

    res.json({
      ok: true,
      token,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: 'Internal server error' });
  }
});

// Refresh token rotation endpoint
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ ok: false, message: 'Refresh token is required' });
    }

    // Lookup session in DB
    const session = await prisma.session.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!session) {
      return res.status(401).json({ ok: false, message: 'Invalid refresh token' });
    }

    // Check if expired
    if (new Date() > session.expiresAt) {
      await prisma.session.delete({ where: { id: session.id } });
      return res.status(401).json({ ok: false, message: 'Refresh token expired' });
    }

    // Rotate tokens: delete old session and create a new one
    await prisma.session.delete({ where: { id: session.id } });

    const newAccessToken = generateAccessToken(session.user);
    const newRefreshToken = generateRefreshToken();

    await prisma.session.create({
      data: {
        token: newRefreshToken,
        userId: session.user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      ok: true,
      token: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: 'Internal server error' });
  }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await prisma.session.deleteMany({ where: { token: refreshToken } });
    }
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: 'Internal server error' });
  }
});

export const requireAuth = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ ok: false, message: 'Missing token' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ ok: false, message: 'Invalid token' });
  }
};

router.put('/profile', requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ ok: false, message: 'Email is required' });
    }

    const dataToUpdate: any = { email };

    if (password) {
      dataToUpdate.password = await bcrypt.hash(password, 12);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: { id: true, email: true, role: true },
    });

    const token = generateAccessToken(updatedUser);

    res.json({ ok: true, user: updatedUser, token });
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(400).json({ ok: false, message: 'Email is already taken' });
    }
    res.status(500).json({ ok: false, message: 'Internal server error' });
  }
});

// Dynamic Active Heartbeat Telemetry
router.post('/heartbeat', requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastActiveAt: true, activeMinutes: true, role: true }
    });

    if (!user) {
      return res.status(404).json({ ok: false, message: 'User not found' });
    }

    let incrementMinutes = 0;
    if (user.lastActiveAt) {
      const elapsedMs = now.getTime() - new Date(user.lastActiveAt).getTime();
      const elapsedMins = Math.round(elapsedMs / (60 * 1000));
      // If user was active within the last 3 minutes, increment by actual minutes elapsed (capped between 1 and 2)
      if (elapsedMins >= 1 && elapsedMins <= 3) {
        incrementMinutes = elapsedMins;
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        lastActiveAt: now,
        ...(incrementMinutes > 0 ? { activeMinutes: { increment: incrementMinutes } } : {})
      }
    });

    res.json({ 
      ok: true, 
      activeMinutes: (user.activeMinutes || 0) + incrementMinutes,
      lastActiveAt: now
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Heartbeat failed' });
  }
});

export default router;
