import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { mkdir } from 'node:fs/promises';
import { helpTopics, searchHelp } from '../src/data/help.mjs';

const browser = await chromium.launch({ channel: process.env.QA_BROWSER || 'msedge', headless: true });
const base = process.env.QA_URL || 'http://localhost:4173';
const errors = [];
await mkdir('artifacts/help', { recursive: true });
try {
  for (const width of [375, 768, 1024, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/get-help', { waitUntil: 'networkidle' });
    await page.getByRole('searchbox', { name: 'Search help articles' }).waitFor();
    assert.match(await page.title(), /Get help/);
    assert.equal(await page.locator('main h1').count(), 1);
    assert.equal(await page.locator('.help-topic').count(), 9);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No overflow at ${width}`);
    assert.equal(await page.locator('.help-topics').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length), width <= 640 ? 1 : width <= 960 ? 2 : 3);
    await page.locator('.help-hero img').evaluate(image => image.decode());
    await page.screenshot({ path: `artifacts/help/get-help-${width}.png`, fullPage: true });
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    assert.deepEqual(axe.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), [], `Accessibility at ${width}`);

    await page.getByRole('button', { name: 'List view', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: 'List view', exact: true }).getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('.help-topics').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length), 1);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `artifacts/help/list-${width}.png` });

    const search = page.getByRole('searchbox', { name: 'Search help articles' });
    await search.fill('GAUTENG collection');
    assert.equal(await page.locator('.help-articles li').count(), searchHelp('GAUTENG collection').length);
    await page.getByRole('link', { name: /Can I collect in Gauteng/ }).click();
    await page.getByRole('heading', { name: 'Can I collect in Gauteng?', exact: true }).waitFor();
    assert.match(await page.locator('.help-answer').textContent(), /location and time/);
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'help-directory-title');
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('.help-answer').count(), 1);
    await page.goBack();
    await page.getByRole('heading', { name: 'Search results', exact: true }).waitFor();
    await search.fill('xyz-no-matching-question');
    await page.getByRole('heading', { name: 'No answers found just yet.' }).waitFor();
    await page.screenshot({ path: `artifacts/help/empty-${width}.png` });
    await page.getByRole('button', { name: 'Clear search', exact: true }).click();
    assert.equal(await page.locator('.help-topic').count(), 9);
    assert.equal(await search.inputValue(), '');
    assert.equal(await search.evaluate(el => el === document.activeElement), true);
    await search.fill('payment');
    await search.press('Enter');
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'help-directory-title');
    const searchAxe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    assert.deepEqual(searchAxe.violations.map(v => v.id), []);
    await page.getByRole('button', { name: 'Clear search', exact: true }).click();

    if (width === 1280) {
      for (const topic of helpTopics) {
        await page.locator('.help-topic').filter({ hasText: topic.title }).click();
        assert.equal(await page.locator('.help-articles li').count(), topic.articles.length);
        for (const article of topic.articles) {
          await page.locator('.help-articles').getByRole('link', { name: article.title, exact: true }).click();
          assert.equal((await page.locator('.help-answer > p').textContent()).trim(), article.body);
          assert.equal(await page.locator('.help-answer > a').getAttribute('href'), article.href);
          await page.locator('.help-breadcrumb').getByRole('link', { name: topic.title, exact: true }).click();
        }
        await page.locator('.help-breadcrumb').getByRole('link', { name: 'All topics', exact: true }).click();
      }
      assert.equal(await page.getByRole('navigation', { name: 'Main navigation', exact: true }).getByRole('link', { name: 'Get help' }).getAttribute('href'), '/get-help');
    } else if (width === 375) {
      await page.getByRole('button', { name: 'Open menu', exact: true }).click();
      await page.getByRole('navigation', { name: 'Mobile navigation', exact: true }).getByRole('link', { name: 'Get help', exact: true }).click();
      assert.equal(await page.locator('.navigation-dialog').evaluate(el => el.open), false);
    }
    assert.equal(await page.locator('footer').getByRole('link', { name: 'Get help', exact: true }).getAttribute('href'), '/get-help');
    await page.locator('.help-support').getByRole('link', { name: /A little help from us/ }).click();
    await page.waitForURL('**/contact');
    await context.close();
    console.log(`${width}px: layout, search, history, reload, keyboard, support links and accessibility passed.`);
  }
  assert.deepEqual(errors, []);
  console.log('All help topics, article links and browser error checks passed.');
} finally {
  await browser.close();
}
