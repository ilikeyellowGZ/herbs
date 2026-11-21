import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.env.CF_QA_URL || 'http://localhost:8787';
const live = new URL(base).protocol === 'https:';
let email = 'cloudflare-test@example.com', password = 'cloudflare-local-test-password-123';
if (live) {
  const login = await readFile('.local/cloudflare-owner-login.txt', 'utf8');
  email = /^Email: (.+)$/m.exec(login)[1]; password = /^Password: (.+)$/m.exec(login)[1];
}
const browser = await chromium.launch({ channel: process.env.QA_BROWSER || 'msedge', headless: true });
const errors = [];
await mkdir('artifacts/cloudflare', { recursive: true });
try {
  for (const width of [375, 768, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.locator('.site-loader').waitFor({ state: 'detached' });
    await page.getByRole('heading', { level: 1 }).waitFor();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Home fits ${width}px`);
    await page.screenshot({ path: `artifacts/cloudflare/${live ? 'live' : 'local'}-home-${width}.png` });
    await page.goto(base + '/collection', { waitUntil: 'networkidle' });
    await page.locator('.site-loader').waitFor({ state: 'detached' });
    assert.equal(await page.locator('.catalogue-card').count(), 8);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Collection fits ${width}px`);
    await page.goto(base + '/admin/orders', { waitUntil: 'networkidle' });
    await page.getByLabel('Email address', { exact: true }).fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Sign in to your workspace', exact: true }).click();
    await page.getByRole('heading', { name: 'Good things, on their way.', exact: true }).waitFor();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Admin fits ${width}px`);
    await page.screenshot({ path: `artifacts/cloudflare/${live ? 'live' : 'local'}-admin-${width}.png` });
    const cookies = await context.cookies();
    const session = cookies.find(cookie => cookie.name === 'hh_session');
    assert.equal(session.httpOnly, true); if (live) assert.equal(session.secure, true);
    await context.close();
    console.log(`PASS ${live ? 'public' : 'local'} storefront, collection and owner dashboard at ${width}px`);
  }
  assert.deepEqual(errors, [], 'No browser console or hydration errors');
} finally { await browser.close(); }
