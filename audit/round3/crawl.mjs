import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const BASE = 'http://localhost:3000';
const START = '/profile';

// All static routes from code (dynamic params replaced with placeholders)
const STATIC_ROUTES = [
  '/',
  '/profile',
  '/profile/edit',
  '/profile/delete',
  '/profile/verify',
  '/profile/notifications',
  '/profile/privacy',
  '/profile/invites',
  '/profile/share',
  '/discover',
  '/feed',
  '/browse',
  '/modes',
  '/matches',
  '/chat',
  '/notifications',
  '/settings',
  '/plans',
  '/plans/create',
  '/shop',
  '/premium',
  '/events',
  '/rooms',
  '/squad',
  '/trending',
  '/progress',
  '/speed-dating',
  '/map',
  '/welcome',
  '/why-free',
  '/manifesto',
  '/about',
  '/help',
  '/safety',
  '/cgu',
  '/privacy',
  '/legal/dpia',
  '/invites/mine',
  '/admin/finance',
  '/offline',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/onboarding',
  '/signup-quick',
  '/venues/dashboard',
];

const results = [];
const visited = new Set();
const queue = [START];
const depthMap = { [START]: 0 };

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: 'SaaS-Patrol-Bot/1.0',
    storageState: undefined,
  });
  const page = await ctx.newPage();

  // Helper: visit a URL and collect data
  async function visit(path, depth) {
    if (visited.has(path)) return;
    visited.add(path);

    const url = BASE + path;
    let status = 0;
    let title = '';
    let links = [];
    let redirectedTo = null;
    let isProtected = false;

    try {
      const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      status = resp?.status() ?? 0;

      // Detect redirect to login
      const finalUrl = page.url();
      if (finalUrl !== url && finalUrl.includes('/login')) {
        isProtected = true;
        redirectedTo = finalUrl.replace(BASE, '');
      } else if (finalUrl !== url) {
        redirectedTo = finalUrl.replace(BASE, '');
      }

      await page.waitForTimeout(800);
      title = await page.title().catch(() => '');

      // Extract internal links
      links = await page.evaluate((base) => {
        return Array.from(document.querySelectorAll('a[href]'))
          .map(a => {
            try {
              const u = new URL(a.href, window.location.origin);
              if (u.origin !== window.location.origin) return null;
              const p = u.pathname;
              if (p.startsWith('/_next') || p.startsWith('/api')) return null;
              if (u.hash && !u.pathname) return null;
              return p;
            } catch { return null; }
          })
          .filter(Boolean)
          .filter((v, i, a) => a.indexOf(v) === i);
      }, BASE);

    } catch (e) {
      status = e.message.includes('404') ? 404 : 0;
      title = 'ERROR: ' + e.message.slice(0, 60);
    }

    results.push({ path, depth, status, title, redirectedTo, isProtected, links });

    // Enqueue discovered links
    for (const link of links) {
      if (!visited.has(link) && !queue.includes(link) && depth < 3) {
        // Skip dynamic-looking paths with real IDs (UUIDs etc)
        if (/\/[0-9a-f-]{8,}/.test(link)) continue;
        queue.push(link);
        depthMap[link] = depth + 1;
      }
    }
  }

  // First: visit all static routes (depth 0 for known, depth 1 for auth routes)
  const staticDepths = {
    '/profile': 0,
    '/discover': 1, '/feed': 1, '/browse': 1, '/modes': 1, '/matches': 1,
    '/chat': 1, '/notifications': 1, '/settings': 1,
  };

  for (const route of STATIC_ROUTES) {
    if (!visited.has(route)) {
      queue.push(route);
      depthMap[route] = staticDepths[route] ?? 2;
    }
  }

  // Process queue
  while (queue.length > 0) {
    const path = queue.shift();
    const depth = depthMap[path] ?? 3;
    await visit(path, depth);
    await new Promise(r => setTimeout(r, 300)); // rate limit
  }

  await browser.close();

  // Build report
  const sorted = results.sort((a, b) => a.depth - b.depth || a.path.localeCompare(b.path));

  // Detect dead links
  const deadLinks = [];
  for (const r of results) {
    for (const link of r.links) {
      const target = results.find(x => x.path === link);
      if (!target) continue;
      if (target.status === 404 || target.status === 0) {
        deadLinks.push({ from: r.path, to: link, status: target.status });
      }
    }
  }

  // Detected routes from crawl
  const crawledPaths = new Set(results.map(r => r.path));

  // Orphan routes (in code but not found via UI crawl links)
  const orphans = STATIC_ROUTES.filter(r => {
    if (!crawledPaths.has(r)) return false; // wasn't even visited
    const result = results.find(x => x.path === r);
    // Orphan = no page links to it from UI
    const referencedByUI = results.some(x => x.links.includes(r) && x.path !== r);
    return !referencedByUI;
  });

  // BottomNav paths (common for dating apps)
  const bottomNavPaths = ['/discover', '/matches', '/chat', '/profile', '/feed', '/modes', '/browse'];

  // Build markdown
  let md = `# CeSoir Site Audit — Round 3\n\n`;
  md += `Crawled: ${new Date().toISOString()}\n\n`;

  md += `## Sitemap (${sorted.length} routes)\n\n`;
  md += `| Path | Status | Title | Depth | Protected | Notes |\n`;
  md += `|------|--------|-------|-------|-----------|-------|\n`;
  for (const r of sorted) {
    const nav = bottomNavPaths.includes(r.path) ? 'BottomNav' : '';
    const redirect = r.redirectedTo ? `→ ${r.redirectedTo}` : '';
    const note = [nav, redirect].filter(Boolean).join(' ');
    const statusStr = r.status === 0 ? 'ERR' : String(r.status);
    md += `| ${r.path} | ${statusStr} | ${r.title.slice(0, 50)} | ${r.depth} | ${r.isProtected ? 'yes' : ''} | ${note} |\n`;
  }

  md += `\n## Dead links found\n\n`;
  if (deadLinks.length === 0) {
    md += `None detected.\n`;
  } else {
    for (const d of deadLinks) {
      md += `- \`${d.to}\` — referenced from \`${d.from}\` — ${d.status || 'ERR'}\n`;
    }
  }

  md += `\n## Orphan routes (in code, not linked from UI)\n\n`;
  for (const o of orphans) {
    md += `- \`${o}\`\n`;
  }

  md += `\n## All links per page\n\n`;
  for (const r of sorted) {
    if (r.links.length > 0) {
      md += `### ${r.path}\n`;
      for (const l of r.links) md += `- ${l}\n`;
      md += '\n';
    }
  }

  writeFileSync('audit/round3/sitemap.md', md, 'utf8');
  writeFileSync('audit/round3/results.json', JSON.stringify(sorted, null, 2), 'utf8');

  console.log('DONE');
  console.log('Routes visited:', sorted.length);
  console.log('Dead links:', deadLinks.length);
  console.log('Orphans:', orphans.length);

  // Print summary for assistant
  for (const r of sorted) {
    const flag = r.status === 404 ? ' [404]' : r.isProtected ? ' [AUTH]' : '';
    console.log(`${r.status}  d${r.depth}  ${r.path}${flag}  "${r.title.slice(0,40)}"`);
  }

  console.log('\nDEAD:');
  for (const d of deadLinks) console.log(` ${d.from} -> ${d.to} (${d.status})`);
  console.log('\nORPHANS:');
  for (const o of orphans) console.log(` ${o}`);
}

run().catch(e => { console.error(e); process.exit(1); });
