const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE        = 'http://localhost:3000';
const SUPABASE_URL= 'https://ycyxmvzilzkusecpgvbi.supabase.co';
const ANON_KEY    = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljeXhtdnppbHprdXNlY3BndmJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxODQwNjksImV4cCI6MjA5MTc2MDA2OX0.as76sOhSW3Mgj2lWHoLantQUSHvWJA2nZmMn70YnJCY';
const PROJECT_REF = 'ycyxmvzilzkusecpgvbi';
const OUT  = path.resolve(__dirname);

const ROUTES = [
  '/',
  '/browse',
  '/map',
  '/events',
  '/chat',
  '/modes',
  '/modes/solo-diner',
  '/profile',
  '/settings',
  '/progress',
  '/safety',
  '/plans',
  '/signup-quick',
  '/login',
  '/squad',
];

function slug(route) {
  return route === '/' ? 'home' : route.replace(/\//g, '-').replace(/^-/, '');
}

async function getSession() {
  const https = require('https');
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ email: 'zoe.martin@cesoir.app', password: 'CeSoir2026!' });
    const req = https.request({
      hostname: 'ycyxmvzilzkusecpgvbi.supabase.co',
      path: '/auth/v1/token?grant_type=password',
      method: 'POST',
      headers: {
        'apikey': ANON_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

(async () => {
  // 1. Obtain real Supabase session
  console.log('Logging in as zoe.martin@cesoir.app ...');
  const session = await getSession();
  if (!session.access_token) {
    console.error('Login failed:', session);
    process.exit(1);
  }
  console.log('Session OK, user_id:', session.user.id);

  // 2. Build cookie value — @supabase/ssr stores the whole session as JSON
  //    under the key sb-<ref>-auth-token (chunked if > 3600 chars, but for
  //    injection we set the raw cookie directly).
  const cookieName  = `sb-${PROJECT_REF}-auth-token`;
  const cookieValue = JSON.stringify({
    access_token:  session.access_token,
    token_type:    'bearer',
    expires_in:    session.expires_in,
    expires_at:    session.expires_at,
    refresh_token: session.refresh_token,
    user:          session.user,
  });

  // 3. Launch browser and inject cookie before any navigation
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
  });

  // Inject the auth cookie for localhost:3000
  await ctx.addCookies([{
    name:    cookieName,
    value:   cookieValue,
    domain:  'localhost',
    path:    '/',
    httpOnly: false,
    secure:  false,
    sameSite: 'Lax',
  }]);

  // 4. Screenshot each route
  for (const route of ROUTES) {
    const page = await ctx.newPage();
    const url = `${BASE}${route}`;
    const filename = `visual-${slug(route)}.png`;
    const outPath = path.join(OUT, filename);
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1800);
      const finalUrl = page.url();
      await page.screenshot({ path: outPath, fullPage: true });
      const redirected = !finalUrl.includes(route === '/' ? 'localhost:3000/' : route);
      console.log(`${redirected ? 'REDIR' : 'OK '} ${route} → ${filename}  [${finalUrl}]`);
    } catch (err) {
      console.error(`ERR ${route}: ${err.message}`);
    }
    await page.close();
  }

  await browser.close();
})();
