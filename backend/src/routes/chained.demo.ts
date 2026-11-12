import { Router } from 'express';
import { pool } from '../db';

const router = Router();

// Initialize Realistic E-Commerce Database in PostgreSQL
async function initChainedStoreSchema() {
  try {
    await pool.query(`
      DROP TABLE IF EXISTS chained_products CASCADE;
      DROP TABLE IF EXISTS chained_admin_vault CASCADE;
      DROP TABLE IF EXISTS chained_reviews CASCADE;
      DROP TABLE IF EXISTS chained_announcements CASCADE;
      DROP TABLE IF EXISTS chained_coupons CASCADE;

      CREATE TABLE chained_products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        category VARCHAR(50) NOT NULL,
        price NUMERIC(10, 2) NOT NULL,
        original_price NUMERIC(10, 2) NOT NULL,
        description TEXT NOT NULL,
        image_url TEXT NOT NULL,
        rating NUMERIC(2, 1) DEFAULT 4.8,
        reviews_count INTEGER DEFAULT 142
      );

      CREATE TABLE chained_admin_vault (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        password_hash VARCHAR(100) NOT NULL,
        role VARCHAR(50) NOT NULL,
        salary NUMERIC(10, 2) DEFAULT 0,
        secret_api_key VARCHAR(100) NOT NULL,
        backup_email VARCHAR(100) NOT NULL,
        rating NUMERIC(2, 1) DEFAULT 5.0
      );

      CREATE TABLE chained_reviews (
        id SERIAL PRIMARY KEY,
        product_id INTEGER DEFAULT 1,
        author VARCHAR(100) NOT NULL,
        rating INTEGER DEFAULT 5,
        headline VARCHAR(150) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE chained_announcements (
        id SERIAL PRIMARY KEY,
        message TEXT NOT NULL,
        author VARCHAR(50) DEFAULT 'store_admin_clara',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE chained_coupons (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) NOT NULL,
        discount_percent INTEGER NOT NULL,
        description TEXT
      );

      -- Seed realistic consumer tech products
      INSERT INTO chained_products (name, category, price, original_price, description, image_url, rating, reviews_count) VALUES
        ('AuraPulse Pro Wireless ANC Headphones', 'Audio', 299.99, 349.99, 'Industry-leading adaptive active noise cancellation with 40-hour high-fidelity battery life and spatial audio support.', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&auto=format&fit=crop&q=80', 4.9, 328),
        ('TitanBook Ultra 16 M3 Max', 'Laptops', 2499.00, 2799.00, 'Extreme-performance mobile workstation equipped with 16-core CPU, 40-core GPU, liquid retina XDR 120Hz display, and 64GB unified memory.', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=700&auto=format&fit=crop&q=80', 4.9, 142),
        ('ApexKey Neo Hardware Security Key', 'Security', 75.00, 90.00, 'Dual-protocol FIDO2 / WebAuthn and NFC hardware cryptographic key with waterproof aluminum casing.', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=700&auto=format&fit=crop&q=80', 4.8, 89),
        ('Vortex Mechanical RGB Gaming Keyboard', 'Keyboards', 149.50, 189.00, 'Hot-swappable custom linear optical switches, aircraft-grade brushed aluminum plate, and sound-dampening foam.', 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=700&auto=format&fit=crop&q=80', 4.7, 215),
        ('Spectra 4K HDR Ultrawide Monitor 34"', 'Monitors', 799.00, 999.00, 'Curved QD-OLED display panel with 0.03ms response time, 175Hz refresh rate, and 99.3% DCI-P3 cinematic color coverage.', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=700&auto=format&fit=crop&q=80', 4.8, 76),
        ('PulseFit Chroma Smart Health Watch', 'Smartwatch', 199.00, 249.00, 'Continuous medical-grade optical heart-rate, ECG tracking, dual-frequency GPS, and 14-day standby stamina.', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700&auto=format&fit=crop&q=80', 4.6, 184);

      -- Seed hidden admin database records
      INSERT INTO chained_admin_vault (username, password_hash, role, salary, secret_api_key, backup_email, rating) VALUES
        ('store_admin_clara', 'ClaraSec@9921_complex_pass', 'Store Manager', 145000.00, 'FLAG{NEXUS_CHAINED_STORE_TAKEOVER_99201}', 'clara.exec@nexusstore.com', 5.0),
        ('merchant_joshua', 'JoshuaP@ss!883', 'Catalog Lead', 98000.00, 'API_SEC_KEY_PROD_VAULT_77182', 'joshua.m@nexusstore.com', 5.0);

      -- Seed initial genuine customer reviews
      INSERT INTO chained_reviews (product_id, author, rating, headline, content) VALUES
        (1, 'David K.', 5, 'Unbelievable sound isolation!', 'Traveled on a 14-hour flight and these cancelled out all engine noise completely. Worth every penny.'),
        (1, 'Sarah Chen', 5, 'Battery lasts for days', 'Audio quality is crisp with punchy bass. Spatial audio during movies feels like a theater in your ears.'),
        (2, 'TechReviewer_Alex', 5, 'Absolute beast of a machine', 'Renders 8K ProRes footage without breaking a sweat. The cooling system is dead silent under load.');

      -- Seed announcement banner
      INSERT INTO chained_announcements (message, author) VALUES
        ('Special Weekend Event: Use promo code NEXUS10 at checkout for an instant 10% discount on all audio gear.', 'store_admin_clara');

      -- Seed initial promo codes (SQLi coupon target)
      INSERT INTO chained_coupons (code, discount_percent, description) VALUES
        ('NEXUS10', 10, '10% Weekend Storewide Discount'),
        ('WELCOME20', 20, '20% New Customer Promotion');
    `);
    console.log('NexusStore E-Commerce PostgreSQL schema initialized.');
  } catch (err) {
    console.error('Failed to initialize NexusStore schema:', err);
  }
}

initChainedStoreSchema();

// 1. Get Products / Search Products (Vulnerable to SQL Injection)
router.get('/products', async (req, res) => {
  const search = (req.query.search as string) || '';
  const category = (req.query.category as string) || '';

  let whereClauses = [];
  if (category && category !== 'All') {
    whereClauses.push(`category = '${category}'`);
  }

  // Vulnerable raw concatenation in search parameter
  let query = `SELECT id, name, category, price, original_price, description, image_url, rating FROM chained_products`;
  if (search) {
    whereClauses.push(`name ILIKE '%${search}%'`);
  }

  if (whereClauses.length > 0) {
    query += ` WHERE ${whereClauses.join(' AND ')}`;
  }
  query += ` ORDER BY id ASC`;

  try {
    const result = await pool.query(query);
    const hasExfiltrated = result.rows.some((row: any) => 
      row.name?.includes('FLAG{') || 
      row.name?.includes('store_admin_clara') || 
      row.description?.includes('FLAG{') ||
      row.category?.includes('Store Manager')
    );

    return res.json({
      ok: true,
      products: result.rows,
      query,
      injected: hasExfiltrated
    });
  } catch (err: any) {
    return res.status(200).json({
      ok: false,
      error: err.message,
      query,
      products: []
    });
  }
});

// 2. Merchant / Admin Authentication (Vulnerable to SQL Injection Login Bypass)
router.post('/admin-login', async (req, res) => {
  const { username = '', password = '' } = req.body;
  const query = `SELECT id, username, role, backup_email, secret_api_key FROM chained_admin_vault WHERE username = '${username}' AND password_hash = '${password}'`;

  try {
    const result = await pool.query(query);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const isBypassed = password !== 'ClaraSec@9921_complex_pass';

      return res.json({
        ok: true,
        user: {
          username: user.username,
          role: user.role,
          email: user.backup_email,
          apiKey: user.secret_api_key
        },
        bypassed: isBypassed,
        message: 'Merchant session authenticated.'
      });
    }

    return res.status(401).json({ ok: false, error: 'Invalid merchant username or password.' });
  } catch (err: any) {
    return res.status(400).json({ ok: false, error: err.message, query });
  }
});

// 3. Promo Code Application (Vulnerable to SQL Injection in Cart)
router.post('/apply-promo', async (req, res) => {
  const { code = '' } = req.body;
  const query = `SELECT id, code, discount_percent, description FROM chained_coupons WHERE code = '${code}'`;

  try {
    const result = await pool.query(query);
    if (result.rows.length > 0) {
      const coupon = result.rows[0];
      const isSqlInjected = code.includes("'") || code.includes('--') || code.includes('UNION');
      const discount = isSqlInjected ? 100 : coupon.discount_percent;

      return res.json({
        ok: true,
        coupon: {
          code: coupon.code,
          discountPercent: discount,
          description: isSqlInjected ? '🔥 VIP EXPLOIT: 100% OFF (FREE ORDER)' : coupon.description
        },
        injected: isSqlInjected,
        message: isSqlInjected 
          ? 'Promo coupon query bypassed: 100% discount applied!' 
          : `Promo code ${coupon.code} applied: ${discount}% discount.`
      });
    }

    return res.status(404).json({ ok: false, error: 'Invalid or expired promo code.' });
  } catch (err: any) {
    // If SQL syntax error occurs, return friendly message with query error
    return res.status(400).json({ ok: false, error: err.message, query });
  }
});

// 4. Store Announcement Banner (Sink for Stored XSS)
router.get('/announcement', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM chained_announcements ORDER BY id DESC LIMIT 1');
    return res.json({ ok: true, announcement: result.rows[0] });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/announcement', async (req, res) => {
  let { message = '', author = 'store_admin_clara' } = req.body;
  // Sanitize location.reload to prevent infinite browser reload loop
  message = message.replace(/location\.reload\s*\(\s*\)/gi, 'console.log("XSS Executed")');
  try {
    const result = await pool.query(
      'INSERT INTO chained_announcements (message, author) VALUES ($1, $2) RETURNING *',
      [message, author]
    );
    return res.json({ ok: true, announcement: result.rows[0], message: 'Announcement updated live across store.' });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// 5. Update Product Price (Target of the XSS payload / Business logic tampering)
router.post('/update-price', async (req, res) => {
  const { id = 2, price = 1.00 } = req.body;
  const numPrice = parseFloat(price);

  try {
    await pool.query('UPDATE chained_products SET price = $1 WHERE id = $2', [numPrice, id]);
    const updated = await pool.query('SELECT * FROM chained_products WHERE id = $2', [id]);
    
    const isHacked = numPrice <= 10.00;

    return res.json({
      ok: true,
      product: updated.rows[0],
      priceHacked: isHacked,
      message: `Product price updated to $${numPrice.toFixed(2)}.`
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// 6. Checkout Cart (Detects if expensive product was tampered down to <= $10 or 100% coupon applied)
router.post('/checkout', async (req, res) => {
  const { cartItems = [], appliedDiscount = 0 } = req.body;

  try {
    const dbItems = await pool.query('SELECT id, name, price FROM chained_products WHERE id = 2');
    const laptop = dbItems.rows[0];

    const hasHackedLaptop = (cartItems.some((i: any) => i.id === 2)) && (parseFloat(laptop.price) <= 10.00);
    const hasFreeCoupon = appliedDiscount >= 100;
    const isBreached = hasHackedLaptop || hasFreeCoupon;

    return res.json({
      ok: true,
      solved: isBreached,
      totalCharged: hasFreeCoupon ? 0 : cartItems.reduce((acc: number, curr: any) => acc + (parseFloat(curr.price) || 0), 0),
      message: isBreached 
        ? '🏆 CRITICAL ALERT: Order verified. High-value hardware acquired at tampered valuation / free coupon!' 
        : 'Order processed successfully.'
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// 7. Customer Reviews
router.get('/reviews', async (req, res) => {
  const productId = req.query.productId ? parseInt(req.query.productId as string) : 1;
  try {
    const result = await pool.query(
      `SELECT * FROM chained_reviews WHERE product_id = $1 ORDER BY id DESC`,
      [productId]
    );
    return res.json({ ok: true, reviews: result.rows });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/reviews', async (req, res) => {
  const { productId = 1, author = 'Customer', rating = 5, headline = 'Great product', content = '' } = req.body;
  if (!content || content.trim() === '') {
    return res.status(400).json({ ok: false, error: 'Review body cannot be empty.' });
  }
  try {
    const insertQuery = `INSERT INTO chained_reviews (product_id, author, rating, headline, content) VALUES ($1, $2, $3, $4, $5) RETURNING *`;
    const result = await pool.query(insertQuery, [productId, author, rating, headline, content]);
    return res.json({ ok: true, review: result.rows[0] });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
