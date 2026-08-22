import { Router } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../db';
import { requireAuth } from './auth';

const router = Router();

// Middleware to ensure user is an ADMIN
const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ ok: false, message: 'Forbidden: Admin access required' });
  }
  next();
};

router.use(requireAuth);
router.use(requireAdmin);

// 1. Get all users with their progress
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        isApproved: true,
        createdAt: true,
        _count: {
          select: { progress: { where: { completed: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ ok: true, users });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    res.status(500).json({ ok: false, message: 'Internal error' });
  }
});

// 2. Approve a user
router.post('/users/:id/approve', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isApproved: true }
    });
    res.json({ ok: true, message: 'User approved' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Failed to approve user' });
  }
});

// 3. Reject/Delete a user
router.post('/users/:id/reject', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Delete their progress first (foreign key constraint)
    await prisma.progress.deleteMany({ where: { userId } });
    
    // Delete the user
    await prisma.user.delete({ where: { id: userId } });
    
    res.json({ ok: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Failed to delete user' });
  }
});

// 4. Create a new approved user
router.post('/users', async (req, res) => {
  try {
    const { email, password, role = 'STUDENT' } = req.body;
    
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ ok: false, message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
        isApproved: true, // Created by admin, automatically approved
      },
      select: {
        id: true,
        email: true,
        role: true,
        isApproved: true,
      }
    });

    res.json({ ok: true, user });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Failed to create user' });
  }
});

export default router;
