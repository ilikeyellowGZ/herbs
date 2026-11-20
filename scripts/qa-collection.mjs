import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { mkdir } from 'node:fs/promises';

const browser = await chromium.launch({ channel: process.env.QA_BROWSER || (process.platform === 'win32' ? 'msedge' : 'chrome'), headless: true });
const base = process.env.QA_URL || 'http://localhost:4173';
const errors = [];
await mkdir('artifacts/collection', { recursive: true });
try {
  for (const width of [375, 768, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(`${page.url()}: ${error.message}`));
    await page.goto(base + '/collection');
    await page.getByRole('searchbox', { name: 'Search ingredients' }).waitFor();
    assert.equal(await page.locator('main h1').count(), 1);
    assert.equal(await page.locator('.catalogue-card').count(), 8);
    assert.equal(await page.locator('.catalogue-card .catalogue-price').count(), 0);
    assert.equal(await page.locator('#collection-sort option[value^="price-"]').count(), 0);
    assert.equal(await page.locator('.catalogue-card .add-to-cart a').count(), 8);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow at ${width}`);
    for (const photo of await page.locator('.catalogue-card__photo').all()) {
      await photo.scrollIntoViewIfNeeded();
      await photo.locator('img').evaluate(image => image.decode());
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `artifacts/collection/collection-${width}.png`, fullPage: true });
    const collectionAxe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    assert.deepEqual(collectionAxe.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), [], `Collection accessibility ${width}`);

    await page.getByRole('button', { name: 'Teas & infusions' }).click();
    await page.waitForFunction(() => document.querySelectorAll('.catalogue-card').length === 1);
    assert.match(page.url(), /category=tea/);
    assert.equal(await page.locator('.catalogue-card h2').textContent(), 'Hibiscus');
    await page.getByRole('searchbox', { name: 'Search ingredients' }).fill('cinnamon');
    await page.getByRole('button', { name: 'Show all ingredients' }).waitFor();
    await page.getByRole('button', { name: 'Show all ingredients' }).click();
    await page.waitForFunction(() => document.querySelectorAll('.catalogue-card').length === 8);

    await page.getByLabel('Sort by', { exact: true }).selectOption('name-asc');
    assert.equal(await page.locator('.catalogue-card h2').first().textContent(), 'Ashwagandha');
    await page.getByLabel('Sort by', { exact: true }).selectOption('name-desc');
    assert.equal(await page.locator('.catalogue-card h2').first().textContent(), 'Sea Moss');
    await page.goBack();
    await page.waitForFunction(() => document.querySelector('#collection-sort')?.value === 'name-asc');
    await page.getByRole('searchbox', { name: 'Search ingredients' }).fill('chia');
    await page.waitForFunction(() => document.querySelectorAll('.catalogue-card').length === 1);
    await page.reload();
    await page.getByRole('button', { name: 'Benefits, use & details for Chia Seeds', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor();
    assert.equal(await dialog.locator('.catalogue-price').count(), 0);
    assert.equal(await dialog.getByRole('link', { name: 'Add Chia Seeds to cart', exact: true }).getAttribute('href'), '/products/chia-seeds');
    await dialog.getByRole('button', { name: 'How to use', exact: true }).click();
    assert.match(await dialog.textContent(), /swell fully/);
    await dialog.getByRole('button', { name: 'Suitability & things to know', exact: true }).click();
    const visiblePanel = dialog.locator('.accordion [role="region"]:visible');
    assert.match(await visiblePanel.textContent(), /Do not swallow spoonfuls of dry chia/);
    const closeBounds = await dialog.getByRole('button', { name: 'Close ingredient details' }).boundingBox();
    const dialogBounds = await dialog.boundingBox();
    assert.ok(closeBounds.y >= dialogBounds.y && closeBounds.y + closeBounds.height <= dialogBounds.y + dialogBounds.height, 'Dialog close remains fully visible');
    await page.screenshot({ path: `artifacts/collection/guide-${width}.png` });
    const dialogAxe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    assert.deepEqual(dialogAxe.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), [], `Dialog accessibility ${width}`);
    await dialog.getByRole('link', { name: 'View full product page', exact: true }).focus();
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')), 'Close ingredient details');
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden' });
    assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')), 'Benefits, use & details for Chia Seeds');
    await page.getByRole('button', { name: 'Benefits, use & details for Chia Seeds', exact: true }).click();
    await dialog.getByRole('button', { name: 'Enquire about Chia Seeds', exact: true }).click();
    await page.waitForURL('**/contact');
    await page.locator('select[name="ingredient"]').waitFor();
    assert.equal(await page.locator('select[name="ingredient"]').inputValue(), 'chia-seeds');
    await context.close();
    console.log(`Collection ${width}px: layout, filters, search, sort, URL/back/reload, dialog keyboard, enquiry and axe passed.`);
  }
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('pageerror', error => errors.push(error.message));
  for (const slug of ['hibiscus', 'collagen', 'moringa', 'sea-moss', 'bay-leaves', 'cinnamon', 'chia-seeds', 'ashwagandha']) {
    await page.goto(`${base}/products/${slug}`);
    await page.getByRole('button', { name: 'Benefits & what to expect', exact: true }).click();
    assert.ok(await page.locator('.ingredient-guide .accordion [role="region"]:visible').textContent());
    assert.equal(await page.locator('.product-details').getByText('Price on enquiry', { exact: true }).count(), 1);
    assert.ok(await page.evaluate(() => [...document.images].filter(i => i.complete).every(i => i.naturalWidth > 0)));
  }
  await page.goto(base + '/collection?sort=invalid&category=unknown');
  await page.getByRole('searchbox', { name: 'Search ingredients' }).waitFor();
  assert.equal(await page.locator('.catalogue-card').count(), 8);
  assert.equal(await page.getByLabel('Sort by', { exact: true }).inputValue(), 'featured');
  assert.deepEqual(errors, []);
  console.log('All eight full product guides, invalid URL defaults, and browser error checks passed.');
} finally { await browser.close(); }
