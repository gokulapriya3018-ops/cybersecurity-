import { pool } from './src/db';

async function main() {
  console.log('🔄 Applying SOC Command Center DDL schema to PostgreSQL...');

  await pool.query(`
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP DEFAULT NOW();
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastActiveAt" TIMESTAMP DEFAULT NOW();
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "activeMinutes" INTEGER DEFAULT 45;
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "anomalyFlags" INTEGER DEFAULT 0;

    CREATE TABLE IF NOT EXISTS "LoginAudit" (
      "id" SERIAL PRIMARY KEY,
      "userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
      "ipAddress" VARCHAR(100) DEFAULT '127.0.0.1',
      "userAgent" TEXT,
      "createdAt" TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS "SecurityEvent" (
      "id" SERIAL PRIMARY KEY,
      "userId" INTEGER REFERENCES "User"("id") ON DELETE SET NULL,
      "eventType" VARCHAR(100) NOT NULL,
      "description" TEXT NOT NULL,
      "metadata" TEXT,
      "createdAt" TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS "BroadcastAlert" (
      "id" SERIAL PRIMARY KEY,
      "title" VARCHAR(255) NOT NULL,
      "message" TEXT NOT NULL,
      "type" VARCHAR(50) DEFAULT 'INFO',
      "isActive" BOOLEAN DEFAULT TRUE,
      "createdAt" TIMESTAMP DEFAULT NOW()
    );
  `);

  console.log('📢 Seeding initial system broadcast alert...');
  await pool.query(`
    INSERT INTO "BroadcastAlert" ("title", "message", "type", "isActive")
    VALUES 
      ('ACADEMY PORTAL ACTIVE', 'All 20 interactive offensive sandboxes are online with real-time solve verification.', 'INFO', TRUE)
    ON CONFLICT DO NOTHING;
  `);

  console.log('⚡ Populating initial security events & login audits...');
  const users = await pool.query(`SELECT "id", "email" FROM "User"`);
  for (const user of users.rows) {
    // Add sample login audit
    await pool.query(`
      INSERT INTO "LoginAudit" ("userId", "ipAddress", "userAgent", "createdAt")
      VALUES ($1, '192.168.1.104', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36', NOW() - INTERVAL '15 minutes')
    `, [user.id]);

    // Add security events
    await pool.query(`
      INSERT INTO "SecurityEvent" ("userId", "eventType", "description", "metadata", "createdAt")
      VALUES 
        ($1, 'LOGIN_SUCCESS', 'Operator authenticated with clearance via JWT session', '{"ip":"192.168.1.104"}', NOW() - INTERVAL '15 minutes'),
        ($1, 'LAB_BREACH', 'Breached sandbox environment sqli-01-login (Auth Bypass)', '{"labSlug":"sqli-01-login","duration":"03m 42s"}', NOW() - INTERVAL '10 minutes'),
        ($1, 'BADGE_CLAIMED', 'Achievement unlocked: First Blood (+100 XP)', '{"badge":"First Blood","xp":100}', NOW() - INTERVAL '10 minutes')
    `, [user.id]);
  }

  console.log('✅ SOC Command Center database initialization complete!');
}

main()
  .catch(console.error)
  .finally(() => pool.end());
