import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { mkdir } from 'node:fs/promises';
import { products } from '../src/data/catalogue.mjs';

const base = process.env.QA_URL || 'http://localhost:4173';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const errors = [];
const widths = (process.env.QA_WIDTHS || '375,768,1280').split(',').map(Number);
await mkdir('artifacts/product-gallery', { recursive: true });
try {
  for (const width of widths) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    for (const product of products) {
      await page.goto(`${base}/products/${product.slug}`);
      const gallery = page.getByRole('region', { name: `${product.name} images`, exact: true });
      await gallery.waitFor();
      const thumbnails = gallery.locator('.gallery-thumbnails button');
      assert.ok(await thumbnails.count() >= 4);
      for (let index = 0; index < product.images.length; index++) {
        await thumbnails.nth(index).click();
        await gallery.locator('.gallery-main img').evaluate(image => image.decode());
        assert.equal(await thumbnails.nth(index).getAttribute('aria-pressed'), 'true');
        assert.match(await gallery.locator('[role="status"]').textContent(), new RegExp(`Image ${index + 1} of ${product.images.length}`));
        assert.ok(await gallery.locator('.gallery-main img').getAttribute('alt'));
      }
      await gallery.getByRole('button', { name: 'Next product image', exact: true }).click();
      assert.equal(await thumbnails.first().getAttribute('aria-pressed'), 'true', 'Next wraps to first');
      await gallery.getByRole('button', { name: 'Previous product image', exact: true }).click();
      assert.equal(await thumbnails.last().getAttribute('aria-pressed'), 'true', 'Previous wraps to last');
      await thumbnails.last().press('Home');
      assert.equal(await thumbnails.first().getAttribute('aria-pressed'), 'true');
      await thumbnails.last().press('ArrowRight');
      assert.equal(await thumbnails.nth(1).getAttribute('aria-pressed'), 'true');
      await thumbnails.nth(1).press('End');
      assert.equal(await thumbnails.last().getAttribute('aria-pressed'), 'true');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${product.slug} overflows at ${width}`);
      if (product.slug === 'hibiscus' || product.slug === 'moringa') {
        for (const image of await page.locator('.related-section img').all()) {
          await image.scrollIntoViewIfNeeded();
          await image.evaluate(el => el.decode());
        }
        await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
        await page.screenshot({ path: `artifacts/product-gallery/${product.slug}-${width}.png`, fullPage: true });
        const axe = await new AxeBuilder({ page }).include('.product-gallery').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
        assert.deepEqual(axe.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })), []);
      }
    }
    await context.close();
    console.log(`All eight galleries at ${width}px: images, thumbnails, wrapping, keyboard, overflow and accessibility passed.`);
  }
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  for (const [route, selector] of [['/', '.product-card'], ['/collection', '.catalogue-card__photo'], ['/products/moringa', '.product-card']]) {
    await page.goto(base + route);
    const cards = page.locator(selector);
    await cards.first().waitFor();
    for (const card of await cards.all()) {
      await card.scrollIntoViewIfNeeded();
      const alternate = card.locator('.product-image-swap__alternate');
      await alternate.locator('img').evaluate(image => image.decode());
      await card.hover();
      await page.waitForFunction(el => getComputedStyle(el).opacity === '1', await alternate.elementHandle());
      assert.equal(await alternate.locator('img').getAttribute('alt'), '');
      await page.mouse.move(0, 0);
      await page.waitForFunction(el => getComputedStyle(el).opacity === '0', await alternate.elementHandle());
      await page.keyboard.press('Tab');
      await card.focus();
      await page.waitForFunction(el => getComputedStyle(el).opacity === '1', await alternate.elementHandle());
      await card.evaluate(el => el.blur());
    }
    console.log(`${route}: every card crossfades on hover and keyboard focus.`);
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.ok(await page.locator('.product-image-swap__alternate').first().evaluate(el => parseFloat(getComputedStyle(el).transitionDuration) <= .001), 'Reduced motion switches effectively instantly');
  await page.close();
  const touch = await browser.newPage({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });
  await touch.goto(base + '/products/hibiscus');
  await touch.getByRole('button', { name: 'Next product image', exact: true }).tap();
  assert.equal(await touch.locator('.gallery-thumbnails button').nth(1).getAttribute('aria-pressed'), 'true');
  await touch.goto(base + '/collection');
  assert.equal(await touch.locator('.product-image-swap__alternate').first().evaluate(el => getComputedStyle(el).opacity), '0');
  await touch.close();
  assert.deepEqual(errors, []);
  console.log('Reduced motion, touch navigation and browser/network error checks passed.');
} finally { await browser.close(); }
