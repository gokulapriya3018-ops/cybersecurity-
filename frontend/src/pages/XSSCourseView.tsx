import { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BookOpen, CheckCircle, FlaskConical, LayoutGrid, Play, ShieldAlert, ChevronDown, ChevronUp, Lock, RotateCw } from 'lucide-react';

const MODULES = [
  {
    id: 'lesson-1',
    title: '1. What is Cross-Site Scripting? (Beginner Foundations)',
    type: 'lesson',
    content: `
# Module 1: The Absolute Fundamentals of Cross-Site Scripting (XSS)

Welcome to the **CyberForge Cross-Site Scripting (XSS) Masterclass**!
If you have never written a line of JavaScript, don't know what the DOM is, or are wondering how a hacker can take over an account through a web browser, **this guide is built for you**. We will spoon-feed every single concept step-by-step.

---

## Step 1: The Anatomy of a Web Browser (HTML, CSS & JavaScript)

When you visit any website on the internet (like YouTube, Google, or your bank), your web browser (Chrome, Edge, Safari, Firefox) downloads three kinds of files from the server:

1. **HTML (HyperText Markup Language)**: The skeleton / structure of the page.
   * \`<h1>Welcome</h1>\`: A big bold header.
   * \`<p>Hello world</p>\`: A paragraph of text.
   * \`<input type="text">\`: A text box where you type your username.
2. **CSS (Cascading Style Sheets)**: The makeup / colors / layouts (e.g. blue buttons, dark mode background).
3. **JavaScript (JS)**: **The active brain and engine of the website.**
   * JavaScript is real executable programming code that runs **directly inside your personal computer's web browser**!
   * It handles animations, fetches messages without refreshing the page, validates credit cards, and listens for button clicks.

---

## Step 2: What are Cookies and Session Tokens?

When you log into an application:
1. You submit your username and password.
2. The server checks the database and says: *"Yes, you are Alice!"*
3. The server hands your browser a secret digital pass called a **Session Cookie** or **JWT Token** (e.g. \`eyJhbGciOi...\`).
4. Your browser stores this pass in **Cookies** (\`document.cookie\`) or in **LocalStorage** (\`localStorage.getItem('token')\`).
5. Every time you click a button or open a page, your browser automatically hands this pass to the server so you don't have to re-type your password every second.

### The Golden Rule of Web Security:
> **Whoever holds your session token IS you in the eyes of the server!**  
> If an attacker can get a copy of your session token, they can log into your account instantly from anywhere on Earth without ever guessing your password!

---

## Step 3: What is Cross-Site Scripting (XSS)?

Now, here is the vulnerability:

JavaScript is **extremely powerful**. Any JavaScript code running inside your browser can:
* Read your secret session tokens: \`alert(document.cookie)\` or \`localStorage.getItem('token')\`.
* Steal everything you type (keylogging): \`window.addEventListener('keypress', ...)\`.
* Silently make bank transfers or change your email using your own logged-in session!
* Display fake login screens to steal your credentials.

Normally, only the legitimate website developers write the JavaScript for their site.
**Cross-Site Scripting (XSS) happens when an application accidentally lets an external USER (an attacker) inject their own malicious JavaScript code into a webpage, and the browser executes it!**

\`\`\`
  [Attacker submits: <script>stealCookies()</script>]
                         │
                         ▼
        [Vulnerable Web Application / Server]
   (Saves or reflects the raw text without encoding)
                         │
                         ▼
             [Victim Visits the Webpage]
                         │
                         ▼
              [Victim's Web Browser]
  "The server sent me a <script> tag! I must run it!"
                         │
                         ▼
    [Attacker's malicious script executes in victim's browser!]
\`\`\`

---

## Step 4: The 3 Main Flavors of XSS

Security researchers divide XSS into three primary categories:

### 1. Reflected XSS (Immediate / Non-Persistent)
* **What happens**: The website receives input in the URL (like a search query) and immediately echoes it back in the HTML response.
* **The scenario**: An attacker sends you a malicious link: \`https://bank.local/search?q=<script>alert(1)</script>\`. When you click it, the search page displays *"Results for: <script>alert(1)</script>"*, and your browser executes the script!

### 2. Stored XSS (Persistent / The Time-Bomb)
* **What happens**: The attacker submits a malicious script into a database (like a public comment board, forum thread, or user bio).
* **The scenario**: The attacker posts a comment: \`<img src=x onerror="steal()">\`. The comment is saved permanently in PostgreSQL. **Every single user who ever views that comment board runs the attacker's script automatically!**

### 3. DOM-Based XSS (Client-Side Only)
* **What happens**: The server never even sees the payload! The vulnerability lives entirely in client-side JavaScript that takes data from an untrusted **Source** (like the URL hash \`#admin\`) and writes it into a dangerous execution **Sink** (like \`innerHTML\`).

---

## Step 5: How Do We Defend Against XSS?

1. **Context-Aware HTML Entity Encoding**:
   * Instead of rendering \`<\`, convert it into the safe text code \`&lt;\`.
   * Instead of rendering \`>\`, convert it into \`&gt;\`.
   * The browser will safely display the character on screen as text, but will **NEVER** interpret it as an executable HTML tag!
2. **Hardened HTML Sanitization (DOMPurify)**:
   * If a website genuinely needs to allow rich text formatting (like bold or italics), pass the user input through **DOMPurify** before rendering.
3. **Cookie Protection (\`HttpOnly\`)**:
   * Flagging cookies with \`HttpOnly\` tells the browser: *"Do not allow JavaScript to read this cookie via document.cookie!"*
4. **Content Security Policy (CSP)**:
   * A security header that tells the browser: *"Only run scripts from my official server, and block all inline <script> tags!"*
`
  },
  {
    id: 'lab-1',
    title: 'Lab 1: Reflected XSS Walkthrough',
    type: 'lab',
    labUrl: '/vuln/xss-reflected',
    description: 'Exploit a reflected search query context to execute arbitrary JavaScript and exfiltrate your verification token.',
    walkthrough: `
# Lab 1 Walkthrough: Reflected XSS (Spoon-Fed Step-by-Step)

### Objective:
Exploit a search bar where user input is reflected raw into HTML, and execute JavaScript to report your unique verification token back to the academy.

---

### 1. How the Lab Simulation Works
In our academy, each student has a unique **Verification Token** (like \`1:xss-reflected:...\`).
When an XSS payload executes inside the vulnerable target application (which runs inside an \`<iframe>\`), the script must send an IPC message to the parent frame:

\`\`\`javascript
parent.postMessage({ type: 'xss-complete', token: 'YOUR_TOKEN_HERE' }, '*')
\`\`\`

When the parent academy frame receives this message from the sandboxed iframe, it knows your injected script ran successfully and awards you the completion badge!

---

### 2. Step-by-Step Instructions

1. Click the **Launch Interactive Lab Sandbox** button above.
2. In the new tab (\`http://localhost:5173/vuln/xss-reflected\`), look at the left-hand **Lab Panel**.
3. Locate the blue box labeled **Your Verification Token**.
4. Click the small **Copy** button to copy your token to your clipboard.
5. In the **Search Query** field, type or paste the following payload:
   \`\`\`html
   <script>parent.postMessage({ type: 'xss-complete', token: 'YOUR_TOKEN' }, '*')</script>
   \`\`\`
   *(Make sure to replace \`YOUR_TOKEN\` with the actual token you copied!)*
6. Click **Search**.
7. Observe what happens:
   * The backend takes your input and echoes it directly between \`<p>You searched for: <strong>...</strong></p>\`.
   * The browser parses the \`<script>\` tag and executes the JavaScript code inside the iframe.
   * The script dispatches the completion token to the portal.
   * A green banner pops up: **"Vulnerability Exploited! Lab 1 Solved!"**
8. Close the sandbox tab and return here to proceed to Module 2!
`
  },
  {
    id: 'lesson-2',
    title: '2. Stored (Persistent) XSS Deep-Dive',
    type: 'lesson',
    content: `
# Module 2: Stored (Persistent) Cross-Site Scripting

In Reflected XSS, the attacker has to convince the victim to click a suspicious link. 
**Stored XSS is far more terrifying**: The victim does nothing wrong except browse the normal website!

---

## The Famous Case Study: The Samy MySpace Worm (2005)

To understand the real-world danger of Stored XSS, look at the famous **Samy Worm**:
1. On MySpace, user profiles allowed custom formatting.
2. A hacker named Samy Kamkar found that he could hide JavaScript inside a CSS style tag on his public profile.
3. His script did three things automatically when anyone viewed his page:
   * It copied Samy's payload onto the **viewer's own profile**.
   * It added Samy as the viewer's friend.
   * It added the phrase *"but most of all, Samy is my hero"* to the victim's profile description.
4. **The result**: A viewer visited Samy's profile $\\rightarrow$ became infected $\\rightarrow$ their friends visited their profile $\\rightarrow$ they became infected.
5. In less than **20 hours**, over **1,000,000 user profiles** were infected, crashing MySpace servers and requiring an emergency shutdown!

---

## How Stored XSS Happens in Modern Apps

Stored XSS occurs in 3 phases:

\`\`\`
Phase 1: Ingestion
Attacker types into a Comment Box:  <img src=x onerror="alert(1)">
Server saves comment into PostgreSQL: INSERT INTO xss_comments (content) VALUES (...)

Phase 2: Persistence
The payload sits quietly in the database table for days, weeks, or years!

Phase 3: Detonation
A normal user visits:               GET /guestbook
Server loads comments:             SELECT * FROM xss_comments
Server concatenates raw HTML:      <div><img src=x onerror="alert(1)"></div>
The victim's browser executes the script automatically!
\`\`\`

---

## Why \`<img onerror=...>\` is Better than \`<script>\`

Beginners often wonder: *"Why do penetration testers use \`<img src=x onerror=...>\` instead of \`<script>\`?"*

Here is a browser secret:
* When browsers render an initial HTML document from scratch, \`<script>\` tags execute.
* However, when a Single Page Application (SPA like React, Vue, or dynamic AJAX) updates a \`<div>\` on the fly, modern browser standards **intentionally do NOT execute \`<script>\` tags inserted dynamically**!
* But browsers **ALWAYS** attempt to load image sources!
* If you insert \`<img src=x onerror="...">\`, the browser attempts to load the image at \`x\` (which does not exist). The image immediately fails to load, firing the \`onerror\` event handler **100% reliably**!
`
  },
  {
    id: 'lab-2',
    title: 'Lab 2: Stored XSS in Guestbook Comments Walkthrough',
    type: 'lab',
    labUrl: '/vuln/xss-stored',
    description: 'Inject a persistent script payload into the comment guestbook to execute code when the board is viewed.',
    walkthrough: `
# Lab 2 Walkthrough: Stored XSS

### Objective:
Post a comment containing an image-based XSS payload so that anyone viewing the guestbook executes your code.

---

### 1. Step-by-Step Instructions

1. Open \`/vuln/xss-stored\`.
2. Locate the **Verification Token** in the lab panel and copy it.
3. In the **New Comment** input field, enter:
   \`\`\`html
   <img src=x onerror="parent.postMessage({ type: 'xss-complete', token: 'YOUR_TOKEN' }, '*')">
   \`\`\`
   *(Replace \`YOUR_TOKEN\` with your copied token)*
4. Click **Post Comment**.
5. Observe what happens:
   * The backend executes an \`INSERT INTO xss_comments\` query in PostgreSQL.
   * The guestbook feed automatically re-renders.
   * The browser encounters the invalid image \`src=x\`, fails to load it, and triggers \`onerror\`.
   * The JavaScript runs and marks the lab **COMPLETED**!
`
  },
  {
    id: 'lesson-3',
    title: '3. DOM-Based XSS & Client-Side Execution Sinks',
    type: 'lesson',
    content: `
# Module 3: DOM-Based XSS & Dangerous Sinks

In Reflected and Stored XSS, the server was involved. 
In **DOM-based XSS**, the server is completely innocent! The vulnerability exists **100% inside client-side JavaScript running in your browser**.

---

## What is the DOM?

The **DOM** (**D**ocument **O**bject **M**odel) is the browser's internal tree representation of a webpage:

\`\`\`
          document
             │
          <html>
         ┌───┴───┐
      <head>   <body>
                 │
            <div id="greeting">
\`\`\`

JavaScript can interact with this tree:
* \`document.getElementById('greeting').textContent = "Hello!"\` (Safe!)
* \`document.getElementById('greeting').innerHTML = "<b>Hello!</b>"\` (Dangerous!)

---

## Sources vs. Sinks

To identify DOM XSS, you must trace data from a **Source** to a **Sink**:

### The Source (Where Untrusted Data Enters):
* \`window.location.hash\`: Everything after the \`#\` symbol in a URL (e.g., \`https://site.com/home#YOUR_INPUT\`). Notice that browsers **NEVER send the hash to the web server**! The server doesn't even know it exists!
* \`window.location.search\`: URL query parameters.
* \`document.referrer\`: The previous website the user came from.

### The Sink (Where the String Turns Into Executable Code):
* \`element.innerHTML\`: Parses whatever text you give it as raw HTML tags!
* \`document.write()\`: Writes raw HTML straight into the document.
* \`eval()\`: Compiles and executes raw strings as JavaScript commands.

If untrusted data flows from a **Source** into a **Sink** without validation, you have **DOM-based XSS**!
`
  },
  {
    id: 'lab-3',
    title: 'Lab 3: DOM-Based XSS via location.hash Walkthrough',
    type: 'lab',
    labUrl: '/vuln/xss-dom',
    description: 'Exploit a client-side location.hash sink using HTML injection in the URL hash.',
    walkthrough: `
# Lab 3 Walkthrough: DOM XSS

### Objective:
Exploit client-side JavaScript that takes \`window.location.hash\` and writes it into \`innerHTML\`.

---

### 1. Client-Side Code Inspection
Look at the script running inside the lab page:
\`\`\`javascript
const hash = window.location.hash;
if (hash) {
  const decoded = decodeURIComponent(hash.substring(1));
  document.getElementById('greeting').innerHTML = "Hello " + decoded + "!";
}
\`\`\`
Notice how \`decoded\` is concatenated directly into \`innerHTML\`!

---

### 2. Step-by-Step Instructions

1. Open \`/vuln/xss-dom\`.
2. Copy your **Verification Token**.
3. In the **URL Hash Payload** input field, enter:
   \`\`\`html
   <img src=x onerror="parent.postMessage({ type: 'xss-complete', token: 'YOUR_TOKEN' }, '*')">
   \`\`\`
4. Click **Update Hash & Trigger**.
5. The URL updates to \`.../lab3#<img src=x...>\`.
6. The \`hashchange\` event fires, client-side JavaScript assigns it to \`innerHTML\`, and the lab is solved!
`
  },
  {
    id: 'lesson-4',
    title: '4. Attribute Contexts & The javascript: Pseudo-Protocol',
    type: 'lesson',
    content: `
# Module 4: Context Matters — Attributes & javascript: Schemes

A vital rule in web penetration testing: **Your payload must adapt to where your input lands.**

---

## The HTML Attribute Context

Suppose user input lands inside a link:
\`\`\`html
<a href="[USER INPUT]">Visit My Website</a>
\`\`\`

If you type \`<script>alert(1)</script>\`, what happens?
\`\`\`html
<a href="<script>alert(1)</script>">Visit My Website</a>
\`\`\`
The browser thinks \`<script>\` is just the filename of the URL! It will **NOT** execute!

---

## The Secret Weapon: The \`javascript:\` Pseudo-Protocol

Did you know that in HTML, any attribute that accepts a URL (\`href\`, \`src\`, \`action\`) can execute JavaScript if you prefix it with \`javascript:\`?

Try this concept:
\`\`\`html
<a href="javascript:alert('Hacked!')">Click Me</a>
\`\`\`
When a user clicks that link, instead of navigating to a webpage, **their browser executes the JavaScript immediately!**

This is how attackers exploit website profile links, social media URL inputs, and redirect parameters!
`
  },
  {
    id: 'lab-4',
    title: 'Lab 4: Attribute Context & Javascript URI Walkthrough',
    type: 'lab',
    labUrl: '/vuln/xss-attribute',
    description: 'Break out of an HTML attribute boundary or use javascript URI context to execute JavaScript.',
    walkthrough: `
# Lab 4 Walkthrough: Attribute Context Injection

### Objective:
Inject a \`javascript:\` pseudo-protocol payload into a profile website link.

---

### 1. Step-by-Step Instructions

1. Open \`/vuln/xss-attribute\`.
2. Copy your **Verification Token**.
3. In the **Website Link** input, enter:
   \`\`\`text
   javascript:parent.postMessage({ type: 'xss-complete', token: 'YOUR_TOKEN' }, '*')
   \`\`\`
4. In the Bio field, enter any text (e.g., \`Security Student\`).
5. Click **Save Profile**.
6. On the right-side profile preview, notice the **Visit website** button.
7. Click **Visit website**!
8. The browser executes the link as code, sends the verification token, and solves the lab!
`
  },
  {
    id: 'lesson-5',
    title: '5. Filter Evasion & Blacklist Bypass Mechanics',
    type: 'lesson',
    content: `
# Module 5: Blacklist Filter Bypasses

Many developers who don't understand security try to solve XSS with naive word filters:
\`\`\`javascript
// "I will just remove any <script> tags!"
const cleanText = userInput.replace(/<script>/gi, '');
\`\`\`

Why does this fail every single time?

---

## The 60+ HTML Execution Tags

JavaScript can execute through dozens of tags that have nothing to do with \`<script>\`:
* \`<img src=x onerror=...>\`
* \`<svg onload=...>\`
* \`<body onload=...>\`
* \`<iframe src="javascript:...">\`
* \`<video><source onerror=...></video>\`
* \`<input autofocus onfocus=...>\`
* \`<details open ontoggle=...>\`

If a filter only looks for \`<script>\`, using any other tag bypasses the filter effortlessly!
`
  },
  {
    id: 'lab-5',
    title: 'Lab 5: Blacklist Filter Bypass Walkthrough',
    type: 'lab',
    labUrl: '/vuln/xss-blacklist',
    description: 'Bypass a naive script-stripping blacklist using alternative HTML execution tags.',
    walkthrough: `
# Lab 5 Walkthrough: Blacklist Filter Bypass

### Objective:
Bypass a backend filter that strips \`<script>\` tags by using an \`<img>\` tag.

---

### 1. Step-by-Step Instructions

1. Open \`/vuln/xss-blacklist\`.
2. Copy your **Verification Token**.
3. Enter the following image payload into the search input:
   \`\`\`html
   <img src=x onerror="parent.postMessage({ type: 'xss-complete', token: 'YOUR_TOKEN' }, '*')">
   \`\`\`
4. Click **Search & Bypass Filter**.
5. The backend regex ignores the image tag because it does not contain \`<script>\`. The HTML renders raw, executes, and completes the lab!
`
  },
  {
    id: 'lesson-6',
    title: '6. REST API JSON Injections & Modern Web SPAs',
    type: 'lesson',
    content: `
# Module 6: REST API & JSON Payloads

Modern web frameworks (React, Angular, Vue) talk to backend servers via JSON REST APIs.

---

## The Risk: Blind API Ingestion

An API endpoint like \`POST /api/logs\` accepts:
\`\`\`json
{
  "message": "User failed login attempt"
}
\`\`\`

If an attacker submits:
\`\`\`json
{
  "message": "<img src=x onerror=...>"
}
\`\`\`

The API server might save it without complaint. When the **System Administrator** opens their Audit Log Console to see why logins are failing, the admin console renders the log message as HTML, and the attacker's script executes inside the Administrator's session!
`
  },
  {
    id: 'lab-6',
    title: 'Lab 6: REST API XSS Walkthrough',
    type: 'lab',
    labUrl: '/vuln/xss-api',
    description: 'Send a malicious JSON payload via a REST API client that renders unsafely on an admin audit dashboard.',
    walkthrough: `
# Lab 6 Walkthrough: REST API XSS

### Objective:
Send an XSS payload inside an API JSON request body to trigger execution when rendered in the Admin Audit Log.

---

### 1. Step-by-Step Instructions

1. Open \`/vuln/xss-api\`.
2. Copy your **Verification Token**.
3. In the **JSON Message Body** textarea, enter:
   \`\`\`html
   <img src=x onerror="parent.postMessage({ type: 'xss-complete', token: 'YOUR_TOKEN' }, '*')">
   \`\`\`
4. Click **Submit API Log Entry**.
5. The REST API saves the record, the Admin Audit Log refreshes, executes the payload, and marks the lab **COMPLETED**!
`
  },
  {
    id: 'lesson-7',
    title: '7. Header-Based XSS & Telemetry Logging',
    type: 'lesson',
    content: `
# Module 7: Header-Based XSS

Did you know that HTTP headers are completely untrusted user input?

Every HTTP request includes headers like:
* \`User-Agent\`: Identifies browser/OS.
* \`X-Forwarded-For\`: Client IP address.
* Custom headers like \`X-User-Metadata\`.

If a developer echoes headers into a dashboard or telemetry tool without HTML entity encoding, an attacker can inject XSS simply by altering their HTTP request headers!
`
  },
  {
    id: 'lab-7',
    title: 'Lab 7: Header-Based XSS Walkthrough',
    type: 'lab',
    labUrl: '/vuln/xss-header',
    description: 'Inject XSS payloads inside custom HTTP request headers that the server logs and echoes.',
    walkthrough: `
# Lab 7 Walkthrough: Header-Based XSS

### Objective:
Send an XSS payload inside the \`X-User-Metadata\` HTTP header.

---

### 1. Step-by-Step Instructions

1. Open \`/vuln/xss-header\`.
2. Copy your **Verification Token**.
3. In the **Custom Header Value** field, enter:
   \`\`\`html
   <img src=x onerror="parent.postMessage({ type: 'xss-complete', token: 'YOUR_TOKEN' }, '*')">
   \`\`\`
4. Click **Transmit Telemetry Packet**.
5. The client issues a fetch request containing the header, the telemetry server reflects it unescaped, and the lab is solved!
`
  },
  {
    id: 'lesson-8',
    title: '8. Content Security Policy (CSP) & Bypass Vectors',
    type: 'lesson',
    content: `
# Module 8: Content Security Policy (CSP)

**Content Security Policy (CSP)** is an HTTP response header that tells the browser what scripts are allowed to run.

---

## The Fatal Mistake: \`'unsafe-inline'\`

If a website uses:
\`\`\`http
Content-Security-Policy: script-src 'self' 'unsafe-inline';
\`\`\`
The directive \`'unsafe-inline'\` **completely disables protection against inline scripts!** Any injected \`<script>\` tag will run without resistance!
`
  },
  {
    id: 'lab-8',
    title: 'Lab 8: CSP Bypass Challenge Walkthrough',
    type: 'lab',
    labUrl: '/vuln/xss-csp',
    description: 'Bypass a weak Content Security Policy (CSP) header allowing inline scripts.',
    walkthrough: `
# Lab 8 Walkthrough: CSP Bypass

### Objective:
Exploit a page protected by a weak CSP containing \`'unsafe-inline'\`.

---

### 1. Step-by-Step Instructions

1. Open \`/vuln/xss-csp\`.
2. Copy your **Verification Token**.
3. In the payload field, paste:
   \`\`\`html
   <script>parent.postMessage({ type: 'xss-complete', token: 'YOUR_TOKEN' }, '*')</script>
   \`\`\`
4. Click **Inject under CSP**.
5. The browser checks the policy, permits the inline script, and marks the lab **COMPLETED**!
`
  },
  {
    id: 'lesson-9',
    title: '9. Markdown & Rich-Text Parser Injection',
    type: 'lesson',
    content: `
# Module 9: Markdown Parser Quirks

Markdown (used on GitHub, Reddit, Slack) is popular for user formatting.

However, according to the official Markdown specification: **Raw HTML tags are considered valid Markdown!**

If an application uses a custom markdown parser that converts \`**bold**\` into \`<strong>bold</strong>\`, but fails to escape HTML tags, an attacker can embed HTML payloads directly inside their Markdown bio!
`
  },
  {
    id: 'lab-9',
    title: 'Lab 9: Markdown Parser HTML Injection Walkthrough',
    type: 'lab',
    labUrl: '/vuln/xss-markdown',
    description: 'Exploit a Markdown compiler that fails to escape raw HTML tags during translation.',
    walkthrough: `
# Lab 9 Walkthrough: Markdown Parser XSS

### Objective:
Embed an HTML payload inside a user profile Markdown bio.

---

### 1. Step-by-Step Instructions

1. Open \`/vuln/xss-markdown\`.
2. Copy your **Verification Token**.
3. In the **Bio Markdown** textarea, enter:
   \`\`\`markdown
   ## Security Bio
   **Ethical Hacker**
   <img src=x onerror="parent.postMessage({ type: 'xss-complete', token: 'YOUR_TOKEN' }, '*')">
   \`\`\`
4. Click **Save Markdown Bio**.
5. The view renders the bio, fires the image error handler, and completes the lab!
`
  },
  {
    id: 'lesson-10',
    title: '10. Second-Order Stored XSS Architecture',
    type: 'lesson',
    content: `
# Module 10: Second-Order XSS

**Second-Order XSS** is the ultimate multi-stage attack:
1. **Stage 1**: The payload is stored safely using parameterized queries in a customer support ticket.
2. **Stage 2**: Days later, a high-privilege **System Administrator** opens their internal ticket console. The admin view renders the ticket content without sanitization!

The attacker successfully compromises an administrative session from a normal user account!
`
  },
  {
    id: 'lab-10',
    title: 'Lab 10: Second-Order Stored XSS Walkthrough',
    type: 'lab',
    labUrl: '/vuln/xss-second-order',
    description: 'Perform a multi-stage XSS attack by storing your payload safely in a support ticket and triggering it in the admin queue view.',
    walkthrough: `
# Lab 10 Walkthrough: Second-Order XSS

### Objective:
Submit a support ticket with an XSS payload to compromise the Administrator Ticket Console.

---

### 1. Step-by-Step Instructions

1. Open \`/vuln/xss-second-order\`.
2. Copy your **Verification Token**.
3. Set **Ticket Subject** to: \`System Performance Inquiry\`.
4. In **Ticket Content**, enter:
   \`\`\`html
   <img src=x onerror="parent.postMessage({ type: 'xss-complete', token: 'YOUR_TOKEN' }, '*')">
   \`\`\`
5. Click **Submit Support Ticket**.
6. Look at the **Admin Ticket Console** preview. As soon as it renders the ticket list, your script executes in the admin context, solving the final XSS challenge!
`
  },
  {
    id: 'quiz-1',
    title: 'Cross-Site Scripting Mastery Certification Exam',
    type: 'quiz',
    quiz: [
      {
        question: 'Which of the following is the most effective primary defense against Cross-Site Scripting?',
        options: [
          'Using a Web Application Firewall (WAF)',
          'Context-aware output encoding & sanitization with tools like DOMPurify',
          'Filtering out the word "<script>" with regular expressions',
          'Restricting input lengths to 50 characters'
        ],
        correct: 1
      },
      {
        question: 'What differentiates DOM-based XSS from Reflected and Stored XSS?',
        options: [
          'DOM XSS only works in Google Chrome',
          'DOM XSS requires a PostgreSQL database',
          'DOM XSS occurs entirely within client-side JavaScript without requiring server reflection',
          'DOM XSS cannot steal cookies'
        ],
        correct: 2
      },
      {
        question: 'Why does adding "script-src \'self\' \'unsafe-inline\'" to a Content Security Policy undermine its protection?',
        options: [
          'It allows inline <script> tags and event handlers to execute, bypassing XSS mitigation',
          'It disables HTTPS encryption',
          'It causes all images to fail loading',
          'It forces browsers to execute scripts in quirks mode'
        ],
        correct: 0
      },
      {
        question: 'How does setting the "HttpOnly" flag on cookies mitigate the impact of an XSS vulnerability?',
        options: [
          'It prevents the browser from making any HTTP requests',
          'It completely stops JavaScript from executing on the page',
          'It prevents client-side scripts from reading the cookie via document.cookie',
          'It encrypts the entire database'
        ],
        correct: 2
      },
      {
        question: 'In which context would a payload like "javascript:alert(1)" successfully execute without any angle brackets (< or >)?',
        options: [
          'Inside an HTML body text paragraph: <p>...</p>',
          'Inside an anchor tag URL attribute: <a href="...">',
          'Inside an HTML comment: <!-- ... -->',
          'Inside a CSS stylesheet block: <style>...</style>'
        ],
        correct: 1
      }
    ]
  }
];

export default function XSSCourseView(): JSX.Element {
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
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base tracking-tight">XSS Mastery Track</h2>
              <p className="text-xs text-slate-400">Client-Side Script Injection</p>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex justify-between text-xs font-semibold mb-2">
              <span className="text-slate-400">Course Progress</span>
              <span className="text-violet-400">{progressPercent}%</span>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 transition-all duration-500" 
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
                    ? 'bg-violet-600/15 border border-violet-500/30 text-white shadow-lg shadow-violet-500/5'
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
                  <FlaskConical className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-violet-400' : 'text-slate-500'}`} />
                ) : m.type === 'quiz' ? (
                  <LayoutGrid className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-violet-400' : 'text-slate-500'}`} />
                ) : (
                  <BookOpen className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-violet-400' : 'text-slate-500'}`} />
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
              <span className="text-xs font-mono font-bold text-violet-400 bg-violet-500/10 px-3 py-1 rounded-full border border-violet-500/20">
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
            <div className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-slate-300 prose-code:text-violet-300 prose-pre:bg-[#12121A] prose-pre:border prose-pre:border-white/10 prose-strong:text-white leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {activeModule.content || ''}
              </ReactMarkdown>
              
              <div className="mt-10 pt-6 border-t border-white/5 flex justify-end">
                <button
                  onClick={markLessonCompleteAndNext}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold transition-all shadow-lg shadow-violet-600/20"
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
                    className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold transition-all shadow-xl shadow-violet-600/20 hover:-translate-y-0.5"
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
                <div className="rounded-2xl border border-violet-500/20 bg-[#12121A]/80 p-8 prose prose-invert max-w-none prose-headings:text-white prose-p:text-slate-300 prose-code:text-violet-300 prose-pre:bg-[#0A0A0F] prose-pre:border prose-pre:border-white/10 animate-in fade-in duration-300">
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
                <h3 className="text-xl font-bold text-white">XSS Certification Assessment</h3>
                
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
                            optClass = "border-violet-500/50 bg-violet-500/20 text-white font-semibold";
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
                      className="px-8 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold transition-all shadow-lg shadow-violet-600/20"
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
