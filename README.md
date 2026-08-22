# CyberSec Academy 🛡️

CyberSec Academy is an interactive, local, vulnerable-by-design learning platform designed to teach web application security practically. 

It features an integrated learning dashboard, hands-on lab environments for executing attacks like SQL Injection (SQLi), and an administrative console to manage student progress.

## 🛠️ Technology Stack
- **Frontend**: React (Vite), TypeScript, Tailwind CSS, React Router, Lucide Icons, React Markdown.
- **Backend**: Node.js, Express.js.
- **Database**: PostgreSQL with Prisma ORM.
- **Authentication**: JWT (JSON Web Tokens) stored in localStorage, with bcrypt for password hashing.

## ✨ Core Features
- **Interactive Course Modules**: Educational content explaining vulnerabilities (e.g., SQL Injection, Error-based SQLi, UNION-based).
- **Vulnerable Lab Environments**: Real React/Express applications intentionally coded with vulnerabilities for hands-on exploitation.
- **Auto-grading System**: Progress syncs automatically when a vulnerability is successfully exploited.
- **Admin Dashboard**: Full CRUD management of users, roles, and approval workflows.
- **Profile Management**: Users can update their credentials and view their current course standings.

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have the following installed:
- Node.js (v18+)
- PostgreSQL (running locally or via Docker)

### 2. Database Setup
Create a PostgreSQL database named `cybersec_academy`.
Configure your backend `.env` file in the `/backend` directory:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/cybersec_academy?schema=public"
JWT_SECRET="super-secret-csa-key-2024"
PORT=3000
```

Apply the database schema:
```bash
cd backend
npx prisma generate
npx prisma db push
```

### 3. Start the Servers
You need to run both the frontend and backend servers simultaneously.

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

The application will be available at `http://localhost:5173`.

## 🔐 Default Credentials
By default, the system requires an Admin account to approve new student registrations. For testing purposes, you can use the following pre-configured Administrator account:

- **Email**: `admin@csa.local`
- **Password**: `admin123`

## ⚠️ Disclaimer
**This application contains intentionally vulnerable code.** 
It is designed strictly for educational purposes and local testing. Do **NOT** deploy this application to a public server or expose it to the internet, as it can be easily compromised.
