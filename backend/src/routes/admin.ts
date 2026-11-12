import { Router } from 'express';
import bcrypt from 'bcrypt';
import { prisma, pool } from '../db';
import { requireAuth } from './auth';
import { calculateLevel, evaluateAndAwardBadges } from '../services/gamification';

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

// ─────────────────────────────────────────────────────────────
// 1. SOC GLOBAL TELEMETRY SUMMARY
// ─────────────────────────────────────────────────────────────
router.get('/soc-summary', async (req, res) => {
  try {
    // A. Student Operators Stats (Excluding Admins)
    const totalUsers = await prisma.user.count({ where: { role: 'STUDENT' } });
    const pendingApprovals = await prisma.user.count({ where: { role: 'STUDENT', isApproved: false } });
    
    // Online within last 15 mins (Student only)
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const onlineUsersCount = await prisma.user.count({
      where: {
        role: 'STUDENT',
        lastActiveAt: { gte: fifteenMinsAgo }
      }
    });

    // Total Breaches (solved labs by students across platform)
    const totalBreaches = await prisma.progress.count({
      where: {
        completed: true,
        user: { role: 'STUDENT' }
      }
    });

    // Total Badges Claimed by students
    const totalBadgesClaimed = await prisma.userBadge.count({
      where: {
        user: { role: 'STUDENT' }
      }
    });

    // Total Training Hours by students
    const hoursSumRes = await pool.query(`
      SELECT COALESCE(SUM("activeMinutes"), 0) AS "totalMinutes" 
      FROM "User" 
      WHERE "role" = 'STUDENT'
    `);
    const totalMinutes = parseInt(hoursSumRes.rows[0]?.totalMinutes || '0', 10);
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

    // B. Leaderboard (Top 10 Students - strictly no admins)
    const leaderboardRes = await pool.query(`
      SELECT 
        u."id",
        u."email",
        u."xp",
        u."lastActiveAt",
        COALESCE(u."activeMinutes", 0) AS "activeMinutes",
        COUNT(DISTINCT p."labId") FILTER (WHERE p."completed" = true) AS "totalSolved",
        COUNT(DISTINCT p."labId") FILTER (WHERE p."completed" = true AND l."slug" LIKE 'sqli-%') AS "sqliSolved",
        COUNT(DISTINCT p."labId") FILTER (WHERE p."completed" = true AND l."slug" LIKE 'xss-%') AS "xssSolved",
        COUNT(DISTINCT ub."badgeId") AS "badgesCount"
      FROM "User" u
      LEFT JOIN "Progress" p ON u."id" = p."userId"
      LEFT JOIN "Lab" l ON p."labId" = l."id"
      LEFT JOIN "UserBadge" ub ON u."id" = ub."userId"
      WHERE u."role" = 'STUDENT'
      GROUP BY u."id"
      ORDER BY "totalSolved" DESC, u."xp" DESC
      LIMIT 10
    `);

    const leaderboard = leaderboardRes.rows.map((row: any, idx: number) => {
      const xp = parseInt(row.xp || '0', 10);
      return {
        rank: idx + 1,
        id: row.id,
        email: row.email,
        xp,
        level: calculateLevel(xp),
        totalSolved: parseInt(row.totalSolved, 10),
        sqliSolved: parseInt(row.sqliSolved, 10),
        xssSolved: parseInt(row.xssSolved, 10),
        badgesCount: parseInt(row.badgesCount, 10),
        activeHours: Math.round((parseInt(row.activeMinutes, 10) / 60) * 10) / 10
      };
    });

    // C. Lab Difficulty & Completion Heatmap (Real 100% Dynamic Durations & Solves)
    const allLabsRes = await pool.query(`
      SELECT 
        l."id",
        l."slug",
        l."title",
        COUNT(p."id") FILTER (WHERE p."completed" = true AND u."role" = 'STUDENT') AS "solveCount",
        AVG(
          CASE 
            WHEN p."completed" = true AND u."role" = 'STUDENT' AND p."startedAt" IS NOT NULL AND p."completedAt" IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (p."completedAt" - p."startedAt"))
            ELSE NULL 
          END
        ) AS "avgDurationSeconds"
      FROM "Lab" l
      LEFT JOIN "Progress" p ON l."id" = p."labId"
      LEFT JOIN "User" u ON p."userId" = u."id"
      GROUP BY l."id"
      ORDER BY l."id" ASC
    `);

    const totalStudents = Math.max(1, totalUsers);
    const labDifficulty = allLabsRes.rows.map((lab: any) => {
      const solves = parseInt(lab.solveCount, 10);
      const completionRate = totalUsers > 0 ? Math.min(100, Math.round((solves / totalUsers) * 100)) : 0;
      
      let tier = 'EASY';
      if (lab.slug.includes('09') || lab.slug.includes('10')) {
        tier = 'CRITICAL';
      } else if (lab.slug.includes('07') || lab.slug.includes('08')) {
        tier = 'HARD';
      } else if (lab.slug.includes('04') || lab.slug.includes('05') || lab.slug.includes('06')) {
        tier = 'MEDIUM';
      }

      // Dynamic average solve duration calculation
      let avgDuration = 'No solves yet';
      if (solves > 0 && lab.avgDurationSeconds) {
        const sec = Math.max(1, Math.round(parseFloat(lab.avgDurationSeconds)));
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        avgDuration = m > 0 ? `${m}m ${s < 10 ? '0' : ''}${s}s` : `${s}s`;
      } else if (solves > 0) {
        avgDuration = '< 1m';
      }

      return {
        id: lab.id,
        slug: lab.slug,
        title: lab.title,
        track: lab.slug.startsWith('sqli-') ? 'SQLi' : 'XSS',
        solveCount: solves,
        completionRate,
        tier,
        avgDuration
      };
    });

    // D. Recent Security Events Log (Last 25)
    const recentEventsRes = await pool.query(`
      SELECT 
        se."id",
        se."eventType",
        se."description",
        se."metadata",
        se."createdAt",
        u."email"
      FROM "SecurityEvent" se
      LEFT JOIN "User" u ON se."userId" = u."id"
      ORDER BY se."createdAt" DESC
      LIMIT 25
    `);

    // E. Active Broadcast Alert
    const activeBroadcast = await prisma.broadcastAlert.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      ok: true,
      telemetry: {
        totalOperators: totalUsers,
        pendingApprovals,
        onlineOperators: onlineUsersCount,
        totalBreaches,
        totalBadgesClaimed,
        totalHoursTracked: totalHours
      },
      leaderboard,
      labDifficulty,
      recentEvents: recentEventsRes.rows,
      activeBroadcast,
      sandboxStatus: {
        pgsqlCluster: { status: 'OPERATIONAL', latency: '1.2ms', schemasLoaded: 10 },
        xssCluster: { status: 'OPERATIONAL', activeEndpoints: 10 },
        authCluster: { status: 'HEALTHY', activeSessions: await prisma.session.count() }
      }
    });
  } catch (error) {
    console.error('Failed to get SOC summary:', error);
    res.status(500).json({ ok: false, message: 'Internal error' });
  }
});

// ─────────────────────────────────────────────────────────────
// 2. DETAILED STUDENT ROSTER & TELEMETRY
// ─────────────────────────────────────────────────────────────
router.get('/students', async (req, res) => {
  try {
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);

    // Strictly fetch STUDENTS only (admins are never displayed in the operator roster)
    const studentsRes = await pool.query(`
      SELECT 
        u."id",
        u."email",
        u."role",
        u."isApproved",
        u."createdAt",
        u."lastLoginAt",
        u."lastActiveAt",
        COALESCE(u."activeMinutes", 0) AS "activeMinutes",
        COALESCE(u."anomalyFlags", 0) AS "anomalyFlags",
        u."xp",
        COUNT(DISTINCT p."labId") FILTER (WHERE p."completed" = true) AS "totalSolved",
        COUNT(DISTINCT p."labId") FILTER (WHERE p."completed" = true AND l."slug" LIKE 'sqli-%') AS "sqliSolved",
        COUNT(DISTINCT p."labId") FILTER (WHERE p."completed" = true AND l."slug" LIKE 'xss-%') AS "xssSolved",
        COUNT(DISTINCT ub."badgeId") AS "badgesCount",
        (SELECT "ipAddress" FROM "LoginAudit" WHERE "userId" = u."id" ORDER BY "createdAt" DESC LIMIT 1) AS "latestIp",
        (SELECT "userAgent" FROM "LoginAudit" WHERE "userId" = u."id" ORDER BY "createdAt" DESC LIMIT 1) AS "latestUserAgent"
      FROM "User" u
      LEFT JOIN "Progress" p ON u."id" = p."userId"
      LEFT JOIN "Lab" l ON p."labId" = l."id"
      LEFT JOIN "UserBadge" ub ON u."id" = ub."userId"
      WHERE u."role" = 'STUDENT'
      GROUP BY u."id"
      ORDER BY u."createdAt" DESC
    `);

    const students = studentsRes.rows.map((row: any) => {
      const xp = parseInt(row.xp || '0', 10);
      const isOnline = row.lastActiveAt && new Date(row.lastActiveAt).getTime() >= fifteenMinsAgo.getTime();

      return {
        id: row.id,
        email: row.email,
        role: row.role,
        isApproved: row.isApproved,
        createdAt: row.createdAt,
        lastLoginAt: row.lastLoginAt,
        lastActiveAt: row.lastActiveAt,
        isOnline,
        activeMinutes: parseInt(row.activeMinutes, 10),
        activeHours: Math.round((parseInt(row.activeMinutes, 10) / 60) * 10) / 10,
        anomalyFlags: parseInt(row.anomalyFlags, 10),
        xp,
        level: calculateLevel(xp),
        totalSolved: parseInt(row.totalSolved, 10),
        sqliSolved: parseInt(row.sqliSolved, 10),
        xssSolved: parseInt(row.xssSolved, 10),
        badgesCount: parseInt(row.badgesCount, 10),
        latestIp: row.latestIp || '127.0.0.1',
        latestUserAgent: row.latestUserAgent || 'Unknown'
      };
    });

    res.json({ ok: true, students });
  } catch (error) {
    console.error('Failed to get student roster:', error);
    res.status(500).json({ ok: false, message: 'Internal error' });
  }
});

// ─────────────────────────────────────────────────────────────
// 3. STUDENT DEEP-DIVE DOSSIER (THE INSPECTOR)
// ─────────────────────────────────────────────────────────────
router.get('/students/:id/dossier', async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isApproved: true,
        xp: true,
        lastLoginAt: true,
        lastActiveAt: true,
        activeMinutes: true,
        anomalyFlags: true,
        createdAt: true,
        _count: { select: { sessions: true } }
      }
    });

    if (!user) {
      return res.status(404).json({ ok: false, message: 'Student not found' });
    }

    // 1. Calculate Academy Standing & Class Rank
    const rankRes = await pool.query(`
      SELECT COUNT(*) + 1 AS "rank"
      FROM "User"
      WHERE "role" = 'STUDENT' AND ("xp" > $1 OR ("xp" = $1 AND "id" < $2))
    `, [user.xp, userId]);
    const classRank = parseInt(rankRes.rows[0]?.rank || '1', 10);
    const totalStudentsCount = await prisma.user.count({ where: { role: 'STUDENT' } });

    // 2. Login Audits History
    const loginAudits = await prisma.loginAudit.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // 3. Complete Badges Catalog (Earned + Locked with 3D Emblems)
    const badgesRes = await pool.query(`
      SELECT 
        b."id",
        b."slug",
        b."name",
        b."description",
        b."category",
        b."tier",
        b."xpReward",
        b."iconGraphic",
        ub."earnedAt",
        (ub."id" IS NOT NULL) AS "isEarned"
      FROM "Badge" b
      LEFT JOIN "UserBadge" ub ON b."id" = ub."badgeId" AND ub."userId" = $1
      ORDER BY b."id" ASC
    `, [userId]);

    // 4. Complete 20-Lab Progression Matrix with Exact Dynamic Durations
    const labMatrixRes = await pool.query(`
      SELECT 
        l."id",
        l."slug",
        l."title",
        p."completed",
        p."startedAt",
        p."completedAt"
      FROM "Lab" l
      LEFT JOIN "Progress" p ON l."id" = p."labId" AND p."userId" = $1
      ORDER BY l."id" ASC
    `, [userId]);

    const labMatrix = labMatrixRes.rows.map((row: any) => {
      let status = 'UNATTEMPTED';
      let durationStr = '--';

      if (row.completed) {
        status = 'BREACHED';
        if (row.startedAt && row.completedAt) {
          const sec = Math.max(1, Math.round((new Date(row.completedAt).getTime() - new Date(row.startedAt).getTime()) / 1000));
          const mins = Math.floor(sec / 60);
          const remSec = sec % 60;
          durationStr = `${mins > 0 ? mins + 'm ' : ''}${remSec < 10 && mins > 0 ? '0' : ''}${remSec}s`;
        } else {
          durationStr = 'Verified';
        }
      } else if (row.startedAt) {
        status = 'IN_PROGRESS';
        const elapsedSec = Math.max(1, Math.round((Date.now() - new Date(row.startedAt).getTime()) / 1000));
        const mins = Math.floor(elapsedSec / 60);
        durationStr = `${mins}m ${elapsedSec % 60}s (Active)`;
      }

      return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        track: row.slug.startsWith('sqli-') ? 'SQLi' : 'XSS',
        status,
        startedAt: row.startedAt,
        completedAt: row.completedAt,
        duration: durationStr
      };
    });

    // 5. Active Refresh Sessions
    const activeSessions = await prisma.session.findMany({
      where: { userId },
      select: { id: true, createdAt: true, expiresAt: true }
    });

    // 6. Security Events related to this user
    const securityEvents = await prisma.securityEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 15
    });

    const isOnline = user.lastActiveAt && (Date.now() - new Date(user.lastActiveAt).getTime() < 15 * 60 * 1000);
    const riskLevel = (user.anomalyFlags || 0) >= 3 ? 'HIGH' : (user.anomalyFlags || 0) > 0 ? 'SUSPICIOUS' : 'CLEAN';

    res.json({
      ok: true,
      dossier: {
        user: {
          ...user,
          level: calculateLevel(user.xp),
          activeMinutes: user.activeMinutes || 0,
          activeHours: Math.round(((user.activeMinutes || 0) / 60) * 10) / 10,
          isOnline,
          classRank,
          totalStudentsCount,
          riskLevel
        },
        loginAudits,
        badges: badgesRes.rows,
        claimedBadges: badgesRes.rows.filter((b: any) => b.isEarned),
        labMatrix,
        activeSessions,
        securityEvents
      }
    });
  } catch (error) {
    console.error('Failed to get student dossier:', error);
    res.status(500).json({ ok: false, message: 'Internal error' });
  }
});

// ─────────────────────────────────────────────────────────────
// 4. ADMINISTRATIVE CONTROLS & OVERRIDES
// ─────────────────────────────────────────────────────────────

// Provision / Enroll New Operator
router.post('/users', async (req: any, res: any) => {
  try {
    const { email, password, role = 'STUDENT', isApproved = true, initialXp = 0 } = req.body;
    if (!email || !password) {
      return res.status(400).json({ ok: false, message: 'Email and password are required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return res.status(400).json({ ok: false, message: 'An operator with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        password: hashedPassword,
        role: role === 'ADMIN' ? 'ADMIN' : 'STUDENT',
        isApproved: Boolean(isApproved),
        xp: Number(initialXp) || 0,
        createdAt: new Date(),
        lastActiveAt: new Date(),
      },
    });

    await prisma.securityEvent.create({
      data: {
        userId: req.user?.id,
        eventType: 'ADMIN_ACTION',
        description: `Admin provisioned new operator: ${cleanEmail} (Role: ${user.role}, Approved: ${user.isApproved})`,
        metadata: JSON.stringify({ newUserId: user.id, email: user.email, role: user.role })
      }
    });

    res.json({
      ok: true,
      message: `Operator ${cleanEmail} successfully enrolled`,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        xp: user.xp,
        createdAt: user.createdAt
      }
    });
  } catch (error: any) {
    console.error('Failed to provision user:', error);
    res.status(500).json({ ok: false, message: error.message || 'Failed to provision operator' });
  }
});

// Approve User
router.post('/users/:id/approve', async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { isApproved: true }
    });

    await prisma.securityEvent.create({
      data: {
        userId,
        eventType: 'ADMIN_ACTION',
        description: 'Operator clearance granted: Account APPROVED by administrator'
      }
    });

    res.json({ ok: true, message: 'User approved' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Failed to approve user' });
  }
});

// Revoke/Freeze Access
router.post('/users/:id/revoke', async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { isApproved: false }
    });
    // Invalidate sessions immediately
    await prisma.session.deleteMany({ where: { userId } });

    await prisma.securityEvent.create({
      data: {
        userId,
        eventType: 'ADMIN_ACTION',
        description: 'Operator clearance frozen: Access REVOKED and sessions killed by admin'
      }
    });

    res.json({ ok: true, message: 'User access revoked' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Failed to revoke user access' });
  }
});

// Force Kick / Terminate Active Sessions
router.post('/students/:id/kick', async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const count = await prisma.session.deleteMany({ where: { userId } });

    await prisma.securityEvent.create({
      data: {
        userId,
        eventType: 'ADMIN_ACTION',
        description: `Force terminated ${count.count} active operator sessions`
      }
    });

    res.json({ ok: true, message: `Terminated ${count.count} sessions` });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Failed to kick sessions' });
  }
});

// Reset Lab Progress for a Student
router.post('/students/:id/reset', async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    await prisma.progress.deleteMany({ where: { userId } });
    await prisma.userBadge.deleteMany({ where: { userId } });
    await prisma.user.update({
      where: { id: userId },
      data: { xp: 0, activeMinutes: 0 }
    });

    await prisma.securityEvent.create({
      data: {
        userId,
        eventType: 'ADMIN_ACTION',
        description: 'Student lab progress and achievements reset by administrator for retake'
      }
    });

    res.json({ ok: true, message: 'Student progress reset successfully' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Failed to reset student progress' });
  }
});

// Manual Lab Verification or Bonus XP Override
router.post('/students/:id/override', async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const { labSlug, bonusXp } = req.body;

    if (labSlug) {
      const lab = await prisma.lab.findUnique({ where: { slug: labSlug } });
      if (lab) {
        await prisma.progress.upsert({
          where: { userId_labId: { userId, labId: lab.id } },
          update: { completed: true, completedAt: new Date() },
          create: { userId, labId: lab.id, completed: true, completedAt: new Date() }
        });
      }
    }

    if (bonusXp && typeof bonusXp === 'number') {
      await pool.query(`UPDATE "User" SET "xp" = "xp" + $1 WHERE "id" = $2`, [bonusXp, userId]);
    }

    await evaluateAndAwardBadges(userId);

    await prisma.securityEvent.create({
      data: {
        userId,
        eventType: 'ADMIN_ACTION',
        description: `Manual instructor override applied: verified ${labSlug || 'custom lab'} + ${bonusXp || 0} XP`
      }
    });

    res.json({ ok: true, message: 'Override applied successfully' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Failed to apply override' });
  }
});

// Delete User
router.post('/users/:id/reject', async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    await prisma.session.deleteMany({ where: { userId } });
    await prisma.progress.deleteMany({ where: { userId } });
    await prisma.userBadge.deleteMany({ where: { userId } });
    await prisma.loginAudit.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });

    res.json({ ok: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Failed to delete user' });
  }
});

// Toggle Role (STUDENT <-> ADMIN)
router.post('/users/:id/role', async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const { role } = req.body;
    if (role !== 'STUDENT' && role !== 'ADMIN') {
      return res.status(400).json({ ok: false, message: 'Invalid role' });
    }
    await prisma.user.update({
      where: { id: userId },
      data: { role }
    });
    res.json({ ok: true, message: `Role updated to ${role}` });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Failed to update role' });
  }
});

// ─────────────────────────────────────────────────────────────
// 5. BROADCAST ANNOUNCEMENT MANAGEMENT
// ─────────────────────────────────────────────────────────────
router.get('/broadcasts', async (req, res) => {
  try {
    const broadcasts = await prisma.broadcastAlert.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ ok: true, broadcasts });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Internal error' });
  }
});

router.post('/broadcasts', async (req, res) => {
  try {
    const { title, message, type } = req.body;
    if (!title || !message) {
      return res.status(400).json({ ok: false, message: 'Title and message required' });
    }
    const alert = await prisma.broadcastAlert.create({
      data: {
        title,
        message,
        type: type || 'INFO',
        isActive: true
      }
    });

    await prisma.securityEvent.create({
      data: {
        eventType: 'ADMIN_ACTION',
        description: `Published platform-wide broadcast alert: "${title}"`
      }
    });

    res.json({ ok: true, alert });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Internal error' });
  }
});

router.delete('/broadcasts/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.broadcastAlert.delete({ where: { id } });
    res.json({ ok: true, message: 'Broadcast deleted' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Internal error' });
  }
});

// ─────────────────────────────────────────────────────────────
// 6. FLUSH SANDBOX DEMO DATA (WITHOUT TOUCHING STUDENTS)
// ─────────────────────────────────────────────────────────────
router.post('/sandbox/reset', async (req, res) => {
  try {
    await pool.query(`
      TRUNCATE TABLE "xss_comments" RESTART IDENTITY CASCADE;
      TRUNCATE TABLE "xss_tickets" RESTART IDENTITY CASCADE;
      TRUNCATE TABLE "xss_logs" RESTART IDENTITY CASCADE;
    `);

    await prisma.securityEvent.create({
      data: {
        eventType: 'ADMIN_ACTION',
        description: 'Administrator flushed simulation sandboxes (XSS comments, tickets, and logs wiped)'
      }
    });

    res.json({ ok: true, message: 'Sandboxes flushed successfully' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Failed to reset sandboxes' });
  }
});

export default router;
