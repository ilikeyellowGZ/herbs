import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const base = process.env.QA_URL || 'http://localhost:4185';
const browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : 'chrome', headless: true });
await mkdir('artifacts/shopping', { recursive: true });
try {
  for (const width of [375, 768, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    await context.addInitScript(() => localStorage.setItem('herby-health-cart-v1', JSON.stringify([{ slug: 'hibiscus', quantity: 2 }])));
    const page = await context.newPage();
    await page.goto(base + '/checkout', { waitUntil: 'networkidle' });
    const back = page.getByRole('link', { name: 'Continue exploring', exact: true });
    await back.waitFor();
    await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
    const bounds = await back.boundingBox();
    const masthead = await page.locator('.site-header').boundingBox();
    assert.ok(bounds.y >= masthead.y + masthead.height, `Checkout back link is covered by the header at ${width}px`);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow at ${width}px`);
    await page.screenshot({ path: `artifacts/shopping/checkout-final-${width}.png`, fullPage: true });
    await context.close();
    console.log(`${width}px: checkout starts below the masthead, back link is visible, and no horizontal overflow.`);
  }
} finally { await browser.close(); }
