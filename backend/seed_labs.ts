import { prisma } from './src/db';

const ALL_LABS = [
  // SQL Injection Labs
  {
    slug: 'sqli-01',
    title: 'SQLi Lab 1: Authentication Bypass',
    description: 'Bypass standard database login verification using classical Boolean tautologies.'
  },
  {
    slug: 'sqli-02',
    title: 'SQLi Lab 2: UNION-Based Product Exfiltration',
    description: 'Use UNION SELECT operators to extract credentials from hidden database tables.'
  },
  {
    slug: 'sqli-03',
    title: 'SQLi Lab 3: WAF / Case-Sensitivity Filter Bypass',
    description: 'Bypass a naive blacklist filtering out uppercase UNION and SELECT keywords.'
  },
  {
    slug: 'sqli-04',
    title: 'SQLi Lab 4: Numeric Context Blind/Numeric Injection',
    description: 'Exploit an unquoted integer parameter in the WHERE clause.'
  },
  {
    slug: 'sqli-05',
    title: 'SQLi Lab 5: Numeric Range Parameter Bypass',
    description: 'Inject SQL fragments into a numeric max-price query filter.'
  },
  {
    slug: 'sqli-06',
    title: 'SQLi Lab 6: REST API JSON Injection',
    description: 'Bypass client-side regex filters by posting malicious JSON payloads directly via API fetch.'
  },
  {
    slug: 'sqli-07',
    title: 'SQLi Lab 7: Cookie-Based Tracking ID Injection',
    description: 'Inject SQL syntax through persistent session and tracking cookies.'
  },
  {
    slug: 'sqli-08',
    title: 'SQLi Lab 8: Time-Based Blind SQLi',
    description: 'Infer database presence by inducing artificial latency delays via pg_sleep.'
  },
  {
    slug: 'sqli-09',
    title: 'SQLi Lab 9: Header-Based Blind SQLi',
    description: 'Exfiltrate data by injecting SQL syntax through HTTP request headers.'
  },
  {
    slug: 'sqli-10',
    title: 'SQLi Lab 10: Second-Order SQL Injection',
    description: 'Store unescaped malicious inputs safely; trigger execution on profile view.'
  },

  // Cross-Site Scripting Labs
  {
    slug: 'xss-reflected',
    title: 'XSS Lab 1: Reflected XSS',
    description: 'Exploit a reflected search query context to execute arbitrary JavaScript and exfiltrate solve tokens.'
  },
  {
    slug: 'xss-stored',
    title: 'XSS Lab 2: Stored XSS',
    description: 'Inject a persistent script payload into the comment guestbook to execute code when viewed.'
  },
  {
    slug: 'xss-dom',
    title: 'XSS Lab 3: DOM-Based XSS',
    description: 'Exploit a client-side location.hash sink using HTML injection in the URL fragment.'
  },
  {
    slug: 'xss-attribute',
    title: 'XSS Lab 4: Attribute Context',
    description: 'Break out of an HTML attribute boundary or use javascript URI context to execute JavaScript.'
  },
  {
    slug: 'xss-blacklist',
    title: 'XSS Lab 5: Blacklist Filter Bypass',
    description: 'Bypass naive script-tag stripping regex using alternative HTML execution tags.'
  },
  {
    slug: 'xss-api',
    title: 'XSS Lab 6: REST API XSS',
    description: 'Send a malicious JSON payload via REST API rendered unsafely on an admin audit dashboard.'
  },
  {
    slug: 'xss-header',
    title: 'XSS Lab 7: Header-Based XSS',
    description: 'Inject XSS payloads inside custom HTTP request headers that the server logs and echoes.'
  },
  {
    slug: 'xss-csp',
    title: 'XSS Lab 8: CSP Bypass Challenge',
    description: 'Bypass a weak Content Security Policy allowing unsafe-inline scripts.'
  },
  {
    slug: 'xss-markdown',
    title: 'XSS Lab 9: Markdown Rich-Text Injection',
    description: 'Exploit a Markdown compiler that fails to escape raw HTML tags during translation.'
  },
  {
    slug: 'xss-second-order',
    title: 'XSS Lab 10: Second-Order Stored XSS',
    description: 'Multi-stage XSS stored safely in support tickets and triggered unsafely in admin queue.'
  },
  {
    slug: 'chained-final-exam',
    title: 'Master Capstone: Operation Titan Breach',
    description: 'Chained exploitation: SQLi reconnaissance and exfiltration paired with Stored XSS execution against the SOC Auditor.'
  }
];

async function seedAllLabs() {
  console.log('Seeding / Upserting all 20 Labs (10 SQLi + 10 XSS)...');
  for (const lab of ALL_LABS) {
    await prisma.lab.upsert({
      where: { slug: lab.slug },
      update: {
        title: lab.title,
        description: lab.description
      },
      create: {
        slug: lab.slug,
        title: lab.title,
        description: lab.description
      }
    });
    console.log(`  ✓ ${lab.slug} -> ${lab.title}`);
  }
  console.log('All 20 labs verified in database!');
  process.exit(0);
}

seedAllLabs().catch((err) => {
  console.error('Failed to seed labs:', err);
  process.exit(1);
});
