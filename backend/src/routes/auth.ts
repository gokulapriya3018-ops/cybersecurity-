import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-csa-key-2024';

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

    const hashedPassword = await bcrypt.hash(password, 10);
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

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ ok: true, token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
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

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ ok: true, token, user: { id: user.id, email: user.email, role: user.role } });
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
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: { id: true, email: true, role: true }
    });

    // Generate a fresh token in case the email changed
    const token = jwt.sign({ id: updatedUser.id, email: updatedUser.email, role: updatedUser.role }, JWT_SECRET, { expiresIn: '1d' });
    
    res.json({ ok: true, user: updatedUser, token });
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(400).json({ ok: false, message: 'Email is already taken' });
    }
    res.status(500).json({ ok: false, message: 'Internal server error' });
  }
});

export default router;
