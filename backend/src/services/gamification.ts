import { pool } from '../db';

export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1;
}

export function calculateNextLevelXp(level: number): number {
  return level * level * 100;
}

export function calculateCurrentLevelBaseXp(level: number): number {
  return (level - 1) * (level - 1) * 100;
}

export function getRankTitle(level: number, completedCount: number): string {
  if (completedCount >= 20) return '[GRANDMASTER OPERATOR]';
  if (completedCount >= 15 || level >= 6) return '[ELITE OPERATOR]';
  if (completedCount >= 10 || level >= 4) return '[BUG HUNTER]';
  if (completedCount >= 5 || level >= 3) return '[PEN TESTER]';
  if (completedCount >= 1 || level >= 2) return '[SECURITY CADET]';
  return '[TRAINEE]';
}

export async function evaluateAndAwardBadges(userId: number) {
  // Get all completed labs for this user
  const progressRes = await pool.query(`
    SELECT p."completed", l."slug"
    FROM "Progress" p
    JOIN "Lab" l ON p."labId" = l."id"
    WHERE p."userId" = $1 AND p."completed" = true
  `, [userId]);

  const completedSlugs = new Set(progressRes.rows.map((r: any) => r.slug));
  const totalCompleted = completedSlugs.size;
  const sqliCompleted = [...completedSlugs].filter((s: any) => s.startsWith('sqli-')).length;
  const xssCompleted = [...completedSlugs].filter((s: any) => s.startsWith('xss-')).length;

  // Get badges user already earned/claimed
  const earnedRes = await pool.query(`
    SELECT "badgeId" FROM "UserBadge" WHERE "userId" = $1
  `, [userId]);
  const earnedBadgeIds = new Set(earnedRes.rows.map((r: any) => r.badgeId));

  // Get all badges
  const allBadgesRes = await pool.query(`SELECT * FROM "Badge"`);
  const newlyUnlockedBadges: any[] = [];

  for (const badge of allBadgesRes.rows) {
    if (earnedBadgeIds.has(badge.id)) continue;

    let isUnlocked = false;
    const targetVal = parseInt(badge.criteriaValue, 10);

    switch (badge.criteriaType) {
      case 'TOTAL_COUNT':
        if (totalCompleted >= targetVal) isUnlocked = true;
        break;
      case 'SQLI_COUNT':
        if (sqliCompleted >= targetVal) isUnlocked = true;
        break;
      case 'XSS_COUNT':
        if (xssCompleted >= targetVal) isUnlocked = true;
        break;
      case 'DUAL_TRACK':
        if (sqliCompleted >= targetVal && xssCompleted >= targetVal) isUnlocked = true;
        break;
      case 'SPECIFIC_LAB':
        const required = badge.criteriaValue.split(',');
        if (required.some((reqSlug: string) => completedSlugs.has(reqSlug.trim()))) {
          isUnlocked = true;
        }
        break;
    }

    // Do NOT auto-insert or auto-add XP here! Badges must be manually claimed by the student.
    if (isUnlocked) {
      newlyUnlockedBadges.push({
        id: badge.id,
        slug: badge.slug,
        name: badge.name,
        description: badge.description,
        tier: badge.tier,
        category: badge.category,
        xpReward: badge.xpReward,
        iconGraphic: badge.iconGraphic,
        isEarned: false,
        isClaimable: true
      });
    }
  }

  const userRes = await pool.query(`SELECT "xp" FROM "User" WHERE "id" = $1`, [userId]);
  const totalXp = userRes.rows[0]?.xp || 0;
  const level = calculateLevel(totalXp);
  const nextLevelXp = calculateNextLevelXp(level);
  const currentBaseXp = calculateCurrentLevelBaseXp(level);
  const rankTitle = getRankTitle(level, totalCompleted);

  return {
    newlyUnlockedBadges,
    newlyEarnedBadges: newlyUnlockedBadges, // backward compatibility
    totalXp,
    level,
    nextLevelXp,
    currentBaseXp,
    rankTitle,
    totalCompleted,
    sqliCompleted,
    xssCompleted
  };
}

export async function claimBadge(userId: number, badgeIdentifier: string | number) {
  // 1. Find badge
  const isNumeric = !isNaN(Number(badgeIdentifier));
  const badgeRes = await pool.query(
    isNumeric 
      ? `SELECT * FROM "Badge" WHERE "id" = $1` 
      : `SELECT * FROM "Badge" WHERE "slug" = $1`,
    [badgeIdentifier]
  );
  const badge = badgeRes.rows[0];
  if (!badge) {
    return { ok: false, message: 'Badge not found' };
  }

  // 2. Check if already claimed
  const earnedRes = await pool.query(
    `SELECT * FROM "UserBadge" WHERE "userId" = $1 AND "badgeId" = $2`,
    [userId, badge.id]
  );
  if (earnedRes.rows.length > 0) {
    return { ok: false, message: 'Badge has already been claimed' };
  }

  // 3. Verify criteria is actually met
  const progressRes = await pool.query(`
    SELECT p."completed", l."slug"
    FROM "Progress" p
    JOIN "Lab" l ON p."labId" = l."id"
    WHERE p."userId" = $1 AND p."completed" = true
  `, [userId]);

  const completedSlugs = new Set(progressRes.rows.map((r: any) => r.slug));
  const totalCompleted = completedSlugs.size;
  const sqliCompleted = [...completedSlugs].filter((s: any) => s.startsWith('sqli-')).length;
  const xssCompleted = [...completedSlugs].filter((s: any) => s.startsWith('xss-')).length;

  let isCriteriaMet = false;
  const targetVal = parseInt(badge.criteriaValue, 10);

  switch (badge.criteriaType) {
    case 'TOTAL_COUNT':
      if (totalCompleted >= targetVal) isCriteriaMet = true;
      break;
    case 'SQLI_COUNT':
      if (sqliCompleted >= targetVal) isCriteriaMet = true;
      break;
    case 'XSS_COUNT':
      if (xssCompleted >= targetVal) isCriteriaMet = true;
      break;
    case 'DUAL_TRACK':
      if (sqliCompleted >= targetVal && xssCompleted >= targetVal) isCriteriaMet = true;
      break;
    case 'SPECIFIC_LAB':
      const required = badge.criteriaValue.split(',');
      if (required.some((reqSlug: string) => completedSlugs.has(reqSlug.trim()))) {
        isCriteriaMet = true;
      }
      break;
  }

  if (!isCriteriaMet) {
    return { ok: false, message: 'Criteria for this badge have not been satisfied yet' };
  }

  // 4. Record the claim in UserBadge
  await pool.query(
    `INSERT INTO "UserBadge" ("userId", "badgeId", "earnedAt") VALUES ($1, $2, NOW())`,
    [userId, badge.id]
  );

  // 5. Award the XP to User
  await pool.query(
    `UPDATE "User" SET "xp" = "xp" + $1 WHERE "id" = $2`,
    [badge.xpReward, userId]
  );

  // 6. Record SecurityEvent for audit log
  await pool.query(
    `INSERT INTO "SecurityEvent" ("userId", "eventType", "description", "metadata", "createdAt")
     VALUES ($1, 'BADGE_CLAIMED', $2, $3, NOW())`,
    [
      userId,
      `Official Honor Claimed: ${badge.name} (+${badge.xpReward} XP)`,
      JSON.stringify({ badgeId: badge.id, slug: badge.slug, tier: badge.tier, xpReward: badge.xpReward })
    ]
  );

  // 7. Get updated user stats
  const userRes = await pool.query(`SELECT "xp" FROM "User" WHERE "id" = $1`, [userId]);
  const totalXp = userRes.rows[0]?.xp || 0;
  const level = calculateLevel(totalXp);
  const nextLevelXp = calculateNextLevelXp(level);
  const currentBaseXp = calculateCurrentLevelBaseXp(level);
  const rankTitle = getRankTitle(level, totalCompleted);

  return {
    ok: true,
    claimedBadge: {
      id: badge.id,
      slug: badge.slug,
      name: badge.name,
      description: badge.description,
      tier: badge.tier,
      category: badge.category,
      xpReward: badge.xpReward,
      iconGraphic: badge.iconGraphic,
      isEarned: true,
      earnedAt: new Date().toISOString()
    },
    user: {
      xp: totalXp,
      level,
      nextLevelXp,
      currentBaseXp,
      levelProgressPercent: Math.min(100, Math.round(((totalXp - currentBaseXp) / Math.max(1, nextLevelXp - currentBaseXp)) * 100)),
      rankTitle
    }
  };
}

export async function getUserGamificationSummary(userId: number) {
  // 1. Get user xp
  const userRes = await pool.query(`SELECT "id", "email", "xp" FROM "User" WHERE "id" = $1`, [userId]);
  const user = userRes.rows[0];
  if (!user) return null;

  const totalXp = user.xp || 0;
  const level = calculateLevel(totalXp);
  const nextLevelXp = calculateNextLevelXp(level);
  const currentBaseXp = calculateCurrentLevelBaseXp(level);

  // 2. Get user's completed labs
  const progressRes = await pool.query(`
    SELECT p."completed", l."slug"
    FROM "Progress" p
    JOIN "Lab" l ON p."labId" = l."id"
    WHERE p."userId" = $1 AND p."completed" = true
  `, [userId]);

  const completedSlugs = new Set(progressRes.rows.map((r: any) => r.slug));
  const totalCompleted = completedSlugs.size;
  const sqliCompleted = [...completedSlugs].filter((s: any) => s.startsWith('sqli-')).length;
  const xssCompleted = [...completedSlugs].filter((s: any) => s.startsWith('xss-')).length;

  const rankTitle = getRankTitle(level, totalCompleted);

  // 3. Get all badges joined with user's earned badges
  const badgesRes = await pool.query(`
    SELECT 
      b.*,
      ub."earnedAt" IS NOT NULL AS "isEarned",
      ub."earnedAt"
    FROM "Badge" b
    LEFT JOIN "UserBadge" ub ON b."id" = ub."badgeId" AND ub."userId" = $1
    ORDER BY b."id" ASC
  `, [userId]);

  const badges = badgesRes.rows.map((b: any) => {
    // Calculate progress towards unlocking this badge
    let progressCurrent = 0;
    let progressTarget = 1;

    switch (b.criteriaType) {
      case 'TOTAL_COUNT':
        progressTarget = parseInt(b.criteriaValue, 10);
        progressCurrent = Math.min(totalCompleted, progressTarget);
        break;
      case 'SQLI_COUNT':
        progressTarget = parseInt(b.criteriaValue, 10);
        progressCurrent = Math.min(sqliCompleted, progressTarget);
        break;
      case 'XSS_COUNT':
        progressTarget = parseInt(b.criteriaValue, 10);
        progressCurrent = Math.min(xssCompleted, progressTarget);
        break;
      case 'DUAL_TRACK':
        progressTarget = parseInt(b.criteriaValue, 10);
        progressCurrent = Math.min(Math.min(sqliCompleted, xssCompleted), progressTarget);
        break;
      case 'SPECIFIC_LAB':
        const reqs = b.criteriaValue.split(',');
        progressTarget = 1;
        progressCurrent = reqs.some((req: string) => completedSlugs.has(req.trim())) ? 1 : 0;
        break;
    }

    const isCriteriaMet = progressCurrent >= progressTarget;
    const isEarned = !!b.isEarned;
    const isClaimable = !isEarned && isCriteriaMet;
    const isLocked = !isEarned && !isCriteriaMet;

    return {
      id: b.id,
      slug: b.slug,
      name: b.name,
      description: b.description,
      category: b.category,
      tier: b.tier,
      xpReward: b.xpReward,
      iconGraphic: b.iconGraphic,
      isEarned,
      isClaimable,
      isLocked,
      earnedAt: b.earnedAt,
      progress: {
        current: progressCurrent,
        target: progressTarget,
        percentage: Math.min(100, Math.round((progressCurrent / progressTarget) * 100))
      }
    };
  });

  const earnedCount = badges.filter((b: any) => b.isEarned).length;
  const claimableCount = badges.filter((b: any) => b.isClaimable).length;

  return {
    user: {
      id: user.id,
      email: user.email,
      xp: totalXp,
      level,
      nextLevelXp,
      currentBaseXp,
      levelProgressPercent: Math.min(100, Math.round(((totalXp - currentBaseXp) / Math.max(1, nextLevelXp - currentBaseXp)) * 100)),
      rankTitle,
      stats: {
        rank: '#1',
        streak: 3,
        totalCompleted,
        sqliCompleted,
        xssCompleted,
        earnedBadgesCount: earnedCount,
        claimableBadgesCount: claimableCount,
        totalBadgesCount: badges.length
      }
    },
    badges
  };
}
