import { pool } from './src/db';

const BADGES = [
  {
    slug: 'first-blood',
    name: 'First Blood',
    description: 'Breached your very first security sandbox on CyberForge.',
    category: 'GENERAL',
    tier: 'BRONZE',
    criteriaType: 'TOTAL_COUNT',
    criteriaValue: '1',
    xpReward: 100,
    iconGraphic: 'first-blood'
  },
  {
    slug: 'sqli-novice',
    name: 'Database Infiltrator',
    description: 'Infiltrated 3 backend databases using SQL injection vectors.',
    category: 'SQLI',
    tier: 'BRONZE',
    criteriaType: 'SQLI_COUNT',
    criteriaValue: '3',
    xpReward: 150,
    iconGraphic: 'sqli-novice'
  },
  {
    slug: 'fast-learner',
    name: 'Fast Learner',
    description: 'Rapidly mastered 5 offensive application security sandboxes.',
    category: 'MILESTONE',
    tier: 'SILVER',
    criteriaType: 'TOTAL_COUNT',
    criteriaValue: '5',
    xpReward: 250,
    iconGraphic: 'fast-learner'
  },
  {
    slug: 'cookie-monster',
    name: 'Cookie Monster',
    description: 'Intercepted and hijacked sessions via cookie and header manipulation.',
    category: 'MILESTONE',
    tier: 'SILVER',
    criteriaType: 'SPECIFIC_LAB',
    criteriaValue: 'sqli-07-cookie,xss-02-stored',
    xpReward: 200,
    iconGraphic: 'cookie-monster'
  },
  {
    slug: 'waf-bypass',
    name: 'WAF Evader',
    description: 'Evaded input filters and keyword blacklists with payload obfuscation.',
    category: 'MILESTONE',
    tier: 'SILVER',
    criteriaType: 'SPECIFIC_LAB',
    criteriaValue: 'sqli-05-filter,xss-05-blacklist',
    xpReward: 250,
    iconGraphic: 'waf-bypass'
  },
  {
    slug: 'xss-apprentice',
    name: 'DOM Manipulator',
    description: 'Executed client-side payloads across 3 Cross-Site Scripting sandboxes.',
    category: 'XSS',
    tier: 'BRONZE',
    criteriaType: 'XSS_COUNT',
    criteriaValue: '3',
    xpReward: 150,
    iconGraphic: 'xss-apprentice'
  },
  {
    slug: 'web-defender',
    name: 'Web Defender',
    description: 'Demonstrated broad mastery by solving 10+ total labs across both tracks.',
    category: 'MILESTONE',
    tier: 'SILVER',
    criteriaType: 'TOTAL_COUNT',
    criteriaValue: '10',
    xpReward: 300,
    iconGraphic: 'web-defender'
  },
  {
    slug: 'sqli-master',
    name: 'SQLi Master',
    description: 'Conquered all 10 SQL Injection labs from Auth Bypass to 2nd-Order.',
    category: 'SQLI',
    tier: 'GOLD',
    criteriaType: 'SQLI_COUNT',
    criteriaValue: '10',
    xpReward: 500,
    iconGraphic: 'sqli-master'
  },
  {
    slug: 'xss-slayer',
    name: 'XSS Slayer',
    description: 'Mastered all 10 Cross-Site Scripting labs including CSP and 2nd-Order queues.',
    category: 'XSS',
    tier: 'GOLD',
    criteriaType: 'XSS_COUNT',
    criteriaValue: '10',
    xpReward: 500,
    iconGraphic: 'xss-slayer'
  },
  {
    slug: 'second-order',
    name: 'Second-Order Spectre',
    description: 'Executed a multi-stage delayed exploitation attack against asynchronous queues.',
    category: 'MILESTONE',
    tier: 'PLATINUM',
    criteriaType: 'SPECIFIC_LAB',
    criteriaValue: 'sqli-10-second-order,xss-10-second-order',
    xpReward: 400,
    iconGraphic: 'second-order'
  },
  {
    slug: 'dual-threat',
    name: 'Dual Threat Operator',
    description: 'Achieved dual offensive capability: solved at least 5 SQLi and 5 XSS labs.',
    category: 'MILESTONE',
    tier: 'PLATINUM',
    criteriaType: 'DUAL_TRACK',
    criteriaValue: '5',
    xpReward: 450,
    iconGraphic: 'dual-threat'
  },
  {
    slug: 'grandmaster',
    name: 'Grandmaster of Web Exploits',
    description: 'Achieved 100% completion of the entire CyberForge curriculum (20/20 labs).',
    category: 'MILESTONE',
    tier: 'DIAMOND',
    criteriaType: 'TOTAL_COUNT',
    criteriaValue: '20',
    xpReward: 1000,
    iconGraphic: 'grandmaster'
  }
];

async function main() {
  console.log('🔄 Ensuring Badge schema in PostgreSQL...');
  
  // 1. Ensure columns and tables
  await pool.query(`
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "xp" INTEGER DEFAULT 0;

    CREATE TABLE IF NOT EXISTS "Badge" (
      "id" SERIAL PRIMARY KEY,
      "slug" VARCHAR(255) UNIQUE NOT NULL,
      "name" VARCHAR(255) NOT NULL,
      "description" TEXT NOT NULL,
      "category" VARCHAR(100) NOT NULL,
      "tier" VARCHAR(50) NOT NULL,
      "criteriaType" VARCHAR(100) NOT NULL,
      "criteriaValue" VARCHAR(255) NOT NULL,
      "xpReward" INTEGER DEFAULT 100,
      "iconGraphic" VARCHAR(255) NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS "UserBadge" (
      "id" SERIAL PRIMARY KEY,
      "userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
      "badgeId" INTEGER NOT NULL REFERENCES "Badge"("id") ON DELETE CASCADE,
      "earnedAt" TIMESTAMP DEFAULT NOW(),
      CONSTRAINT "UserBadge_userId_badgeId_key" UNIQUE ("userId", "badgeId")
    );
  `);

  console.log('🌱 Upserting 12 TryHackMe-style Badges...');
  for (const b of BADGES) {
    await pool.query(`
      INSERT INTO "Badge" ("slug", "name", "description", "category", "tier", "criteriaType", "criteriaValue", "xpReward", "iconGraphic")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT ("slug") DO UPDATE SET
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "category" = EXCLUDED."category",
        "tier" = EXCLUDED."tier",
        "criteriaType" = EXCLUDED."criteriaType",
        "criteriaValue" = EXCLUDED."criteriaValue",
        "xpReward" = EXCLUDED."xpReward",
        "iconGraphic" = EXCLUDED."iconGraphic";
    `, [b.slug, b.name, b.description, b.category, b.tier, b.criteriaType, b.criteriaValue, b.xpReward, b.iconGraphic]);
  }

  // 2. Retroactively compute XP and award badges to all existing users based on completed labs
  console.log('⚡ Retroactively evaluating badges & XP for existing users...');
  const users = await pool.query(`SELECT id FROM "User"`);
  
  for (const row of users.rows) {
    const userId = row.id;
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

    // Calculate XP: 100 XP per completed lab
    const baseLabXp = totalCompleted * 100;
    
    // Evaluate which badges are earned
    const allBadgesRes = await pool.query(`SELECT * FROM "Badge"`);
    let badgeBonusXp = 0;

    for (const badge of allBadgesRes.rows) {
      let isEarned = false;
      const targetVal = parseInt(badge.criteriaValue, 10);

      switch (badge.criteriaType) {
        case 'TOTAL_COUNT':
          if (totalCompleted >= targetVal) isEarned = true;
          break;
        case 'SQLI_COUNT':
          if (sqliCompleted >= targetVal) isEarned = true;
          break;
        case 'XSS_COUNT':
          if (xssCompleted >= targetVal) isEarned = true;
          break;
        case 'DUAL_TRACK':
          if (sqliCompleted >= targetVal && xssCompleted >= targetVal) isEarned = true;
          break;
        case 'SPECIFIC_LAB':
          const required = badge.criteriaValue.split(',');
          if (required.some((reqSlug: string) => completedSlugs.has(reqSlug.trim()))) {
            isEarned = true;
          }
          break;
      }

      if (isEarned) {
        await pool.query(`
          INSERT INTO "UserBadge" ("userId", "badgeId", "earnedAt")
          VALUES ($1, $2, NOW())
          ON CONFLICT ("userId", "badgeId") DO NOTHING;
        `, [userId, badge.id]);
        badgeBonusXp += badge.xpReward;
      }
    }

    const totalXp = baseLabXp + badgeBonusXp;
    await pool.query(`UPDATE "User" SET "xp" = $1 WHERE "id" = $2`, [totalXp, userId]);
  }

  console.log('✅ Successfully seeded badges and updated user progress!');
}

main()
  .catch(console.error)
  .finally(() => pool.end());
