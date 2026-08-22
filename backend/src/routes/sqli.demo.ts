import { Router } from 'express';
import { pool } from '../db';

const router = Router();

// Initialize vulnerable schema in PostgreSQL
async function initVulnSchema() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vuln_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        password VARCHAR(50) NOT NULL,
        role VARCHAR(20) DEFAULT 'operator'
      );
      
      -- Clear existing and seed to ensure fresh state
      TRUNCATE TABLE vuln_users RESTART IDENTITY CASCADE;
      INSERT INTO vuln_users (username, password, role) VALUES
        ('admin', 'wtp2024!', 'Administrator'),
        ('operator', 'Op3rAt0r', 'Operator'),
        ('viewer', 'view123', 'Viewer');

      CREATE TABLE IF NOT EXISTS vuln_products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        category VARCHAR(50) NOT NULL,
        price NUMERIC(10, 2)
      );
      
      TRUNCATE TABLE vuln_products RESTART IDENTITY CASCADE;
      INSERT INTO vuln_products (name, description, category, price) VALUES
        ('Cyber Security E-Book', 'Learn the basics of cyber security.', 'Books', 19.99),
        ('SQLi Masterclass', 'Advanced SQL injection techniques.', 'Books', 49.99),
        ('Hacker Hoodie', 'Stay anonymous.', 'Apparel', 39.99),
        ('Coffee Mug', 'Fuel your late-night hacking sessions.', 'Accessories', 12.99);

      CREATE TABLE IF NOT EXISTS vuln_tracking (
        id VARCHAR(50) PRIMARY KEY,
        user_agent TEXT,
        visits INTEGER DEFAULT 1
      );
      
      TRUNCATE TABLE vuln_tracking RESTART IDENTITY CASCADE;
      INSERT INTO vuln_tracking (id, user_agent, visits) VALUES
        ('a1b2c3d4e5', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 5),
        ('f6g7h8i9j0', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 12);

      CREATE TABLE IF NOT EXISTS vuln_orders (
        order_id VARCHAR(20) PRIMARY KEY,
        status VARCHAR(20),
        total NUMERIC(10, 2)
      );
      
      TRUNCATE TABLE vuln_orders RESTART IDENTITY CASCADE;
      INSERT INTO vuln_orders (order_id, status, total) VALUES
        ('ORD-9876', 'Shipped', 149.50),
        ('ORD-1234', 'Processing', 24.99);
    `);
    console.log('Vulnerable schema initialized in PostgreSQL.');
  } catch (err) {
    console.error('Failed to initialize vulnerable schema:', err);
  }
}

initVulnSchema();

// Removed global checkInjection regex. Validation is now context-aware per route.

// 1. Authentication SQLi (Login Bypass)
router.post('/lab1/login', async (req, res) => {
  const { username = '', password = '' } = req.body;
  const query = `SELECT * FROM vuln_users WHERE username = '${username}' AND password = '${password}'`;

  try {
    const result = await pool.query(query);
    const user = result.rows[0];
    const injected = !!user && password !== 'wtp2024!';

    if (user) {
      return res.json({
        ok: true,
        user: { id: user.id, username: user.username, role: user.role },
        injected,
        query,
        message: injected ? '⚡ Authenticated via SQLi bypass' : '✓ Authenticated normally'
      });
    }
    return res.json({ ok: false, query, message: '✗ Invalid credentials' });
  } catch (err: any) {
    return res.status(200).json({ ok: false, error: err.message, query });
  }
});

// 2. Error-based SQLi (Product Search)
router.get('/lab2/search', async (req, res) => {
  const search = req.query.search || '';
  const query = `SELECT * FROM vuln_products WHERE name LIKE '%${search}%'`;

  try {
    const result = await pool.query(query);
    const injected = false;
    return res.json({ ok: true, products: result.rows, query, injected });
  } catch (err: any) {
    const injected = err.message.includes('syntax') || err.message.includes('operator');
    return res.status(200).json({ ok: false, error: err.message, query, injected, hint: 'Error-based SQLi — check the error field for extracted data' });
  }
});

// 3. UNION-based SQLi (Product Details)
router.get('/lab3/product/:id', async (req, res) => {
  const id = req.params.id || '';

  // WAF Simulation: Block exact uppercase keywords
  if (id.includes('UNION') || id.includes('SELECT')) {
    return res.status(403).json({ ok: false, error: '🔥 WAF Alert: Request blocked. Malicious keywords (UNION/SELECT) detected. Your IP has been logged.' });
  }

  const query = `SELECT * FROM vuln_products WHERE id = ${id}`;

  try {
    const result = await pool.query(query);
    const injected = result.rows.length > 1; // Normally returns 1 product
    return res.json({ ok: true, product: result.rows[0] || null, products: result.rows, query, injected });
  } catch (err: any) {
    return res.status(200).json({ ok: false, error: err.message, query });
  }
});

// 4. Boolean-based Blind SQLi (User Lookup)
router.post('/lab4/user-lookup', async (req, res) => {
  const { username = '' } = req.body;
  const query = `SELECT id FROM vuln_users WHERE username = '${username}'`;

  try {
    const result = await pool.query(query);
    const exists = result.rows.length > 0;
    const injected = exists && username.includes("'");
    return res.json({ ok: true, exists, query, injected });
  } catch (err: any) {
    // In blind SQLi, we generally don't return the error directly
    return res.json({ ok: false, exists: false, error: 'Database error', query: '' });
  }
});

// 5. Numeric SQLi (Product Filter)
router.get('/lab5/filter', async (req, res) => {
  const price = req.query.price || '1000';
  const query = `SELECT * FROM vuln_products WHERE price < ${price}`;

  try {
    const result = await pool.query(query);
    const injected = result.rows.length === 4 && price !== '1000';
    return res.json({ ok: true, products: result.rows, query, injected });
  } catch (err: any) {
    return res.status(200).json({ ok: false, error: err.message, query });
  }
});

// 6. REST API SQLi (JSON Payload)
router.post('/lab6/api-search', async (req, res) => {
  const { search = '' } = req.body;
  const query = `SELECT * FROM vuln_products WHERE name LIKE '%${search}%'`;

  try {
    const result = await pool.query(query);
    const injected = result.rows.length === 4 && search !== '';
    return res.json({ ok: true, data: result.rows, query, injected });
  } catch (err: any) {
    return res.status(200).json({ ok: false, error: err.message, query });
  }
});

// 7. Cookie-based SQLi (Tracking Lookup)
router.get('/lab7/tracking', async (req, res) => {
  const trackingId = req.cookies?.tracking_id || 'a1b2c3d4e5';
  const query = `SELECT * FROM vuln_tracking WHERE id = '${trackingId}'`;

  try {
    const result = await pool.query(query);
    const injected = result.rows.length > 1;
    return res.json({ ok: true, tracking: result.rows[0] || null, query, injected });
  } catch (err: any) {
    return res.status(200).json({ ok: false, error: err.message, query });
  }
});

// 8. Time-based Blind SQLi (Order Status)
router.post('/lab8/order-status', async (req, res) => {
  const { orderId = '' } = req.body;
  const query = `SELECT * FROM vuln_orders WHERE order_id = '${orderId}'`;

  try {
    const startTime = Date.now();
    const result = await pool.query(query);
    const injected = (Date.now() - startTime) > 2000;
    return res.json({ ok: true, order: result.rows[0] || null, query, injected });
  } catch (err: any) {
    return res.json({ ok: false, error: 'System error', query: '' }); // Time-based is blind
  }
});

// 9. HTTP Header SQLi (Analytics)
router.get('/lab9/analytics', async (req, res) => {
  const userAgent = req.headers['user-agent'] || '';
  const ip = req.ip || '127.0.0.1';
  const query = `INSERT INTO vuln_analytics (ip_address, user_agent) VALUES ('${ip}', '${userAgent}')`;

  try {
    const startTime = Date.now();
    await pool.query(query);
    const injected = (Date.now() - startTime) > 2000;
    return res.json({ ok: true, message: 'Analytics logged.', query, injected });
  } catch (err: any) {
    return res.status(200).json({ ok: false, error: err.message, query });
  }
});

// 10. Second-Order SQLi (Update Profile - SAFE)
router.post('/lab10/profile/update', async (req, res) => {
  const { id, username, bio } = req.body;
  try {
    // Parameterized query: 100% safe from direct injection
    await pool.query('UPDATE vuln_profiles SET username = $1, bio = $2 WHERE id = $3', [username, bio, id]);
    return res.json({ ok: true, message: 'Profile updated safely!' });
  } catch (err: any) {
    return res.json({ ok: false, error: err.message });
  }
});

// 10. Second-Order SQLi (View Profile - VULNERABLE)
router.get('/lab10/profile/:id/view', async (req, res) => {
  const { id } = req.params;
  let dangerousQuery = '';
  try {
    // Step 1: Safely retrieve the username from the database using parameterized query
    const userRes = await pool.query('SELECT username FROM vuln_profiles WHERE id = $1', [id]);
    const user = userRes.rows[0];
    if (!user) return res.json({ ok: false, error: 'User not found.' });

    const dbUsername = user.username; // This string may contain a payload!

    // Step 2: Dangerously use the retrieved data in a new query
    dangerousQuery = `SELECT bio, secret_flag FROM vuln_profiles WHERE username = '${dbUsername}'`;
    const statsRes = await pool.query(dangerousQuery);
    
    const injected = statsRes.rows.some(r => r.secret_flag);
    return res.json({ ok: true, raw_results: statsRes.rows, query: dangerousQuery, injected });
  } catch (err: any) {
    return res.json({ ok: false, error: err.message, query: dangerousQuery });
  }
});

export default router;
