import { Router } from 'express';
import { prisma } from '../db';
import { requireAuth } from './auth';

const router = Router();

router.use(requireAuth);

router.get('/', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const progress = await prisma.progress.findMany({
      where: { userId },
      include: { lab: true }
    });
    res.json({ ok: true, progress });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: 'Internal error' });
  }
});

router.post('/complete', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { labSlug } = req.body; // e.g., 'sqli-01'

    let lab = await prisma.lab.findUnique({ where: { slug: labSlug } });
    if (!lab) {
      // Auto-create lab if it doesn't exist for simplicity
      lab = await prisma.lab.create({
        data: {
          slug: labSlug,
          title: labSlug,
          description: 'Auto-generated'
        }
      });
    }

    const progress = await prisma.progress.upsert({
      where: { userId_labId: { userId, labId: lab.id } },
      update: { completed: true, completedAt: new Date() },
      create: {
        userId,
        labId: lab.id,
        completed: true,
        completedAt: new Date()
      }
    });

    res.json({ ok: true, progress });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: 'Internal error' });
  }
});

export default router;
