import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function initVulnSchema() {
    try {
        await pool.query(`
      CREATE TABLE IF NOT EXISTS vuln_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        password VARCHAR(50) NOT NULL,
        role VARCHAR(20) DEFAULT 'operator'
      );
      
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

      CREATE TABLE IF NOT EXISTS vuln_analytics (
        id SERIAL PRIMARY KEY,
        ip_address VARCHAR(50),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      TRUNCATE TABLE vuln_analytics RESTART IDENTITY CASCADE;

      CREATE TABLE IF NOT EXISTS vuln_profiles (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        bio TEXT,
        secret_flag VARCHAR(100)
      );
      
      TRUNCATE TABLE vuln_profiles RESTART IDENTITY CASCADE;
      INSERT INTO vuln_profiles (username, bio, secret_flag) VALUES
        ('admin', 'I am the system administrator.', 'CSA{S3C0ND_0RD3R_M4ST3R}'),
        ('operator', 'I operate the system.', NULL),
        ('viewer', 'I just view things.', NULL);
    `);
        console.log('Vulnerable schema initialized in PostgreSQL.');
        process.exit(0);
    }
    catch (err) {
        console.error('Failed to initialize vulnerable schema:', err);
        process.exit(1);
    }
}
initVulnSchema();
