import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const executablePath = execFileSync('python', ['-c', 'from playwright.sync_api import sync_playwright\nwith sync_playwright() as p:\n print(p.chromium.executable_path)'], { encoding: 'utf8' }).trim();
const browser = await chromium.launch({ executablePath, headless: true });
const base = process.env.QA_URL || 'http://localhost:4173';
const errors = [];
await mkdir('artifacts/footer', { recursive: true });

async function enterFooter(page, x = 200) {
  await page.locator('footer').scrollIntoViewIfNeeded();
  const box = await page.locator('footer').boundingBox();
  const y = Math.max(150, box.y + 90);
  await page.mouse.move(x, y);
  return { x, y };
}

async function waitForFollower(page) {
  await page.waitForFunction(() => {
    const pointer = document.querySelector('.following-pointer');
    return pointer && Number(getComputedStyle(pointer).opacity) > 0.99;
  });
}

async function waitForNoFollower(page) {
  await page.locator('.following-pointer').waitFor({ state: 'detached' });
}

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${base}/rituals`, { waitUntil: 'networkidle' });
  const { y } = await enterFooter(page);
  await waitForFollower(page);
  assert.equal(await page.locator('.footer-cursor svg').count(), 1, 'Follower uses the botanical logo');
  assert.equal(await page.locator('.following-pointer').getAttribute('aria-hidden'), 'true');
  assert.equal(await page.locator('.following-pointer').evaluate(el => getComputedStyle(el).pointerEvents), 'none');
  assert.notEqual(await page.locator('footer').evaluate(el => getComputedStyle(el).cursor), 'none', 'Native cursor remains visible');
  assert.equal(await page.locator('footer a').first().evaluate(el => getComputedStyle(el).cursor), 'pointer', 'Links retain the native hand cursor');
  await page.mouse.move(700, y);
  await page.waitForTimeout(60);
  const trailing = await page.locator('.footer-cursor').boundingBox();
  assert.ok(trailing.x > 216 && trailing.x < 716, `Logo follows smoothly: ${trailing.x}`);
  await page.waitForFunction(() => Math.abs(document.querySelector('.footer-cursor').getBoundingClientRect().x - 716) < 2);
  await page.screenshot({ path: 'artifacts/footer/desktop-following-logo.png' });

  await page.keyboard.press('Tab');
  await waitForNoFollower(page);
  await enterFooter(page, 500);
  await waitForFollower(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await waitForNoFollower(page);
  await enterFooter(page, 600);
  assert.equal(await page.locator('.following-pointer').count(), 0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.waitForTimeout(500);
  await enterFooter(page, 650);
  await waitForFollower(page);
  await page.mouse.move(100, 10);
  await waitForNoFollower(page);

  // Exercise the actual footer link beneath/alongside the decorative follower.
  await enterFooter(page);
  await page.locator('footer').getByRole('link', { name: 'Say hello', exact: true }).click();
  await page.waitForURL('**/contact');
  await page.locator('main h1').waitFor();
  await enterFooter(page, 300);
  await waitForFollower(page);
  await page.evaluate(() => window.dispatchEvent(new Event('scroll')));
  await waitForNoFollower(page);
  await page.close();

  for (const width of [375, 768, 1280]) {
    const responsive = await browser.newPage({ viewport: { width, height: 900 } });
    responsive.on('pageerror', error => errors.push(error.message));
    for (const route of ['/', '/collection', '/rituals', '/our-story', '/contact', '/faqs']) {
      await responsive.goto(base + route, { waitUntil: 'networkidle' });
      await responsive.locator('footer').scrollIntoViewIfNeeded();
      assert.equal(await responsive.locator('footer').count(), 1);
      assert.ok(await responsive.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No overflow: ${route} at ${width}`);
    }
    await responsive.screenshot({ path: `artifacts/footer/layout-${width}.png` });
    await responsive.close();
  }

  const touch = await browser.newPage({ hasTouch: true, isMobile: true, viewport: { width: 375, height: 844 } });
  touch.on('pageerror', error => errors.push(error.message));
  await touch.goto(`${base}/rituals`, { waitUntil: 'networkidle' });
  await touch.locator('footer').scrollIntoViewIfNeeded();
  await touch.locator('.footer-brand').tap();
  assert.equal(await touch.locator('.following-pointer').count(), 0, 'No follower on touch');
  await touch.close();
  assert.deepEqual(errors, []);
  console.log('Footer logo, native cursor, smooth tracking, link clicks, reduced motion, touch and responsive routes passed.');
} finally {
  await browser.close();
}
