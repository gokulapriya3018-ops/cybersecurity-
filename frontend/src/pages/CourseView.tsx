import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BookOpen, CheckCircle, FlaskConical, LayoutGrid, Lock, Play, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';

const MODULES = [
  {
    id: 'lesson-1',
    title: '1. What is SQL Injection?',
    type: 'lesson',
    content: `
# Introduction to SQL Injection

**SQL Injection (SQLi)** is a critical web security vulnerability that allows an attacker to interfere with the database queries made by an application. It fundamentally arises when an application trusts user input and concatenates it directly into a dynamic SQL query without proper sanitization or parameterization.

## The Core Concept

Imagine a simple login system where the backend code looks like this:
\`\`\`javascript
const query = "SELECT * FROM vuln_users WHERE username = '" + username + "' AND password = '" + password + "'";
db.execute(query);
\`\`\`

If a user enters a normal username like \`johndoe\`, the executed query is safe:
\`\`\`sql
SELECT * FROM vuln_users WHERE username = 'johndoe' AND password = 'secretpassword'
\`\`\`

However, if a malicious user enters \`admin' --\` as their username, the query transforms into:
\`\`\`sql
SELECT * FROM vuln_users WHERE username = 'admin' --' AND password = ''
\`\`\`

### Why does this work?
1. **The Single Quote (\`'\`)**: This prematurely ends the string literal intended for the username field.
2. **The Double Dash (\`--\`)**: In PostgreSQL (and many other SQL dialects), \`--\` denotes the start of a comment. This tells the database to completely ignore the remainder of the query (specifically, the password check). 

### Impact
By bypassing the password check, the attacker successfully logs in as the \`admin\` user without ever knowing their password!

## Common Defense
The universal defense against SQL Injection is using **Prepared Statements** (also known as Parameterized Queries). Prepared statements ensure that the database treats user input strictly as data, never as executable code.
`
  },
  {
    id: 'lab-1',
    title: 'Lab 1: Authentication Bypass',
    type: 'lab',
    labUrl: '/vuln/sqli-01',
    description: 'Bypass the login screen to access the admin account. Use a basic SQL injection payload in the username field.',
    walkthrough: `
### Walkthrough: Lab 1

**The Vulnerability:**
The login endpoint takes your \`username\` and \`password\` and inserts them directly into a query:
\`\`\`sql
SELECT * FROM vuln_users WHERE username = '[YOUR_USERNAME]' AND password = '[YOUR_PASSWORD]'
\`\`\`

**The Solution:**
We want to bypass the password check entirely. If we can end the query after the username check and comment out the rest of the query, the database will log us in.

1. In the **Username** field, type: \`admin'--\`
2. In the **Password** field, type anything (e.g., \`1234\`).
3. Click **Authenticate**.

**What happens?**
The query becomes:
\`\`\`sql
SELECT * FROM vuln_users WHERE username = 'admin'--' AND password = '1234'
\`\`\`
The \`--\` comments out the rest of the line. The database executes:
\`\`\`sql
SELECT * FROM vuln_users WHERE username = 'admin'
\`\`\`
Because the \`admin\` user exists, the database returns the record, and you are successfully authenticated!
`
  },
  {
    id: 'lesson-2',
    title: '2. Error-Based SQL Injection',
    type: 'lesson',
    content: `
# Error-Based SQL Injection

Sometimes, an application is vulnerable to SQL injection, but it doesn't return the results of the query cleanly. However, if the application displays verbose database errors to the user, attackers can use **Error-Based SQL Injection**.

## How it works

When an application fails to handle database errors gracefully and instead outputs them to the frontend, attackers can intentionally craft inputs that cause syntax errors or mathematical errors (like divide-by-zero). 

### Example 1: Breaking Syntax
If a search field uses:
\`\`\`sql
SELECT * FROM vuln_products WHERE name LIKE '%$search_term%'
\`\`\`
An attacker can input just a single quote: \`'\`.
The query becomes:
\`\`\`sql
SELECT * FROM vuln_products WHERE name LIKE '%'%'
\`\`\`
This causes a syntax error (unterminated quoted string), proving that the application is vulnerable.

### Example 2: Extracting Data via Errors
Attackers can use advanced techniques to force the database to evaluate a subquery and throw an error containing the result. For example, in PostgreSQL:
\`\`\`sql
' AND CAST((SELECT password FROM vuln_users LIMIT 1) AS INTEGER) = 1--
\`\`\`
Because a password (string) cannot be cast to an integer, PostgreSQL will throw an error like:
> \`invalid input syntax for type integer: "secret_admin_password"\`

The attacker just extracted the password via the error message!

## Defensive Mitigation
Never display raw database errors in a production environment. Catch exceptions and display generic error messages to the user while logging the detailed errors securely on the server.
`
  },
  {
    id: 'lab-2',
    title: 'Lab 2: Product Search Error',
    type: 'lab',
    labUrl: '/vuln/sqli-02',
    description: 'This lab contains an error-based SQL injection vulnerability in the search field. Break the query to trigger a database error.',
    walkthrough: `
### Walkthrough: Lab 2

**The Vulnerability:**
The search field takes your input and places it inside a \`LIKE\` clause:
\`\`\`sql
SELECT * FROM vuln_products WHERE name LIKE '%[YOUR_SEARCH]%'
\`\`\`

**The Solution:**
Our goal in Error-Based SQLi is to intentionally cause a syntax error to prove the backend is blindly executing our input.

1. In the search box, simply type a single quote: \`'\`
2. Click **Search**.

**What happens?**
The backend substitutes your quote into the query:
\`\`\`sql
SELECT * FROM vuln_products WHERE name LIKE '%'%'
\`\`\`
The first \`'\` closes the string literal \`'%\`. The database then expects a SQL keyword, but instead it encounters another \`%\` and \`'\`. This causes a **syntax error**. Because the backend doesn't handle the error securely, it returns the raw database exception to the screen. 
`
  },
  {
    id: 'lesson-3',
    title: '3. UNION-Based SQL Injection',
    type: 'lesson',
    content: `
# Extracting Data with UNION

When an application is vulnerable to SQL injection and returns the results of a query directly to the screen (like a product list or a user profile), attackers can use the \`UNION\` operator to extract data from completely different tables.

## The UNION Operator
The \`UNION\` keyword in SQL allows you to execute one or more additional \`SELECT\` queries and append their results to the original query.

For example:
\`\`\`sql
SELECT name, price FROM products
UNION
SELECT username, password FROM users
\`\`\`
This will return a single table containing both the products and the user credentials!

## The Two Rules of UNION Attacks
To successfully execute a UNION attack, two strict rules must be met:
1. **Same Number of Columns:** The injected query must return the exact same number of columns as the original query. 
2. **Compatible Data Types:** The data types of each column in the injected query must be compatible with the corresponding columns in the original query.

### Finding the Number of Columns
Attackers typically use \`ORDER BY\` or inject \`NULL\` values until the query succeeds:
\`\`\`sql
' UNION SELECT NULL--
' UNION SELECT NULL, NULL--
' UNION SELECT NULL, NULL, NULL--
\`\`\`
If the query with 3 \`NULL\`s succeeds, the original query returns 3 columns.

### Extracting the Data
Once the columns are known, the attacker can extract data from other tables:
\`\`\`sql
' UNION SELECT username, password, role FROM vuln_users--
\`\`\`
`
  },
  {
    id: 'lab-3',
    title: 'Lab 3: UNION Data Extraction',
    type: 'lab',
    labUrl: '/vuln/sqli-03',
    description: 'Use a UNION attack on the product details ID parameter to extract the passwords of all users from the vuln_users table.',
    walkthrough: `
### Walkthrough: Lab 3

**The Vulnerability:**
The product details page fetches a product by its ID from the URL (e.g. \`?id=1\`). The query is:
\`\`\`sql
SELECT * FROM vuln_products WHERE id = [YOUR_ID]
\`\`\`

**The Solution:**
We will use \`UNION SELECT\` to fetch data from the \`vuln_users\` table and display it alongside the product data. First, we must find the number of columns. The \`vuln_products\` table has 5 columns: \`id, name, description, category, price\`.

1. Append a UNION query to the URL parameter that returns 5 columns from the users table.
2. The URL parameter should be: \`1 UNION SELECT id, username, password, role, 1.0 FROM vuln_users--\`

**What happens?**
The query becomes:
\`\`\`sql
SELECT * FROM vuln_products WHERE id = 1 UNION SELECT id, username, password, role, 1.0 FROM vuln_users--
\`\`\`
Because both \`SELECT\` statements return 5 columns of compatible types, the database merges the results. The UI expects product data, but it receives user credentials (passwords in the description field, usernames in the name field) and renders them on the screen!
`
  },
  {
    id: 'lesson-4',
    title: '4. Boolean Blind SQL Injection',
    type: 'lesson',
    content: `
# Boolean Blind SQL Injection

What happens when an application is vulnerable to SQL injection, but it returns **no data** and **no errors**? We can still extract data, but we have to ask the database "True or False" questions, one character at a time. This is known as **Boolean Blind SQLi**.

## The Concept

Imagine an endpoint that checks if a username is available. It only returns \`True\` (Username Taken) or \`False\` (Username Available). 

If we inject a condition that forces the query to evaluate our custom logic, we can observe the True/False response to infer information.

### Example Attack
Let's say we want to steal the admin's password. We can inject a payload that checks if the first letter of the password is 'a':

\`\`\`sql
admin' AND SUBSTRING((SELECT password FROM vuln_users WHERE username='admin'), 1, 1) = 'a'--
\`\`\`

* If the response is **True** (Username Taken), we know the first letter is 'a'.
* If the response is **False** (Username Available), we know the first letter is NOT 'a'.

We then repeat this for 'b', 'c', 'd', etc., until we find the first character. Then we move to the second character:

\`\`\`sql
admin' AND SUBSTRING((SELECT password FROM vuln_users WHERE username='admin'), 2, 1) = 'b'--
\`\`\`

By iterating through all possible characters for each position, an attacker can extract entire tables of data without ever seeing a direct database response. While tedious, this process is easily automated using tools like SQLmap.
`
  },
  {
    id: 'lab-4',
    title: 'Lab 4: User Lookup',
    type: 'lab',
    labUrl: '/vuln/sqli-04',
    description: 'This lab contains a Boolean blind SQL injection vulnerability. You must inject true/false conditions to verify if an injection is possible.',
    walkthrough: `
### Walkthrough: Lab 4

**The Vulnerability:**
The API checks if a user exists by executing:
\`\`\`sql
SELECT id FROM vuln_users WHERE username = '[YOUR_INPUT]'
\`\`\`
It only returns "User Exists" (True) or "User Not Found" (False).

**The Solution:**
We can append \`AND 1=1\` (True) and \`AND 1=2\` (False) to confirm we control the logic.

1. Enter \`admin\` - Result: True.
2. Enter \`admin' AND 1=1--\`
3. Enter \`admin' AND 1=2--\`

**What happens?**
When you enter \`admin' AND 1=1--\`, the query is:
\`\`\`sql
SELECT id FROM vuln_users WHERE username = 'admin' AND 1=1
\`\`\`
Since \`1=1\` is true and admin exists, it returns True.

When you enter \`admin' AND 1=2--\`, the query is:
\`\`\`sql
SELECT id FROM vuln_users WHERE username = 'admin' AND 1=2
\`\`\`
Since \`1=2\` is false, the database returns no rows, resulting in False. This proves you can ask the database *any* yes/no question!
`
  },
  {
    id: 'lesson-5',
    title: '5. Numeric SQL Injection',
    type: 'lesson',
    content: `
# Numeric Context SQLi

So far, we've looked at injections within string fields, which require breaking out of quotes using a single quote (\`'\`). But SQL Injection doesn't only happen in string fields. 

Often, applications take numeric IDs, prices, or counts and insert them directly into queries **without quotes**.

## The Concept

Consider a product filter that takes a \`price\` parameter from the URL (\`?price=1000\`):
\`\`\`sql
SELECT * FROM vuln_products WHERE price < $price
\`\`\`

Since the backend expects a number, it doesn't wrap the \`$price\` variable in quotes. 

### The Attack
Because there are no quotes to break out of, the attacker can simply append SQL keywords directly to the number!

If we inject \`1000 OR 1=1\`, the query becomes:
\`\`\`sql
SELECT * FROM vuln_products WHERE price < 1000 OR 1=1
\`\`\`

### The Impact
The condition \`1=1\` is always true. By injecting \`OR 1=1\`, the attacker forces the database to return **all products** in the database, completely bypassing the price filter!

### Advanced Numeric Injection
In numeric contexts, you can also append UNION attacks directly:
\`\`\`sql
1000 UNION SELECT username, password, NULL, NULL FROM vuln_users
\`\`\`
`
  },
  {
    id: 'lab-5',
    title: 'Lab 5: Product Filter',
    type: 'lab',
    labUrl: '/vuln/sqli-05',
    description: 'Bypass the price filter by injecting a boolean OR condition into the numeric parameter.',
    walkthrough: `
### Walkthrough: Lab 5

**The Vulnerability:**
The numeric price filter concatenates your input directly into the query without quotes:
\`\`\`sql
SELECT * FROM vuln_products WHERE price < [YOUR_INPUT]
\`\`\`

**The Solution:**
Because there are no quotes, you don't need a single quote \`'\` to break out. You can just append SQL keywords directly to the number.

1. In the price filter input, enter: \`100 OR 1=1\`
2. Apply the filter.

**What happens?**
The query becomes:
\`\`\`sql
SELECT * FROM vuln_products WHERE price < 100 OR 1=1
\`\`\`
The database evaluates \`1=1\` as true for *every single row* in the \`vuln_products\` table. Therefore, it ignores the price restriction entirely and returns all products in the catalog!
`
  },
  {
    id: 'lesson-6',
    title: '6. API SQL Injection',
    type: 'lesson',
    content: `
# JSON / REST API Injection

Modern web applications often communicate using JSON payloads over REST APIs instead of traditional URL parameters or form data. However, the fundamental vulnerability remains exactly the same: **untrusted data is concatenated into a SQL query**.

## The Vulnerability

Consider a modern React frontend sending a search request to a Node.js backend:

\`\`\`json
{
  "search": "shoes"
}
\`\`\`

If the backend extracts the \`search\` value and concatenates it:
\`\`\`javascript
const { search } = req.body;
const query = \`SELECT * FROM products WHERE name LIKE '%\${search}%'\`;
\`\`\`

### The Attack
An attacker can intercept the API request (using tools like Burp Suite, or simply via the browser DevTools) and modify the JSON payload:

\`\`\`json
{
  "search": "shoes' OR '1'='1"
}
\`\`\`

The backend parses the JSON and dangerously concatenates the string, resulting in:
\`\`\`sql
SELECT * FROM products WHERE name LIKE '%shoes' OR '1'='1%'
\`\`\`

### Key Takeaway
APIs are not inherently secure against SQL injection. Whether the data comes from a URL parameter, a form field, or a JSON payload, it must be parameterized before touching the database.
`
  },
  {
    id: 'lab-6',
    title: 'Lab 6: REST API Search',
    type: 'lab',
    labUrl: '/vuln/sqli-06',
    description: 'Exploit the JSON-based API search functionality to return all products.',
    walkthrough: `
### Walkthrough: Lab 6

**The Vulnerability:**
The API receives a JSON payload: \`{"search": "value"}\`. It extracts the value and places it into a \`LIKE\` query:
\`\`\`sql
SELECT * FROM vuln_products WHERE name LIKE '%[YOUR_SEARCH]%'
\`\`\`

**The Solution:**
You can inject standard SQLi payloads directly into the JSON value. We will use an \`OR\` condition to bypass the search filter.

1. Modify the JSON payload on the left side of the screen.
2. Change the \`search\` value to: \`hacker' OR '1'='1\`
3. Click "Send Request".

**What happens?**
The backend extracts your payload and builds the query:
\`\`\`sql
SELECT * FROM vuln_products WHERE name LIKE '%hacker' OR '1'='1%'
\`\`\`
Because \`'1'='1'\` is true, the \`WHERE\` clause evaluates to true for every product in the database. The API dumps the entire product table in the JSON response!
`
  },
  {
    id: 'lesson-7',
    title: '7. Cookie-Based SQL Injection',
    type: 'lesson',
    content: `
# Cookie Injection

Any input that the server reads and uses in a database query is a potential vector for SQL Injection. This includes HTTP headers (like \`User-Agent\`, \`X-Forwarded-For\`) and **Cookies**!

## The Vulnerability

Many applications use cookies to track user sessions or analytics. 
Imagine an application that tracks returning visitors using a cookie: \`TrackingId=xyz123\`.

On the backend, it logs the visit:
\`\`\`sql
UPDATE vuln_tracking SET visits = visits + 1 WHERE id = 'xyz123'
\`\`\`

### The Attack
Because cookies are stored on the client-side, the user has full control over them. An attacker can modify their \`TrackingId\` cookie using browser DevTools or a proxy:

**Modified Cookie:** \`TrackingId=xyz123'; SELECT pg_sleep(5)--\`

The executed query becomes:
\`\`\`sql
UPDATE vuln_tracking SET visits = visits + 1 WHERE id = 'xyz123'; SELECT pg_sleep(5)--'
\`\`\`

### Why is this dangerous?
Developers often assume that cookies (or HTTP headers) are generated by the server and are therefore "safe" from tampering. This false sense of security often leads to missing sanitization on these fields.

Never trust *any* data that originates from the client.
`
  },
  {
    id: 'lab-7',
    title: 'Lab 7: Cookie Tracking',
    type: 'lab',
    labUrl: '/vuln/sqli-07',
    description: 'Use the built-in Cookie Manager to inject SQL via the tracking_id cookie.',
    walkthrough: `
### Walkthrough: Lab 7

**The Vulnerability:**
The application reads the \`tracking_id\` cookie from your browser and uses it in a query to fetch your activity:
\`\`\`sql
SELECT * FROM vuln_tracking WHERE id = '[YOUR_COOKIE]'
\`\`\`

**The Solution:**
We can use the built-in Cookie Manager to tamper with our cookie value, injecting a boolean \`OR\` condition to dump all tracking records.

1. Click the "Cookie Manager" button.
2. Edit the \`tracking_id\` value. Change it to: \`' OR '1'='1\`
3. Save the cookie and reload the page.

**What happens?**
The backend reads your malicious cookie and executes:
\`\`\`sql
SELECT * FROM vuln_tracking WHERE id = '' OR '1'='1'
\`\`\`
Because \`'1'='1'\` is true, the query bypasses the specific ID check and returns the tracking records for *every* user in the database.
`
  },
  {
    id: 'lesson-8',
    title: '8. Time-Based Blind SQL Injection',
    type: 'lesson',
    content: `
# Time-Based Blind SQLi

What if an application is completely blind? It returns no data, no errors, and its behavior (True/False) does not change regardless of what you inject. 

In this scenario, we can use **Time-Based Blind SQLi**.

## The Concept

Instead of looking for visual differences on the page, we instruct the database to **pause (sleep)** for a specific number of seconds if a condition is true. By measuring how long the server takes to respond, we can infer whether our injected condition was true or false.

### The Attack
In PostgreSQL, the function to pause execution is \`pg_sleep()\`. 

Let's check if the admin's password starts with 'a':
\`\`\`sql
'; SELECT CASE WHEN (SUBSTRING((SELECT password FROM vuln_users WHERE username='admin'), 1, 1) = 'a') THEN pg_sleep(5) ELSE pg_sleep(0) END--
\`\`\`

* If the server responds **immediately**, the first letter is NOT 'a'.
* If the server **hangs for 5 seconds** before responding, we know with 100% certainty that the first letter IS 'a'!

### Impact
Time-based injection is the most reliable fallback when all other SQLi techniques fail. While it is the slowest method of data extraction, it is incredibly powerful because it works entirely independently of the application's visual output.
`
  },
  {
    id: 'lab-8',
    title: 'Lab 8: Order Status',
    type: 'lab',
    labUrl: '/vuln/sqli-08',
    description: 'This lab contains a Time-based blind vulnerability. Use pg_sleep() to verify the injection.',
    walkthrough: `
### Walkthrough: Lab 8

**The Vulnerability:**
The order lookup executes a query but suppresses all output and errors. We can't see the result, but we can measure how long the query takes to execute.

**The Solution:**
We will use PostgreSQL's \`pg_sleep()\` function to pause the database execution.

1. In the Order ID field, enter: \`ORD-1234'; SELECT pg_sleep(3)--\`
2. Click "Check Status".
3. Watch the loading spinner and the "Response Time" in the debug panel.

**What happens?**
The query becomes:
\`\`\`sql
SELECT * FROM vuln_orders WHERE order_id = 'ORD-1234'; SELECT pg_sleep(3)--'
\`\`\`
The semicolon (\`;\`) ends the first query. The database then executes the second query: \`SELECT pg_sleep(3)\`. This forces the database to halt for exactly 3 seconds before responding. The 3000ms+ response time proves definitively that you have arbitrary code execution on the database!
`
  },
  {
    id: 'lesson-9',
    title: '9. HTTP Header Injection',
    type: 'lesson',
    content: `
# HTTP Header Injection

SQL injection isn't limited to visible input fields like search boxes or login forms. Any data sent from the client to the server is a potential vector—including HTTP headers.

## The Concept

When your browser makes a request to a website, it sends invisible metadata in HTTP headers. Examples include:
* \`User-Agent\`: Identifies your browser and OS.
* \`X-Forwarded-For\`: Identifies your original IP address if you are behind a proxy.
* \`Referer\`: Tells the server which page linked you here.

Servers frequently log this telemetry data into databases for analytics. If the developer uses a direct string concatenation like \`INSERT INTO logs (ip, user_agent) VALUES ('127.0.0.1', '$user_agent')\`, the system is vulnerable.

### The Attack

Because you cannot edit HTTP headers using standard web forms, you must use an interception proxy like **Burp Suite** to modify the request in transit. By intercepting the request, you can rewrite the \`User-Agent\` header to contain an SQL injection payload:

\`\`\`http
GET /api/analytics HTTP/1.1
Host: example.com
User-Agent: hacker', (SELECT pg_sleep(5)))--
\`\`\`

If the server logs this blindly, the payload executes!
`
  },
  {
    id: 'lab-9',
    title: 'Lab 9: Header Injection',
    type: 'lab',
    labUrl: '/vuln/sqli-09',
    description: 'Use an interception proxy to inject SQL into the User-Agent header.',
    walkthrough: `
### Walkthrough: Lab 9

**The Vulnerability:**
The backend blindly inserts your \`User-Agent\` HTTP header into a \`vuln_analytics\` table:
\`\`\`sql
INSERT INTO vuln_analytics (ip_address, user_agent) VALUES ('[IP]', '[YOUR_USER_AGENT]')
\`\`\`

**The Solution:**
Because there are no input fields on the screen, you *must* use an interception proxy like Burp Suite.

1. Configure your browser to proxy traffic through Burp Suite.
2. Click the "Send Telemetry Ping" button on the lab page.
3. Intercept the request in Burp Suite.
4. Modify the \`User-Agent\` header to: \`hacker', (SELECT pg_sleep(3)))--\`
5. Forward the request.

**What happens?**
The query becomes:
\`\`\`sql
INSERT INTO vuln_analytics (ip_address, user_agent) VALUES ('127.0.0.1', 'hacker', (SELECT pg_sleep(3)))--')
\`\`\`
The database inserts the string 'hacker', but then evaluates the \`pg_sleep(3)\` function, confirming code execution!
`
  },
  {
    id: 'lesson-10',
    title: '10. Second-Order SQL Injection',
    type: 'lesson',
    content: `
# Second-Order SQL Injection

Second-Order SQLi is one of the most dangerous and difficult vulnerabilities to detect. 

## The Concept

In a standard (First-Order) SQL injection, the payload executes immediately when it reaches the server. 

In a **Second-Order** injection, the payload is initially inserted into the database **safely** (using parameterized queries or escaping). The vulnerability occurs later, when that safely-stored payload is retrieved from the database and used unsafely in a *different* query.

### The Attack Flow

1. **The Trap (Safe Insert):** You register an account with the username \`admin'--\`. The application uses parameterized queries for registration, so the string is stored safely in the database exactly as typed.
2. **The Trigger (Unsafe Use):** Later, you log in and go to "View Profile". The backend fetches your username from your session cookie, assumes it's safe because it came from the database, and concatenates it into a new query: \`SELECT bio FROM profiles WHERE username = '$username'\`.
3. **Execution:** Because your username is \`admin'--\`, the query becomes \`SELECT bio FROM profiles WHERE username = 'admin'--'\`. The payload executes, altering the logic and returning the real admin's bio instead of yours!

This demonstrates why developers must treat *all* data as untrusted, even if it comes directly from their own database.
`
  },
  {
    id: 'lab-10',
    title: 'Lab 10: Second-Order SQLi',
    type: 'lab',
    labUrl: '/vuln/sqli-10',
    description: 'Bypass a perfectly secure insert statement to trigger a vulnerability later during a read operation.',
    walkthrough: `
### Walkthrough: Lab 10

**The Vulnerability:**
The "Edit Profile" feature uses 100% secure, parameterized queries to update your profile. However, the "View Profile" feature retrieves your username and dangerously concatenates it into a second query.

**The Solution:**
We will plant a trap in the database, then trigger it.

1. Stay on the "Edit Profile" tab.
2. Change your Username to: \`admin'--\`
3. Click "Save Changes". Note that it saves successfully without executing the payload. The trap is set.
4. Switch to the "View Profile" tab. This triggers the payload.

**What happens?**
When you switch to View Profile, the backend safely looks up your ID (2) and retrieves your malicious username (\`admin'--\`). It then blindly inserts it into the view query:
\`\`\`sql
SELECT bio, secret_flag FROM vuln_profiles WHERE username = 'admin'--'
\`\`\`
The \`--\` comments out the rest of the query, effectively removing the closing quote. The database interprets this as: "Select the profile where the username is exactly 'admin'". 

You successfully hijacked the query to read the system administrator's profile and stole their secret flag!
`
  },
  {
    id: 'quiz-1',
    title: 'Final Knowledge Check',
    type: 'quiz',
    description: 'Test your understanding of SQL Injection concepts.',
    questions: [
      {
        question: "Which character is commonly used to prematurely end a string literal in an SQL query?",
        options: ["--", "#", "'", ";"],
        correct: 2
      },
      {
        question: "What is the primary defense mechanism against SQL Injection?",
        options: ["Web Application Firewall (WAF)", "Prepared Statements (Parameterized Queries)", "Base64 Encoding", "Input length limits"],
        correct: 1
      },
      {
        question: "In a UNION-based SQL injection, what strict rule must be followed?",
        options: ["The injected query must return the exact same number of columns as the original query", "Error messages must be visible", "The backend must be using PostgreSQL", "The injected query must return only one row"],
        correct: 0
      }
    ]
  }
];

export default function CourseView(): JSX.Element {
  const [activeModuleId, setActiveModuleId] = useState(MODULES[0].id);
  const [completedModules, setCompletedModules] = useState<Record<string, boolean>>({});
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  
  useEffect(() => {
    const fetchProgress = async () => {
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
              // Map the backend slug back to the frontend module ID
              const mod = MODULES.find(m => 
                m.id === p.lab.slug || (m.labUrl && m.labUrl.endsWith(p.lab.slug))
              );
              if (mod) {
                completedMap[mod.id] = true;
              } else {
                completedMap[p.lab.slug] = true; // Fallback
              }
            }
          });
          setCompletedModules(completedMap);
        }
      } catch (err) {
        console.error('Failed to load progress', err);
      }
    };

    fetchProgress();
    
    // Auto-refresh when tab is focused
    window.addEventListener('focus', fetchProgress);
    return () => window.removeEventListener('focus', fetchProgress);
  }, []);
  
  const activeModule = MODULES.find(m => m.id === activeModuleId) || MODULES[0];
  const activeIndex = MODULES.findIndex(m => m.id === activeModuleId);

  const markCompleteAndNext = async () => {
    // Optimistic UI update
    setCompletedModules(prev => ({ ...prev, [activeModule.id]: true }));
    
    // In a real app, you would send a request to the /api/progress/complete endpoint here
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
      } catch (err) {
        console.error('Failed to sync progress');
      }
    }

    if (activeIndex < MODULES.length - 1) {
      setActiveModuleId(MODULES[activeIndex + 1].id);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-[#0A0A0F] rounded-2xl border border-white/10 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-500">
      
      {/* Sidebar */}
      <div className="w-80 bg-[#12121A] border-r border-white/5 flex flex-col">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-500" />
            SQL Injection
          </h2>
          <p className="text-sm text-slate-400 mt-2 font-medium">Masterclass • 10 Labs</p>
          
          <div className="mt-4 bg-white/5 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-indigo-500 h-full transition-all duration-500 ease-out" 
              style={{ width: `${(Object.keys(completedModules).length / MODULES.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {MODULES.map((mod, index) => {
            const isCompleted = completedModules[mod.id];
            const isActive = activeModuleId === mod.id;
            const isLocked = index > 0 && !completedModules[MODULES[index - 1].id];

            return (
              <button
                key={mod.id}
                disabled={isLocked}
                onClick={() => {
                  setActiveModuleId(mod.id);
                  setShowWalkthrough(false);
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                  isActive 
                    ? 'bg-indigo-500/10 border border-indigo-500/20 text-white' 
                    : isLocked
                      ? 'opacity-40 cursor-not-allowed text-slate-500'
                      : 'hover:bg-white/5 text-slate-300'
                }`}
              >
                <div className={`shrink-0 ${isCompleted ? 'text-green-400' : isActive ? 'text-indigo-400' : 'text-slate-500'}`}>
                  {isCompleted ? <CheckCircle className="w-5 h-5" /> : 
                   isLocked ? <Lock className="w-5 h-5" /> :
                   mod.type === 'lesson' ? <BookOpen className="w-5 h-5" /> :
                   mod.type === 'quiz' ? <LayoutGrid className="w-5 h-5" /> :
                   <FlaskConical className="w-5 h-5" />}
                </div>
                <div className="flex-1 truncate font-medium text-sm">
                  {mod.title}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-[#0A0A0F] relative">
        <div className="max-w-4xl mx-auto p-10 lg:p-16">
          
          {activeModule.type === 'lesson' && (
            <div className="prose prose-invert prose-indigo max-w-none prose-pre:bg-[#1A1B26] prose-pre:border prose-pre:border-white/10 animate-in fade-in slide-in-from-bottom-4">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {activeModule.content || ''}
              </ReactMarkdown>
              
              <div className="mt-12 pt-8 border-t border-white/10">
                <button 
                  onClick={markCompleteAndNext}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
                >
                  Mark Complete & Continue <Play className="w-4 h-4 fill-current" />
                </button>
              </div>
            </div>
          )}

          {activeModule.type === 'lab' && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <div className="flex gap-3 mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-widest">
                  Practical Application
                </div>
                {completedModules[activeModule.id] ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-bold uppercase tracking-widest">
                    <CheckCircle className="w-4 h-4" /> Completed
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold uppercase tracking-widest">
                    <Play className="w-4 h-4" /> In Progress
                  </div>
                )}
              </div>
              <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight mb-6">
                {activeModule.title}
              </h1>
              <p className="text-xl text-slate-300 leading-relaxed mb-12">
                {activeModule.description}
              </p>
              
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={() => window.open(activeModule.labUrl, '_blank')}
                  className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 font-bold text-white bg-indigo-600 rounded-xl overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                  <span className="relative">Access the lab</span>
                  <Play className="relative w-5 h-5 fill-current" />
                </button>
                
                {/* @ts-ignore - walkthrough property exists on lab objects but TS doesn't infer perfectly from union array without strict typing */}
                {activeModule.walkthrough && (
                  <button
                    onClick={() => setShowWalkthrough(!showWalkthrough)}
                    className="inline-flex items-center justify-center gap-2 px-6 py-4 font-bold text-slate-300 bg-white/5 border border-white/10 rounded-xl transition-all hover:bg-white/10"
                  >
                    {showWalkthrough ? 'Hide Walkthrough' : 'View Walkthrough'}
                    {showWalkthrough ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                )}
              </div>

              {/* @ts-ignore */}
              {showWalkthrough && activeModule.walkthrough && (
                <div className="mt-8 p-8 bg-[#12121A] border border-indigo-500/30 rounded-2xl animate-in fade-in slide-in-from-top-4">
                  <div className="prose prose-invert prose-indigo max-w-none prose-pre:bg-[#0A0A0F] prose-pre:border prose-pre:border-white/10">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {(activeModule as any).walkthrough}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
              
              <div className="mt-12 pt-8 border-t border-white/10 flex justify-between items-center">
                <span className="text-slate-400 text-sm font-medium">
                  {completedModules[activeModule.id] 
                    ? "Lab successfully completed!" 
                    : "Verify your completion by successfully solving the lab environment."}
                </span>
                {completedModules[activeModule.id] && activeIndex < MODULES.length - 1 && (
                  <button 
                    onClick={() => {
                      setActiveModuleId(MODULES[activeIndex + 1].id);
                      setShowWalkthrough(false);
                    }}
                    className="text-indigo-400 hover:text-indigo-300 font-bold text-sm bg-indigo-500/10 px-4 py-2 rounded-lg border border-indigo-500/20"
                  >
                    Continue to next module →
                  </button>
                )}
              </div>
            </div>
          )}

          {activeModule.type === 'quiz' && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-bold uppercase tracking-widest mb-6">
                Knowledge Check
              </div>
              <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight mb-6">
                {activeModule.title}
              </h1>
              <p className="text-xl text-slate-300 leading-relaxed mb-12">
                {(activeModule as any).description}
              </p>

              <div className="space-y-10">
                {(activeModule as any).questions.map((q: any, qIdx: number) => (
                  <div key={qIdx} className="bg-[#12121A] border border-white/5 p-6 rounded-2xl">
                    <h3 className="text-lg font-bold text-white mb-4">{qIdx + 1}. {q.question}</h3>
                    <div className="space-y-3">
                      {q.options.map((opt: string, optIdx: number) => {
                        const isSelected = quizAnswers[qIdx] === optIdx;
                        const isCorrect = optIdx === q.correct;
                        const showStatus = quizSubmitted;

                        return (
                          <button
                            key={optIdx}
                            disabled={quizSubmitted}
                            onClick={() => setQuizAnswers(prev => ({ ...prev, [qIdx]: optIdx }))}
                            className={`w-full text-left p-4 rounded-xl border transition-all ${
                              showStatus
                                ? isCorrect
                                  ? 'bg-green-500/10 border-green-500/30 text-green-300'
                                  : isSelected
                                    ? 'bg-red-500/10 border-red-500/30 text-red-300'
                                    : 'bg-white/5 border-transparent text-slate-400 opacity-50'
                                : isSelected
                                  ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                                  : 'bg-white/5 border-transparent text-slate-300 hover:bg-white/10 hover:border-white/10'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span>{opt}</span>
                              {showStatus && isCorrect && <CheckCircle className="w-5 h-5 text-green-400" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {!quizSubmitted ? (
                <div className="mt-10 border-t border-white/10 pt-8 flex justify-end">
                  <button 
                    onClick={() => {
                      setQuizSubmitted(true);
                      if (Object.keys(quizAnswers).length === (activeModule as any).questions.length) {
                        markCompleteAndNext();
                      }
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                    disabled={Object.keys(quizAnswers).length !== (activeModule as any).questions.length}
                  >
                    Submit Answers
                  </button>
                </div>
              ) : (
                <div className="mt-10 border-t border-white/10 pt-8 flex justify-end">
                   <button 
                    onClick={() => {
                      setQuizSubmitted(false);
                      setQuizAnswers({});
                    }}
                    className="bg-white/5 border border-white/10 text-white hover:bg-white/10 px-8 py-3 rounded-xl font-bold transition-all"
                  >
                    Retry Quiz
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
