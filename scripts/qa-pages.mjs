import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';

const executablePath = execFileSync('python', ['-c', 'from playwright.sync_api import sync_playwright\nwith sync_playwright() as p:\n print(p.chromium.executable_path)'], { encoding: 'utf8' }).trim();
const browser = await chromium.launch({ executablePath, headless: true });
const base = process.env.QA_URL || 'http://localhost:5174';
const errors = [];
await mkdir('artifacts/pages', { recursive: true });
try {
  for (const width of [375, 768, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    page.on('pageerror', error => errors.push(error.message));
    for (const route of ['/collection', '/rituals', '/our-story', '/contact', '/faqs']) {
      await page.goto(base + route, { waitUntil: 'networkidle' });
      await page.locator('main h1').waitFor();
      assert.equal(await page.locator('main h1').count(), 1, route);
      assert.equal(await page.locator('.not-found').count(), 0, `${route} must have its own page`);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route} overflow at ${width}`);
      await page.screenshot({ path: `artifacts/pages/${route.slice(1)}-${width}.png`, fullPage: true });
    }
    await page.goto(base + '/faqs', { waitUntil: 'networkidle' });
    const question = page.locator('.accordion button').first();
    await question.click();
    assert.equal(await question.getAttribute('aria-expanded'), 'true');
    await page.goto(base + '/products/hibiscus', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Enquire about Hibiscus', exact: true }).click();
    await page.waitForURL('**/contact');
    await page.locator('input[name="name"]').waitFor();
    assert.equal(await page.locator('select[name="ingredient"]').inputValue(), 'hibiscus');
    await page.locator('input[name="name"]').fill('Ada');
    if (width === 1280) await page.getByRole('navigation', { name: 'Main navigation', exact: true }).getByRole('link', { name: 'Rituals' }).click();
    else {
      await page.getByRole('button', { name: 'Open menu', exact: true }).click();
      await page.getByRole('navigation', { name: 'Mobile navigation', exact: true }).getByRole('link', { name: 'Rituals' }).click();
    }
    await page.waitForURL('**/rituals');
    await page.locator('footer').getByRole('link', { name: 'Contact', exact: true }).click();
    await page.waitForURL('**/contact');
    assert.equal(await page.locator('input[name="name"]').inputValue(), 'Ada');
    const hello = page.locator('footer').getByRole('link', { name: 'Say hello', exact: true });
    const helloHref = await hello.getAttribute('href');
    if (process.env.VITE_INSTAGRAM_URL) assert.equal(helloHref, process.env.VITE_INSTAGRAM_URL);
    else assert.equal(helloHref, '/contact', 'Keep a working contact fallback until the Instagram profile is confirmed');
    await page.close();
  }
  assert.deepEqual(errors, []);
  console.log('Dedicated pages, responsive layouts, FAQs, navigation, enquiry preselection and draft persistence passed.');
} finally { await browser.close(); }
