import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { products } from '../src/data/catalogue.mjs';

const executablePath = execFileSync('python', ['-c', 'from playwright.sync_api import sync_playwright\np = sync_playwright().start()\nprint(p.chromium.executable_path)\np.stop()'], { encoding: 'utf8' }).trim();
const browser = await chromium.launch({ executablePath, headless: true });
const base = process.env.QA_URL || 'http://localhost:5174';
const errors = [];
await mkdir('artifacts/pages', { recursive: true });
try {
  for (const width of [375, 768, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    page.on('pageerror', error => errors.push(error.message));
    for (const route of ['/', '/collection', '/rituals', '/our-story', '/contact', '/faqs']) {
      await page.goto(base + route, { waitUntil: 'networkidle' });
      await page.locator('main h1').waitFor();
      assert.equal(await page.locator('main h1').count(), 1, route);
      assert.equal(await page.locator('.not-found').count(), 0, `${route} must have its own page`);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route} overflow at ${width}`);
      if (route === '/' || route === '/collection') {
        const cards = page.locator('#collection .product-card');
        assert.deepEqual(await cards.evaluateAll(elements => elements.map(element => element.getAttribute('href'))), products.map(product => `/products/${product.slug}`));
        assert.equal(await page.locator('#collection .product-grid').evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length), width <= 880 ? 2 : 4);
        for (const image of await cards.locator('img').all()) {
          await image.scrollIntoViewIfNeeded();
          await image.evaluate(element => element.decode());
        }
        await page.locator('#collection .product-grid').evaluate(element => window.scrollTo({ top: element.getBoundingClientRect().top + scrollY - 112, behavior: 'instant' }));
        await page.screenshot({ path: `artifacts/pages/${route === '/' ? 'home' : 'collection'}-products-${width}.png` });
      }
      await page.screenshot({ path: `artifacts/pages/${route.slice(1) || 'home'}-${width}.png`, fullPage: true });
    }
    await page.goto(base + '/faqs', { waitUntil: 'networkidle' });
    const question = page.locator('.accordion button').first();
    await question.click();
    assert.equal(await question.getAttribute('aria-expanded'), 'true');
    await page.goto(base + '/collection', { waitUntil: 'networkidle' });
    await page.locator('.product-card').first().click();
    await page.waitForURL('**/products/hibiscus');
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
    await page.locator('footer').getByRole('link', { name: 'Say hello', exact: true }).click();
    await page.waitForURL('**/contact');
    assert.equal(await page.locator('input[name="name"]').inputValue(), 'Ada');
    const hello = page.locator('footer').getByRole('link', { name: 'Say hello', exact: true });
    const helloHref = await hello.getAttribute('href');
    assert.equal(helloHref, '/contact', 'Say hello opens the contact page');
    await page.close();
  }
  execFileSync(process.execPath, ['scripts/qa-footer.mjs'], {
    stdio: 'inherit',
    env: { ...process.env, QA_URL: base },
  });
  assert.deepEqual(errors, []);
  console.log('Dedicated pages, responsive layouts, FAQs, navigation, enquiry preselection, draft persistence and footer cursor behavior passed.');
} finally { await browser.close(); }
