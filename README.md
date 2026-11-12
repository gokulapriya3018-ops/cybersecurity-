# 🛡️ CyberForge — Enterprise Cybersecurity Learning & SOC Telemetry Portal

> **Interactive, Vulnerable-by-Design Cyber Training Platform** featuring 20 hands-on offensive sandboxes (SQL Injection & Cross-Site Scripting), AAA gaming-grade 3D celebration badge claim flows, strict progression gating, student operator dossiers, and an advanced SOC (Security Operations Center) Instructor Command Center.

---

## 📑 Table of Contents
1. [Overview & Tech Stack](#-overview--tech-stack)
2. [Platform Architecture & System Modules](#-platform-architecture--system-modules)
3. [Features A to Z](#-features-a-to-z)
4. [Step-by-Step Initial Setup Guide](#-step-by-step-initial-setup-guide)
   - [Step 1: Prerequisites](#step-1-prerequisites)
   - [Step 2: Clone & Directory Overview](#step-2-clone--directory-overview)
   - [Step 3: Database Container Setup (Docker)](#step-3-database-container-setup-docker)
   - [Step 4: Backend Configuration & Installation](#step-4-backend-configuration--installation)
   - [Step 5: Database Migration & Schema Push](#step-5-database-migration--schema-push)
   - [Step 6: Comprehensive Database Seeding](#step-6-comprehensive-database-seeding)
   - [Step 7: Frontend Configuration & Installation](#step-7-frontend-configuration--installation)
   - [Step 8: Starting the Application](#step-8-starting-the-application)
5. [Default User Credentials & Clearance Roles](#-default-user-credentials--clearance-roles)
6. [Database Inspection & Management Tools](#-database-inspection--management-tools)
   - [Option A: Prisma Studio (Web GUI)](#option-a-prisma-studio-web-gui)
   - [Option B: PostgreSQL CLI (psql via Docker)](#option-b-postgresql-cli-psql-via-docker)
   - [Option C: Desktop Database Clients (DBeaver, pgAdmin, TablePlus)](#option-c-desktop-database-clients-dbeaver-pgadmin-tableplus)
   - [Option D: Built-in Admin Telemetry REST Endpoints](#option-d-built-in-admin-telemetry-rest-endpoints)
7. [Full Project File Structure](#-full-project-file-structure)
8. [Offensive Sandboxes & Curriculum Directory](#-offensive-sandboxes--curriculum-directory)
9. [Troubleshooting & Common Commands](#-troubleshooting--common-commands)
10. [Security Disclaimer](#-security-disclaimer)

---

## 🛠️ Overview & Tech Stack

CyberForge simulates a high-security tactical cyber operations center paired with vulnerable educational targets:

| Layer | Technology | Key Libraries / Roles |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript | Tailwind CSS, Lucide Icons, React Router v6, React Markdown, Remark GFM, Canvas Confetti |
| **Styling & 3D FX** | Vanilla CSS + Tailwind | Isometric transforms, Conic light beams, CSS 3D keyframe levitation, glassmorphism, responsive HUD |
| **Backend API** | Node.js, Express.js, TypeScript | Prisma ORM, `@prisma/adapter-pg`, `pg`, `bcrypt` (cost 12), `jsonwebtoken`, `better-sqlite3`, `cors` |
| **Database** | PostgreSQL 15 (Alpine) | Port `15432` via Docker Compose, persistent disk volume `./db-data` |
| **Offensive Sims** | SQLite (in-memory) + Express | Independent vulnerable target endpoints with SQLi & XSS vulnerability engines |
| **Cache / Queue** | Redis 7 (Alpine) | Port `6379` via Docker Compose |

---

## 🏛️ Platform Architecture & System Modules

```
                        ┌────────────────────────────────────────┐
                        │      Client Browser (React / Vite)     │
                        │        http://localhost:5173           │
                        └──────────────────┬─────────────────────┘
                                           │
                        ┌──────────────────┴─────────────────────┐
                        │    Express REST API (TypeScript)       │
                        │        http://localhost:3000           │
                        └─────────┬───────────────────┬──────────┘
                                  │                   │
            ┌─────────────────────┴──────┐     ┌──────┴─────────────────────┐
            │   Prisma ORM & PostgreSQL  │     │   Vulnerable Simulators    │
            │   Port: 15432 (Docker)     │     │   SQLite in-memory DBs     │
            │   - Users & Clearance      │     │   - Raw Concatenated SQL   │
            │   - Progress & Telemetry   │     │   - Reflected / DOM XSS    │
            │   - Badges & XP Ledger     │     │   - Stored Payloads        │
            │   - Security Event Logs    │     └────────────────────────────┘
            │   - Broadcast Alerts       │
            └────────────────────────────┘
```

---

## 🌟 Features A to Z

### 1. Offensive Vulnerability Sandboxes (20 Interactive Labs)
- **10 SQL Injection Modules**: Classic `' OR 1=1 --` auth bypass, column discovery, `information_schema` table harvesting, error-based casting leaks, blind boolean extraction, time-based delayed responses (`pg_sleep`), second-order storage, and WAF evasion.
- **10 Cross-Site Scripting Modules**: Reflected input execution, stored persistent script injection, client-side DOM sinks (`innerHTML`), attribute context breakout, JavaScript pseudoprotocols, cookie theft / session harvesting, and WAF filter obfuscation.

### 2. Strict Progression Gating & Anti-Cheat Validation
- Students **cannot skip ahead** or click "Next Module" on lab exercises until the offensive sandbox has been genuinely exploited and solved.
- Solves are verified by real-time payload analyzers that detect exploit payloads in the sandbox database and notify the curriculum view instantly via local tab events and cross-tab storage sync.

### 3. Gamification & 12 Tiered Honor Badges
- 12 uniquely designed collectible SVG vector badges across 5 clearance tiers:
  - **Bronze**: *First Blood*, *Database Infiltrator*, *DOM Manipulator*
  - **Silver**: *Fast Learner*, *Cookie Monster*, *WAF Evader*, *Web Defender*
  - **Gold**: *SQLi Master*, *XSS Slayer*
  - **Platinum**: *Second-Order Spectre*, *Dual Threat Operator*
  - **Diamond**: *Grandmaster of Web Exploits* (+1000 XP)
- **Manual Claim Flow**: Badges are never auto-credited. When earned, badge cards pulse with a continuous golden aura and an animated `✨ READY TO CLAIM` ribbon, alerting the student to claim their reward.

### 4. AAA Gaming 3D Celebration Claim Flow (Zero Overlap)
- When claiming an unlocked honor, the student enters a cinematic **Gaming 3D Victory Showcase**:
  - **Rotating Sunburst Rays**: Multi-colored conic cyber light beams spinning behind the centerpiece.
  - **Concentric Energy Shockwaves**: Staggered expanding neon pulse rings.
  - **Holographic 3D Pedestal**: An isometric cybernetic platform with glowing concentric rings and a vertical holographic light pillar.
  - **Continuous 3D Levitation**: The emblem floats in 3D perspective space with smooth levitation.
  - **Floating Cyber Embers**: Rising particle sparks.
  - **Dynamic XP Rollup**: Numbers roll up live on screen (`+0` $\rightarrow$ `+250 XP`) with audio-visual impact and dossier synchronization.
  - **Guaranteed Zero Overlap**: Clean vertical slot layout ensuring complete visual separation between header, emblem, title, XP box, and action buttons.

### 5. Student Operator Dossier
- Individual student telemetry page showing total training hours, active session time, registration timestamp, last login IP address, user-agent details, full breakdown of mastered labs, claimed badges, and anomaly breach detections.

### 6. Admin SOC Instructor Command Center
- Located at `/admin` (accessible only to users with `ADMIN` role).
- **HUD Metric Cards**: Total Operators, Live Active Sessions, Total Lab Breaches, Badges Claimed, and Cumulative Training Hours.
- **Operator Intelligence Roster**: Live searchable roster with clearance status, sort by labs/XP/badges/hours, and status filters (`All`, `Online`, `Pending`, `Approved`, `Flagged`).
- **Operator Provisioning ("Enroll Operator")**: Built-in modal to register new students or admins directly, with automatic strong password generation, instant approval toggle, and initial starting XP allocation.
- **Class Leaderboard & Lab Difficulty Heatmap**: Visual bar charts ranking the most challenging sandboxes.
- **Security Event Terminal**: Live stream of system events (`LOGIN_SUCCESS`, `LAB_BREACH`, `BADGE_CLAIMED`, `ADMIN_ACTION`).
- **Global Broadcast System**: Publish urgent alerts that immediately display across all student dashboards.
- **Flush Sandboxes**: One-click reset tool to wipe and re-seed temporary simulator databases.

---

## 🚀 Step-by-Step Initial Setup Guide

Follow this guide to install, configure, and launch the platform from a clean machine.

### Step 1: Prerequisites
Ensure you have the following installed on your operating system:
- **Node.js**: v18.0.0 or later (`node -v`)
- **npm**: v9.0.0 or later (`npm -v`)
- **Docker Desktop**: Ensure Docker daemon is running (`docker info`)
- **Git**: For cloning the repository (`git --version`)

---

### Step 2: Clone & Directory Overview
```bash
git clone <repository-url> "Cyber Security Academy"
cd "Cyber Security Academy"
```

Verify that the root contains `docker-compose.yml`, `backend/`, and `frontend/`.

---

### Step 3: Database Container Setup (Docker)
The project includes a ready-to-run PostgreSQL 15 container in `docker-compose.yml` mapped to external port **`15432`**:

```bash
# Start the PostgreSQL and Redis containers in the background
docker-compose up -d
```

Verify containers are running:
```bash
docker-compose ps
```
You should see `db` running with port `0.0.0.0:15432->5432/tcp`.

---

### Step 4: Backend Configuration & Installation

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Install backend dependencies:
   ```bash
   npm install
   ```

3. Create or verify your `.env` configuration file in `backend/.env`:
   ```env
   PORT=3000
   DATABASE_URL="postgresql://admin:password@localhost:15432/cybersec_academy?schema=public"
   JWT_SECRET="super-secret-csa-key-2024"
   ```

---

### Step 5: Database Migration & Schema Push

Synchronize the Prisma schema with the PostgreSQL database and generate the Prisma client:

```bash
# In the backend directory:
npx prisma generate
npx prisma db push
```

*Expected output*: `🚀 Your database is now in sync with your Prisma schema.`

---

### Step 6: Comprehensive Database Seeding

Populate the database with all 20 labs, 12 badges, SOC telemetry tables, and sample events:

```bash
# 1. Seed all 20 curriculum labs (10 SQLi + 10 XSS)
npx ts-node seed_labs.ts

# 2. Seed all 12 gamification badges & tier criteria
npx ts-node seed_badges.ts

# 3. Seed SOC Command Center telemetry, login audits & default broadcasts
npx ts-node seed_soc.ts

# 4. Seed offensive vulnerable simulator databases
npx ts-node seed_vuln.ts
```

---

### Step 7: Frontend Configuration & Installation

1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd ../frontend
   # (or from root: cd frontend)
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Verify build health:
   ```bash
   npm run build
   ```
   *Expected output*: `✓ built in ~1.8s` with 0 TypeScript compilation errors.

---

### Step 8: Starting the Application

Run both the backend API server and frontend development server:

#### Terminal 1 — Backend:
```bash
cd backend
npm run dev
```
*Backend runs at:* `http://localhost:3000`

#### Terminal 2 — Frontend:
```bash
cd frontend
npm run dev
```
*Frontend runs at:* `http://localhost:5173`

Open your browser and navigate to: **`http://localhost:5173`** 🎉

---

## 🔐 Default User Credentials & Clearance Roles

The application comes pre-configured with the following default accounts for testing:

### 1. Instructor / Admin SOC Master
- **URL**: `http://localhost:5173/admin`
- **Email**: `admin@csa.local`
- **Password**: `admin123`
- **Role**: `ADMIN`
- **Privileges**: Access to SOC Command Center, operator provisioning, telemetry inspection, broadcast 
alerts, approve/freeze/kick accounts.


### 2. Registering New Students
- Students who register via `/register` default to `STUDENT` role with `isApproved = false` (Pending Clearance) unless enrolled directly by an Admin via the **Enroll Operator** tool.

---

## 🔍 Database Inspection & Management Tools

You can view, search, and edit database records using any of the following four methods:

### Option A: Prisma Studio (Recommended Web GUI)
Prisma provides a built-in graphical user interface in your browser:

```bash
cd backend
npx prisma studio
```
- Open `http://localhost:5555` in your browser.
- You can browse all 8 database models: `User`, `Lab`, `Progress`, `Badge`, `UserBadge`, `LoginAudit`, `SecurityEvent`, and `BroadcastAlert`.
- Supports inline searching, sorting, row editing, and manual additions.

---

### Option B: PostgreSQL CLI (`psql` via Docker)
Inspect tables directly using the standard command line:

```bash
# Connect directly to the running PostgreSQL container
docker exec -it cyber-security-academy-db-1 psql -U admin -d cybersec_academy

# Or connect via local psql if installed on your machine:
psql -h localhost -p 15432 -U admin -d cybersec_academy
```
*(Password is: `password`)*

#### Handy SQL Query Cheat-Sheet:
```sql
-- 1. List all tables
\dt

-- 2. View all enrolled users & clearance status
SELECT id, email, role, "isApproved", xp, "activeMinutes", "lastLoginAt" FROM "User";

-- 3. View all 12 collectible badges
SELECT id, slug, name, tier, "xpReward", "criteriaType" FROM "Badge";

-- 4. View claimed badges by student
SELECT ub.id, u.email, b.name, ub."earnedAt" 
FROM "UserBadge" ub 
JOIN "User" u ON ub."userId" = u.id 
JOIN "Badge" b ON ub."badgeId" = b.id;

-- 5. View lab solve progress across all students
SELECT u.email, l.slug, p.completed, p."completedAt" 
FROM "Progress" p 
JOIN "User" u ON p."userId" = u.id 
JOIN "Lab" l ON p."labId" = l.id 
WHERE p.completed = true;

-- 6. View recent security event logs
SELECT "id", "eventType", "description", "createdAt" 
FROM "SecurityEvent" 
ORDER BY "createdAt" DESC 
LIMIT 15;

-- 7. Exit psql
\q
```

---

### Option C: Desktop Database Clients (DBeaver, pgAdmin, TablePlus)
To connect using your favorite graphical database client:

| Parameter | Connection Value |
| :--- | :--- |
| **Host** | `localhost` or `127.0.0.1` |
| **Port** | `15432` |
| **Database** | `cybersec_academy` |
| **Username** | `admin` |
| **Password** | `password` |
| **SSL Mode** | `Disable` |

---

### Option D: Built-in Admin Telemetry REST Endpoints
If you have an Admin JWT token, you can query telemetry directly via curl:

```bash
# Get overall platform stats
curl -H "Authorization: Bearer <ADMIN_TOKEN>" http://localhost:3000/api/admin/stats

# Get student roster with lab counts & active hours
curl -H "Authorization: Bearer <ADMIN_TOKEN>" http://localhost:3000/api/admin/students

# Get security audit event logs
curl -H "Authorization: Bearer <ADMIN_TOKEN>" http://localhost:3000/api/admin/events

# Get specific student dossier
curl -H "Authorization: Bearer <ADMIN_TOKEN>" http://localhost:3000/api/admin/dossier/3
```

---

## 📁 Full Project File Structure

```
Cyber Security Academy/
├── docker-compose.yml            # PostgreSQL (15432) & Redis (6379) services
├── README.md                     # Comprehensive Master Documentation (this file)
│
├── backend/
│   ├── .env                      # Database URL, JWT Secret & Port configuration
│   ├── package.json              # Backend dependencies & npm scripts
│   ├── tsconfig.json             # TypeScript configuration
│   ├── seed_labs.ts              # Seeder for 20 offensive labs
│   ├── seed_badges.ts            # Seeder for 12 honor badges
│   ├── seed_soc.ts               # Seeder for SOC telemetry & audit schema
│   ├── seed_vuln.ts              # Seeder for vulnerable SQLite targets
│   ├── prisma/
│   │   └── schema.prisma         # Unified database models & relations
│   └── src/
│       ├── index.ts              # Express application bootstrap & route mounting
│       ├── db.ts                 # PostgreSQL connection pool & Prisma client instance
│       ├── middleware/           # Security, request logger & rate-limiting middleware
│       ├── routes/
│       │   ├── auth.ts           # Login, registration, token refresh & approval
│       │   ├── admin.ts          # SOC stats, user provisioning, dossier & alert routes
│       │   ├── gamification.ts   # Badges summary, claim API & XP tracking
│       │   ├── labs.ts           # Lab catalog & solve progress routes
│       │   └── vuln.ts           # Vulnerable target endpoints (SQLi & XSS)
│       ├── services/
│       │   ├── gamification.ts   # Badge criteria evaluation & claim transaction logic
│       │   └── socTelemetry.ts   # Active time tracking, IP telemetry & anomaly flags
│       └── sims/
│           ├── sqliSim.ts        # In-memory SQLite simulator for SQLi labs
│           └── xssSim.ts         # In-memory simulator for XSS vulnerabilities
│
└── frontend/
    ├── index.html                # Single Page App HTML shell
    ├── package.json              # Frontend dependencies & npm scripts
    ├── vite.config.ts            # Vite configuration & dev server proxy
    ├── tailwind.config.js        # Tailwind CSS palette & typography extensions
    └── src/
        ├── index.css             # Core design system & 3D gaming keyframe animations
        ├── main.tsx              # React DOM mounting
        ├── App.tsx               # Client router & authentication route guards
        ├── components/
        │   ├── Navbar.tsx        # High-tech cyber navigation bar & user pill
        │   ├── ProtectedRoute.tsx# Role-based route guard (Student vs Admin)
        │   └── badges/
        │       ├── BadgeEmblem.tsx      # SVG vector emblem renderer with 5 tiers
        │       └── BadgeUnlockModal.tsx # Gaming 3D Celebration Claim Showcase
        ├── layouts/
        │   └── VulnLayout.tsx    # Split-screen offensive lab container with solve detection
        └── pages/
            ├── Login.tsx         # Operator authentication portal
            ├── Register.tsx      # Operator recruitment & registration
            ├── Dashboard.tsx     # Student cadet dashboard, modules & badges
            ├── SQLiCourseView.tsx# SQLi curriculum modules with progression lock
            ├── XSSCourseView.tsx # XSS curriculum modules with progression lock
            ├── StudentDossierView.tsx # Dedicated individual operator profile
            ├── AdminSOCDashboard.tsx  # SOC Instructor Command Center
            └── labs/             # 20 interactive vulnerable sandboxes
```

---

## 🎯 Offensive Sandboxes & Curriculum Directory

### 💉 Track 1: SQL Injection (10 Modules)
| Lab Slug | Title | Vulnerability Class | Objective |
| :--- | :--- | :--- | :--- |
| `sqli-01` | Auth Bypass | Classic String Concatenation | Login as administrator using `' OR 1=1 --` |
| `sqli-02` | UNION Column Probe | UNION-Based Infiltration | Determine column count and extract visible data |
| `sqli-03` | Schema Harvester | Information Schema Queries | Enumerate database tables and dump secret credentials |
| `sqli-04` | Error Oracle | Error-Based Type Casting | Force SQL casting errors to leak hidden fields |
| `sqli-05` | Blind Boolean | Conditional True/False Logic | Extract character-by-character password hash |
| `sqli-06` | Clock Delay | Time-Based Blind Delay | Trigger database sleep delay to confirm injection |
| `sqli-07` | Second-Order Trap | Persistent Injected Queries | Inject payload into user profile that triggers on admin review |
| `sqli-08` | OAST Channel | Out-of-Band Exfiltration | Exfiltrate data over simulated DNS/HTTP out-of-band requests |
| `sqli-09` | Filter Evasion | WAF & Keyword Bypass | Bypass space and keyword filters using comment techniques |
| `sqli-10` | Full Weaponization | Privilege Escalation | Elevate user permissions directly to superuser |

### ⚡ Track 2: Cross-Site Scripting (10 Modules)
| Lab Slug | Title | Vulnerability Class | Objective |
| :--- | :--- | :--- | :--- |
| `xss-01` | Reflected Echo | Unescaped Query Reflected | Execute `<script>alert(document.domain)</script>` |
| `xss-02` | Stored Feed | Persistent Database Storage | Inject script in comment feed executed by viewing users |
| `xss-03` | DOM Sinkhole | Client-side `innerHTML` Sink | Exploit insecure hash / parameter DOM assignment |
| `xss-04` | Attribute Escape | HTML Tag Attribute Context | Break out of value attribute using `" onfocus="alert(1)` |
| `xss-05` | Protocol Hijack | Insecure `href` / `src` Link | Execute payload via `javascript:alert(1)` |
| `xss-06` | Tag Stripper Evasion| Incomplete Blacklist Filtering | Evade regex filter via casing `<sCrIpt>` and `<img onerror>` |
| `xss-07` | Session Thief | Document Cookie Exfiltration | Steal session tokens and transmit to collector endpoint |
| `xss-08` | Stored CSRF Force | Cross-Context Action Trigger | Force automated actions on victim profile via stored script |
| `xss-09` | SVG Vector Bypass | SVG & XML Payload Context | Evade standard HTML parsers with SVG namespace vectors |
| `xss-10` | DOM Polyglot Master | Multi-Context Polyglot | Craft universal payload valid across both attribute and HTML |

---

## 🔧 Troubleshooting & Common Commands

### 1. Database Connection Refused (`ECONNREFUSED 127.0.0.1:15432`)
- Ensure Docker Desktop is running.
- Run `docker-compose up -d` in the project root.
- Verify container status with `docker-compose ps`.

### 2. Resetting the Entire Database to Fresh State
If you want to wipe all records and restore initial clean state:
```bash
# 1. Reset database tables via Prisma
cd backend
npx prisma db push --force-reset

# 2. Run all seeders in order
npx ts-node seed_labs.ts
npx ts-node seed_badges.ts
npx ts-node seed_soc.ts
npx ts-node seed_vuln.ts
```

### 3. Port Already in Use Errors
- **Port 15432 (PostgreSQL)**: Check if another local PostgreSQL instance is using port 15432: `lsof -i :15432`.
- **Port 3000 (Backend)**: Kill any dangling Node processes: `lsof -ti:3000 | xargs kill -9`.
- **Port 5173 (Frontend)**: Kill any dangling Vite processes: `lsof -ti:5173 | xargs kill -9`.

### 4. Admin Enrollment / Hot-Reload Verification
If you make code changes in the frontend:
- Run `npm run build` inside `frontend/` to ensure 0 TypeScript compilation errors.
- The Vite dev server will automatically reflect changes at `http://localhost:5173`.

---

## ⚠️ Security Disclaimer

**IMPORTANT NOTICE**: This application contains intentionally vulnerable code, simulated SQL injection sinks, and unescaped XSS execution contexts. 

- This software is created **strictly for defensive education, authorized security training, and local laboratory demonstration**.
- **DO NOT** host or deploy this application on public servers or expose it directly to the open internet.
- Ensure the application is run inside isolated environments, local subnets, or secure training sandbox networks.
