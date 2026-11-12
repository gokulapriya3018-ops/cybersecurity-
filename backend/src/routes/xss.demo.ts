import { Router } from 'express';
import { pool } from '../db';

const router = Router();

// Initialize vulnerable tables for XSS Labs
async function initXssSchema() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS xss_comments (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS xss_profiles (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        website TEXT,
        bio TEXT
      );
      
      -- Seed default profile for Lab 4
      INSERT INTO xss_profiles (id, username, website, bio)
      VALUES (2, 'student_user', 'https://safe-site.com', 'Learning XSS!')
      ON CONFLICT (id) DO NOTHING;

      CREATE TABLE IF NOT EXISTS xss_logs (
        id SERIAL PRIMARY KEY,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS xss_tickets (
        id SERIAL PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('XSS vulnerable schema initialized in PostgreSQL.');
  } catch (err) {
    console.error('Failed to initialize XSS schema:', err);
  }
}

initXssSchema();

// Helper to escape standard characters to demonstrate "secure" comparisons
function escapeHtml(unsafe: string) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// -------------------------------------------------------------
// LAB 1: Reflected XSS
// -------------------------------------------------------------
router.get('/lab1', (req, res) => {
  const search = (req.query.search as string) || '';
  // Intentionally vulnerable: direct string reflection
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Lab 1: Reflected XSS</title>
        <style>body { font-family: sans-serif; padding: 20px; background: #fafafa; color: #1e293b; }</style>
      </head>
      <body>
        <h2>Search Results</h2>
        <p>You searched for: <strong>${search}</strong></p>
        <hr>
        <p>No products found matching your search term.</p>
      </body>
    </html>
  `);
});

// -------------------------------------------------------------
// LAB 2: Stored XSS
// -------------------------------------------------------------
router.post('/lab2/comments', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ ok: false, message: 'Content required' });
    }
    await pool.query('INSERT INTO xss_comments (content) VALUES ($1)', [content]);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/lab2/reset', async (req, res) => {
  try {
    await pool.query('TRUNCATE xss_comments');
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/lab2/view', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM xss_comments ORDER BY created_at DESC');
    let commentsHtml = result.rows
      .map(row => `<div style="background:#fff; border:1px solid #e2e8f0; padding:10px; margin-bottom:10px; border-radius:8px;">${row.content}</div>`)
      .join('');

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Lab 2: Stored Comments</title>
          <style>body { font-family: sans-serif; padding: 20px; background: #f8fafc; color: #1e293b; }</style>
        </head>
        <body>
          <h2>Guestbook Comments</h2>
          <div id="comments">${commentsHtml || '<p>No comments yet.</p>'}</div>
        </body>
      </html>
    `);
  } catch (err: any) {
    res.status(500).send('Error loading comments');
  }
});

// -------------------------------------------------------------
// LAB 3: DOM-based XSS
// -------------------------------------------------------------
router.get('/lab3', (req, res) => {
  // Static page containing client-side sink
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Lab 3: DOM XSS</title>
        <style>body { font-family: sans-serif; padding: 20px; background: #fafafa; color: #1e293b; }</style>
      </head>
      <body>
        <h2>Welcome back!</h2>
        <div id="greeting" style="padding: 15px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; font-weight: bold;"></div>
        
        <script>
          // Vulnerable sink: location.hash -> innerHTML
          const hash = window.location.hash;
          if (hash) {
            const decoded = decodeURIComponent(hash.substring(1));
            document.getElementById('greeting').innerHTML = "Hello " + decoded + "!";
          } else {
            document.getElementById('greeting').textContent = "Hello Guest! Use a URL hash (e.g. #admin) to personalize.";
          }
          
          // Re-evaluate hash on hashchange
          window.addEventListener('hashchange', () => {
            const newHash = window.location.hash;
            const decoded = decodeURIComponent(newHash.substring(1));
            document.getElementById('greeting').innerHTML = "Hello " + decoded + "!";
          });
        </script>
      </body>
    </html>
  `);
});

// -------------------------------------------------------------
// LAB 4: Attribute-Context Injection
// -------------------------------------------------------------
router.post('/lab4/profile', async (req, res) => {
  try {
    const { website, bio } = req.body;
    await pool.query(
      'UPDATE xss_profiles SET website = $1, bio = $2 WHERE id = 2',
      [website, bio]
    );
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/lab4/view', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM xss_profiles WHERE id = 2');
    const profile = result.rows[0];
    
    // Intentionally vulnerable: website is placed directly in href attribute context
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Lab 4: Profile View</title>
          <style>body { font-family: sans-serif; padding: 20px; background: #fafafa; color: #1e293b; }</style>
        </head>
        <body>
          <h2>User Profile</h2>
          <div style="background:#fff; border:1px solid #e2e8f0; padding:20px; border-radius:10px; max-width: 400px;">
            <h3>student_user</h3>
            <p><strong>Bio:</strong> ${escapeHtml(profile?.bio || '')}</p>
            <p>
              <!-- Vulnerable href context -->
              <a id="web-link" href="${profile?.website || '#'}" target="_blank" style="color:#4f46e5; font-weight:bold;">
                Visit website
              </a>
            </p>
          </div>
        </body>
      </html>
    `);
  } catch (err: any) {
    res.status(500).send('Error loading profile');
  }
});

// -------------------------------------------------------------
// LAB 5: Filter/Blacklist Bypass
// -------------------------------------------------------------
router.get('/lab5', (req, res) => {
  let search = (req.query.search as string) || '';
  
  // Naive filter: strip out <script> tag pattern (case-insensitive)
  const cleanSearch = search.replace(/<script>/gi, '');
  
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Lab 5: Blacklist Filter Bypass</title>
        <style>body { font-family: sans-serif; padding: 20px; background: #fafafa; color: #1e293b; }</style>
      </head>
      <body>
        <h2>Search Index</h2>
        <p>Filtered Results for: <strong>${cleanSearch}</strong></p>
      </body>
    </html>
  `);
});

// -------------------------------------------------------------
// LAB 6: JSON / REST API Injection
// -------------------------------------------------------------
router.post('/lab6/logs', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ ok: false, message: 'Message required' });
    }
    await pool.query('INSERT INTO xss_logs (message) VALUES ($1)', [message]);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/lab6/admin/view', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM xss_logs ORDER BY created_at DESC');
    let logsHtml = result.rows
      .map(row => `<tr style="border-bottom:1px solid #cbd5e1;"><td style="padding:10px; font-family:monospace; font-size:12px;">${row.message}</td></tr>`)
      .join('');

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Lab 6: Admin Audit Logs</title>
          <style>
            body { font-family: sans-serif; padding: 20px; background: #f8fafc; color: #1e293b; }
            table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            th { background: #475569; color: #fff; padding: 10px; text-align: left; }
          </style>
        </head>
        <body>
          <h2>System Audit Log (Admin Dashboard)</h2>
          <table>
            <thead>
              <tr><th>Log Event Message</th></tr>
            </thead>
            <tbody>
              ${logsHtml || '<tr><td style="padding:20px; text-align:center; color:#64748b;">No logs recorded.</td></tr>'}
            </tbody>
          </table>
        </body>
      </html>
    `);
  } catch (err: any) {
    res.status(500).send('Error loading logs');
  }
});

// -------------------------------------------------------------
// LAB 7: Header-based XSS
// -------------------------------------------------------------
router.get('/lab7', (req, res) => {
  // Reads custom X-User-Metadata header
  const meta = (req.headers['x-user-metadata'] as string) || 'Guest User';
  
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Lab 7: Header Telemetry</title>
        <style>body { font-family: sans-serif; padding: 20px; background: #fafafa; color: #1e293b; }</style>
      </head>
      <body>
        <h2>System Telemetry</h2>
        <div style="background:#fff; border:1px solid #e2e8f0; padding:15px; border-radius:8px;">
          <p><strong>Device ID:</strong> CSA-WEB-SIM-7</p>
          <!-- Vulnerable header reflection -->
          <p><strong>User Metadata:</strong> ${meta}</p>
        </div>
      </body>
    </html>
  `);
});

// -------------------------------------------------------------
// LAB 8: CSP Bypass Challenge
// -------------------------------------------------------------
router.get('/lab8', (req, res) => {
  const payload = (req.query.payload as string) || '';
  
  // Set an intentionally weak CSP allowing 'unsafe-inline'
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  );
  
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Lab 8: Weak CSP Bypass</title>
        <style>body { font-family: sans-serif; padding: 20px; background: #fafafa; color: #1e293b; }</style>
      </head>
      <body>
        <h2>CSP Secure Gateway</h2>
        <p>This sandbox employs a Content Security Policy to secure script execution.</p>
        <div id="output" style="padding: 15px; border: 1px dashed #64748b; background: #fff; border-radius: 8px;">
          ${payload}
        </div>
      </body>
    </html>
  `);
});

// -------------------------------------------------------------
// LAB 9: Markdown Rich-Text Injection
// -------------------------------------------------------------
router.post('/lab9/markdown', async (req, res) => {
  try {
    const { bio } = req.body;
    await pool.query('UPDATE xss_profiles SET bio = $1 WHERE id = 2', [bio]);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/lab9/view', async (req, res) => {
  try {
    const result = await pool.query('SELECT bio FROM xss_profiles WHERE id = 2');
    const rawBio = result.rows[0]?.bio || '';
    
    // Naive Markdown Compiler: Only parses bold **text** and headers #, 
    // but fails to sanitize or escape raw HTML tags!
    let html = rawBio
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Lab 9: Rich Text View</title>
          <style>body { font-family: sans-serif; padding: 20px; background: #fafafa; color: #1e293b; }</style>
        </head>
        <body>
          <h2>User Portfolio</h2>
          <div style="background:#fff; border:1px solid #e2e8f0; padding:20px; border-radius:10px;">
            ${html || '<p>Portfolio is empty.</p>'}
          </div>
        </body>
      </html>
    `);
  } catch (err: any) {
    res.status(500).send('Error loading bio');
  }
});

// -------------------------------------------------------------
// LAB 10: Second-order Stored XSS
// -------------------------------------------------------------
router.post('/lab10/tickets', async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ ok: false, message: 'Title and content required' });
    }
    // Step 1: Safely store the payload using parameterized queries.
    // The database preserves the payload exactly as typed.
    await pool.query(
      'INSERT INTO xss_tickets (title, content) VALUES ($1, $2)',
      [title, content]
    );
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/lab10/admin/tickets', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM xss_tickets ORDER BY created_at DESC');
    
    // Step 2: Unsafely retrieve and render it into the ticket list view
    let ticketsHtml = result.rows
      .map(row => `
        <div style="background:#fff; border:1px solid #cbd5e1; border-radius:8px; padding:15px; margin-bottom:15px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
          <h3 style="margin-top:0; color:#1e293b;">Ticket: ${escapeHtml(row.title)}</h3>
          <div style="color:#475569; font-size:14px; background:#f8fafc; border:1px solid #e2e8f0; padding:10px; border-radius:6px;">
            ${row.content}  <!-- Vulnerable render context! -->
          </div>
        </div>
      `)
      .join('');

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Lab 10: Support Tickets Admin Console</title>
          <style>body { font-family: sans-serif; padding: 20px; background: #f1f5f9; color: #1e293b; }</style>
        </head>
        <body>
          <h2>Administrative Ticket Console</h2>
          <div id="tickets">${ticketsHtml || '<p style="color:#64748b;">No support tickets active.</p>'}</div>
        </body>
      </html>
    `);
  } catch (err: any) {
    res.status(500).send('Error loading tickets');
  }
});

export default router;
