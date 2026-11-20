import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const base = process.env.QA_URL || 'http://localhost:4173';
const browser = await chromium.launch({ channel: process.env.QA_BROWSER || 'msedge', headless: true });
const errors = [];
await mkdir('artifacts/loader', { recursive: true });

try {
  for (const width of [375, 768, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    page.on('pageerror', error => errors.push(error.message));
    // A genuinely pending eager image must keep the intro up after its entrance.
    await page.route('**/images/herby-health/heroes/garden-aerial-*', async route => {
      await new Promise(resolve => setTimeout(resolve, 2400));
      await route.continue();
    });
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    const loader = page.locator('.site-loader');
    await loader.waitFor({ state: 'visible', timeout: 3000 });
    assert.equal(await loader.locator('svg').count(), 1, 'Original emblem is present');
    assert.equal(await loader.locator('.loading-screen__dot').count(), 3);
    await page.waitForFunction(() => document.getElementById('site-content')?.inert === true);
    await page.waitForTimeout(850);
    assert.equal(await loader.locator('.loading-screen__wordmark').textContent(), 'Herby Health');
    assert.ok(await loader.evaluate(el => el.getBoundingClientRect().width <= innerWidth));
    await page.screenshot({ path: `artifacts/loader/loading-${width}.png` });
    await page.waitForTimeout(800);
    assert.equal(await loader.count(), 1, 'Intro remains while the eager image is pending');
    await loader.waitFor({ state: 'detached', timeout: 7000 });
    assert.equal(await page.locator('#site-content').evaluate(el => el.inert), false);
    assert.notEqual(await page.evaluate(() => document.body.style.overflow), 'hidden');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('href')), '#main');
    await page.screenshot({ path: `artifacts/loader/ready-${width}.png` });
    await page.getByRole('link', { name: 'The collection', exact: true }).first().click();
    await page.waitForURL('**/collection');
    await page.getByRole('heading', { level: 1 }).waitFor();
    assert.equal(await loader.count(), 0, 'Internal navigation never replays the intro');
    await page.close();
    console.log(`PASS initial loading, readiness, keyboard, navigation and layout at ${width}px`);
  }

  const reducedContext = await browser.newContext({ reducedMotion: 'reduce' });
  const reduced = await reducedContext.newPage();
  reduced.on('pageerror', error => errors.push(error.message));
  await reduced.goto(`${base}/faqs`, { waitUntil: 'domcontentloaded' });
  await reduced.locator('.site-loader').waitFor({ state: 'detached', timeout: 2500 });
  await reduced.getByRole('heading', { level: 1 }).waitFor();
  const accessibility = await new AxeBuilder({ page: reduced }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  assert.deepEqual(accessibility.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })), []);
  await reducedContext.close();
  console.log('PASS reduced-motion direct route and accessibility');

  const noJs = await browser.newPage({ javaScriptEnabled: false });
  await noJs.goto(base);
  await noJs.getByRole('heading', { level: 1 }).waitFor();
  assert.equal(await noJs.locator('.site-loader').isVisible(), false);
  assert.equal(await noJs.locator('#site-content').getAttribute('inert'), null);
  await noJs.close();
  console.log('PASS prerendered content remains accessible without JavaScript');
  assert.deepEqual(errors, [], 'No browser runtime or hydration errors');
} finally {
  await browser.close();
}
