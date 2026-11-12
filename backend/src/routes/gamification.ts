import { Router } from 'express';
import { requireAuth } from './auth';
import { getUserGamificationSummary, claimBadge } from '../services/gamification';

const router = Router();

router.use(requireAuth);

// GET /api/gamification/summary - Retrieve full stats, badges, and claimable state
router.get('/summary', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const summary = await getUserGamificationSummary(userId);
    if (!summary) {
      return res.status(404).json({ ok: false, message: 'User profile not found' });
    }
    res.json({ ok: true, ...summary });
  } catch (error) {
    console.error('Failed to get gamification summary:', error);
    res.status(500).json({ ok: false, message: 'Internal error' });
  }
});

// POST /api/gamification/claim - Manually claim an unlocked badge and award its XP
router.post('/claim', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { badgeSlug, badgeId } = req.body;
    const identifier = badgeSlug || badgeId;
    if (!identifier) {
      return res.status(400).json({ ok: false, message: 'Missing badge identifier' });
    }

    const result = await claimBadge(userId, identifier);
    if (!result.ok) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('Failed to claim badge:', error);
    res.status(500).json({ ok: false, message: 'Internal server error claiming badge' });
  }
});

export default router;
