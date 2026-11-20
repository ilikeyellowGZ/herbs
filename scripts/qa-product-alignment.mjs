import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.env.QA_URL || 'http://localhost:4173';
const inspect = process.argv.includes('--inspect');
const browser = await chromium.launch({ channel: process.env.QA_BROWSER || (process.platform === 'win32' ? 'msedge' : 'chrome'), headless: true });
await mkdir('artifacts/product-alignment', { recursive: true });
const measurements = [];
const errors = [];
try {
  for (const width of [360, 375, 390, 430, 640, 768, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    for (const route of ['/', '/collection']) {
      await page.goto(base + route, { waitUntil: 'networkidle' });
      await page.locator('.site-loader').waitFor({ state: 'hidden' });
      await page.evaluate(() => document.fonts.ready);
      const grid = page.locator(route === '/' ? '#collection .product-grid' : '.catalogue-grid');
      await grid.scrollIntoViewIfNeeded();
      const cards = await grid.locator('article').evaluateAll(elements => elements.map(card => {
        const rect = element => { const r = element.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, bottom: r.bottom }; };
        const image = card.querySelector('.product-card__image, .catalogue-card__photo');
        const action = card.querySelector('.add-to-cart .solid-button');
        return { name: card.querySelector('h2,h3').textContent, card: rect(card), image: rect(image), action: rect(action), actionOffset: action.getBoundingClientRect().y - card.getBoundingClientRect().y, overflow: [...card.querySelectorAll('h2,h3,p,.solid-button')].filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.className || e.tagName) };
      }));
      measurements.push({ route, width, cards });
      if ([375, 768, 1280].includes(width)) await grid.screenshot({ path: `artifacts/product-alignment/${inspect ? 'before' : 'after'}-${route === '/' ? 'home' : 'collection'}-${width}.png` });
      if (!inspect) {
        assert.equal(cards.length, 8);
        for (const property of ['width', 'height']) {
          const sizes = cards.map(c => c.card[property]);
          assert.ok(Math.max(...sizes) - Math.min(...sizes) < 1.5, `${route} ${width}: consistent card ${property}: ${sizes.join(', ')}`);
          const images = cards.map(c => c.image[property]);
          assert.ok(Math.max(...images) - Math.min(...images) < 1.5, `${route} ${width}: consistent image ${property}`);
        }
        const actions = cards.map(c => c.actionOffset);
        assert.ok(Math.max(...actions) - Math.min(...actions) < 1.5, `${route} ${width}: aligned purchase actions: ${actions.join(', ')}`);
        assert.deepEqual(cards.flatMap(c => c.overflow.map(selector => `${c.name}: ${selector}`)), [], `${route} ${width}: all product copy fits`);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route} ${width}: no page overflow`);
        if (width === 375) {
          const stress = await grid.evaluate(element => {
            element.querySelector('.product-note, .catalogue-description').textContent = 'A longer ingredient description that wraps naturally across several lines without losing any of its information. '.repeat(4);
            return [...element.querySelectorAll('article')].map(card => ({ height: card.getBoundingClientRect().height, action: card.querySelector('.add-to-cart .solid-button').getBoundingClientRect().y - card.getBoundingClientRect().y }));
          });
          for (const key of ['height', 'action']) assert.ok(Math.max(...stress.map(c => c[key])) - Math.min(...stress.map(c => c[key])) < 1.5, `${route}: long copy preserves ${key}`);
        }
        if (route === '/collection' && [375, 768].includes(width)) {
          await page.getByLabel('Sort by', { exact: true }).selectOption('name-asc');
          assert.equal(await grid.locator('h2').first().textContent(), 'Ashwagandha');
          await page.getByRole('button', { name: /^Kitchen & pantry/ }).click();
          assert.equal(await grid.locator('article').count(), 4);
          const filtered = await grid.locator('article').evaluateAll(items => items.map(item => item.getBoundingClientRect().height));
          assert.ok(Math.max(...filtered) - Math.min(...filtered) < 1.5, `Filtered collection ${width}: equal heights`);
        }
      }
      console.log(JSON.stringify({ route, width, heights: cards.map(c => +c.card.height.toFixed(1)), actions: cards.map(c => +c.actionOffset.toFixed(1)), overflow: cards.filter(c => c.overflow.length).map(c => c.name) }));
    }
    await context.close();
  }
  assert.deepEqual(errors, [], 'No browser errors');
} finally { await writeFile(`artifacts/product-alignment/${inspect ? 'before' : 'after'}.json`, JSON.stringify(measurements, null, 2)); await browser.close(); }
