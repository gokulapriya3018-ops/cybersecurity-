import { Router } from 'express';
import crypto from 'crypto';
import { prisma, pool } from '../db';
import { requireAuth } from './auth';
import { evaluateAndAwardBadges } from '../services/gamification';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-csa-key-2024';

router.use(requireAuth);

// 1. Get all progress for current logged-in user
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

// 2. Request a signed verification token for an XSS lab
router.get('/token', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const labSlug = req.query.labSlug as string;

    if (!labSlug) {
      return res.status(400).json({ ok: false, message: 'labSlug parameter is required' });
    }

    // Ensure lab exists and mark startedAt if not set
    let lab = await prisma.lab.findUnique({ where: { slug: labSlug } });
    if (!lab) {
      lab = await prisma.lab.create({
        data: {
          slug: labSlug,
          title: labSlug.toUpperCase().replace(/-/g, ' '),
          description: 'Lab Module'
        }
      });
    }

    const existingProg = await prisma.progress.findUnique({
      where: { userId_labId: { userId, labId: lab.id } }
    });

    if (!existingProg) {
      await prisma.progress.create({
        data: { userId, labId: lab.id, completed: false, startedAt: new Date() }
      });
    } else if (!existingProg.completed) {
      // If previous attempt was over 3 hours ago, refresh startedAt
      const hoursAgo = (Date.now() - new Date(existingProg.startedAt).getTime()) / (1000 * 60 * 60);
      if (hoursAgo > 3) {
        await prisma.progress.update({
          where: { id: existingProg.id },
          data: { startedAt: new Date() }
        });
      }
    }

    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour expiry
    const message = `${userId}:${labSlug}:${expiresAt}`;
    
    // Generate HMAC signature using JWT_SECRET
    const hmac = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(message)
      .digest('hex');

    const signedToken = `${message}:${hmac}`;
    res.json({ ok: true, token: signedToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: 'Failed to generate token' });
  }
});

// 2.5 Start an offensive lab session to accurately track duration
router.post('/start', async (req: any, res) => {
  try {
    const sessionUserId = req.user.id;
    const { labSlug } = req.body;

    if (!labSlug) {
      return res.status(400).json({ ok: false, message: 'labSlug is required' });
    }

    let lab = await prisma.lab.findUnique({ where: { slug: labSlug } });
    if (!lab) {
      lab = await prisma.lab.create({
        data: {
          slug: labSlug,
          title: labSlug.toUpperCase().replace(/-/g, ' '),
          description: 'Lab Module'
        }
      });
    }

    const existing = await prisma.progress.findUnique({
      where: { userId_labId: { userId: sessionUserId, labId: lab.id } }
    });

    const now = new Date();
    if (!existing) {
      await prisma.progress.create({
        data: {
          userId: sessionUserId,
          labId: lab.id,
          completed: false,
          startedAt: now
        }
      });
    } else if (!existing.completed) {
      const hoursAgo = (now.getTime() - new Date(existing.startedAt).getTime()) / (1000 * 60 * 60);
      if (hoursAgo > 2) {
        await prisma.progress.update({
          where: { id: existing.id },
          data: { startedAt: now }
        });
      }
    }

    await prisma.user.update({
      where: { id: sessionUserId },
      data: { lastActiveAt: now }
    });

    res.json({ ok: true, message: 'Lab timer initialized', startedAt: now });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: 'Failed to start lab timer' });
  }
});

// 3. Complete a lab by submitting solve token or labSlug
router.post('/complete', async (req: any, res) => {
  try {
    const sessionUserId = req.user.id;
    const { token, labSlug: directLabSlug } = req.body;

    let targetSlug = directLabSlug;

    if (token) {
      const parts = token.split(':');
      if (parts.length === 4) {
        const [tokenUserIdStr, slugFromToken, expiresAtStr, hmacReceived] = parts;
        const tokenUserId = parseInt(tokenUserIdStr);
        const expiresAt = parseInt(expiresAtStr);

        const message = `${tokenUserId}:${slugFromToken}:${expiresAt}`;
        const hmacExpected = crypto
          .createHmac('sha256', JWT_SECRET)
          .update(message)
          .digest('hex');

        if (hmacReceived === hmacExpected && Date.now() <= expiresAt && tokenUserId === sessionUserId) {
          targetSlug = slugFromToken;
        }
      }
    }

    if (!targetSlug) {
      return res.status(400).json({ ok: false, message: 'Invalid or missing lab token/slug' });
    }

    // Find or create the lab entry
    let lab = await prisma.lab.findUnique({ where: { slug: targetSlug } });
    if (!lab) {
      lab = await prisma.lab.create({
        data: {
          slug: targetSlug,
          title: targetSlug.toUpperCase().replace(/-/g, ' '),
          description: 'Lab Module'
        }
      });
    }

    // Check if this lab was already completed before
    const existing = await prisma.progress.findUnique({
      where: { userId_labId: { userId: sessionUserId, labId: lab.id } }
    });
    const isFirstTimeSolved = !existing || !existing.completed;

    // Calculate dynamic duration in seconds
    const now = new Date();
    let durationSeconds = 1;
    let actualStartedAt = existing?.startedAt ? new Date(existing.startedAt) : null;

    if (actualStartedAt) {
      durationSeconds = Math.max(1, Math.round((now.getTime() - actualStartedAt.getTime()) / 1000));
      // Cap at reasonable max (e.g. 2 hours) if user left tab open overnight
      if (durationSeconds > 7200) durationSeconds = 900; 
    } else {
      // Default to 45 seconds if no start was recorded
      durationSeconds = 45;
      actualStartedAt = new Date(now.getTime() - 45 * 1000);
    }

    const durationMinutes = Math.floor(durationSeconds / 60);
    const durationRemSec = durationSeconds % 60;
    const durationStr = `${durationMinutes > 0 ? durationMinutes + 'm ' : ''}${durationRemSec}s`;

    // Mark lab completed for this user with exact timestamps
    const progress = await prisma.progress.upsert({
      where: { userId_labId: { userId: sessionUserId, labId: lab.id } },
      update: { 
        completed: true, 
        completedAt: now,
        startedAt: actualStartedAt
      },
      create: {
        userId: sessionUserId,
        labId: lab.id,
        completed: true,
        startedAt: actualStartedAt,
        completedAt: now
      }
    });

    // Award +100 XP if solved for the first time
    if (isFirstTimeSolved) {
      await pool.query(`UPDATE "User" SET "xp" = "xp" + 100 WHERE "id" = $1`, [sessionUserId]);
    }

    // Anti-cheat velocity check: if solved under 10 seconds for the first time
    const impossibleVelocity = isFirstTimeSolved && durationSeconds < 10;

    // Increment activeMinutes dynamically based on elapsed duration (at least 1 minute)
    const minutesToAdd = Math.max(1, Math.round(durationSeconds / 60));
    await prisma.user.update({
      where: { id: sessionUserId },
      data: {
        lastActiveAt: now,
        activeMinutes: { increment: minutesToAdd },
        ...(impossibleVelocity ? { anomalyFlags: { increment: 1 } } : {})
      }
    });

    // Record SecurityEvent for Lab Breach
    await prisma.securityEvent.create({
      data: {
        userId: sessionUserId,
        eventType: impossibleVelocity ? 'ANOMALY_WARNING' : 'LAB_BREACH',
        description: impossibleVelocity
          ? `Impossible velocity breach: solved ${lab.slug} in ${durationStr}`
          : `Breached sandbox environment ${lab.slug} in ${durationStr}`,
        metadata: JSON.stringify({ labSlug: lab.slug, duration: durationStr, isFirstTime: isFirstTimeSolved })
      }
    });

    // Evaluate newly unlocked badges waiting to be claimed
    const gamificationResult = await evaluateAndAwardBadges(sessionUserId);

    res.json({
      ok: true,
      progress,
      xpGained: isFirstTimeSolved ? 100 : 0,
      totalXp: gamificationResult.totalXp,
      level: gamificationResult.level,
      nextLevelXp: gamificationResult.nextLevelXp,
      newlyEarnedBadges: gamificationResult.newlyUnlockedBadges,
      newlyUnlockedBadges: gamificationResult.newlyUnlockedBadges
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: 'Internal error' });
  }
});

export default router;
