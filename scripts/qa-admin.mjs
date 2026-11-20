import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { createApp } from '../server/app.mjs';

// All records in this check live in an isolated temporary database.
const directory = await mkdtemp(join(tmpdir(), 'herby-browser-'));
const password = randomBytes(24).toString('hex');
const base = 'http://127.0.0.1:4199';
const { app, db } = await createApp({ dataDir: directory, origin: base, adminEmail: 'qa-owner@example.com', adminPassword: password });
const server = app.listen(4199, '127.0.0.1');
await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
const browser = await chromium.launch({ channel: process.env.QA_BROWSER || (process.platform === 'win32' ? 'msedge' : 'chrome'), headless: true });
const errors = [];
await mkdir('artifacts/admin', { recursive: true });
async function accessible(page, name) {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  assert.deepEqual(result.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })), [], name);
}
async function fits(page, name) {
  const overflow = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, offenders: [...document.querySelectorAll('body *')].map(e => ({ tag: e.tagName, className: e.className, x: e.getBoundingClientRect().x, right: e.getBoundingClientRect().right, width: e.getBoundingClientRect().width, minWidth: getComputedStyle(e).minWidth })).filter(e => e.right > innerWidth + 1 && e.width > 0).slice(0, 12) }));
  if (overflow.scrollWidth > overflow.width) { await page.screenshot({ path: 'artifacts/admin/overflow.png', fullPage: true }); console.log(JSON.stringify(overflow)); }
  assert.ok(overflow.scrollWidth <= overflow.width, `Page overflows: ${name}`);
}
async function settled(page) { await page.locator('.site-loader').waitFor({ state: 'hidden' }); }
async function fillCheckout(page, width) {
  await page.getByLabel('Full name', { exact: true }).fill(`Browser Customer ${width}`);
  await page.getByLabel('Email address', { exact: true }).fill(`customer-${width}@example.com`);
  await page.getByLabel('Phone number', { exact: true }).fill('0821234567');
  await page.getByLabel('Street address & unit', { exact: true }).fill('12 Garden Road');
  await page.getByLabel('Town / city', { exact: true }).fill('Johannesburg');
  await page.getByLabel('Province', { exact: true }).selectOption('Gauteng');
  await page.getByLabel('Postal code', { exact: true }).fill('2000');
}
try {
  for (const width of [375, 768, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', acceptDownloads: true });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/admin', { waitUntil: 'networkidle' });
    await page.getByLabel('Email address', { exact: true }).fill('qa-owner@example.com');
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.screenshot({ path: `artifacts/admin/login-${width}.png`, fullPage: true });
    await accessible(page, `login ${width}`);
    await page.getByRole('button', { name: 'Sign in to your workspace' }).click();
    await page.getByRole('heading', { name: 'A little room to grow.' }).waitFor();
    await page.getByRole('heading', { name: 'A week in the garden.' }).waitFor();
    await fits(page, `overview ${width}`); await accessible(page, `overview ${width}`);
    await page.screenshot({ path: `artifacts/admin/overview-${width}.png`, fullPage: true });
    for (const [section, heading] of [['orders', 'Good things, on their way.'], ['products', 'Your everyday essentials.'], ['customers', 'People at the heart of it.'], ['enquiries', 'A conversation starts here.'], ['settings', 'Grounded in the details.'], ['activity', 'Every little thing, recorded.']]) {
      await page.getByRole('navigation', { name: 'Dashboard navigation' }).getByRole('link', { name: section === 'enquiries' ? 'Enquiries' : section[0].toUpperCase() + section.slice(1), exact: true }).click();
      await page.getByRole('heading', { name: heading, exact: true }).waitFor();
      await page.waitForLoadState('networkidle');
      await fits(page, `${section} ${width}`); await accessible(page, `${section} ${width}`);
      await page.screenshot({ path: `artifacts/admin/${section}-${width}.png`, fullPage: true });
    }
    await page.goto(base + '/admin/products', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Edit Hibiscus', exact: true }).click();
    await page.getByLabel('Price (ZAR)', { exact: true }).fill('110');
    await page.getByLabel('Units in stock').fill('10');
    await page.getByRole('button', { name: 'Save ingredient', exact: true }).click();
    await page.getByRole('button', { name: 'Save ingredient', exact: true }).waitFor({ state: 'detached' });
    await page.getByRole('button', { name: 'Edit Hibiscus', exact: true }).click();
    assert.equal(await page.getByLabel('Price (ZAR)', { exact: true }).inputValue(), '110');
    await accessible(page, `product editor ${width}`); await fits(page, `product editor ${width}`);
    await page.screenshot({ path: `artifacts/admin/editor-${width}.png`, fullPage: true });
    await page.goto(base + '/admin/settings', { waitUntil: 'networkidle' });
    await page.getByLabel('Courier fee (ZAR)', { exact: true }).fill('85');
    await page.getByLabel('Contact email', { exact: true }).fill('hello@example.com');
    await page.getByRole('button', { name: 'Save store settings', exact: true }).click();
    await page.getByText('Store settings saved.', { exact: true }).waitFor();
    await page.goto(base + '/products/hibiscus', { waitUntil: 'networkidle' }); await settled(page);
    assert.match(await page.locator('.product-details .catalogue-price').textContent(), /110/);
    await page.getByRole('button', { name: 'Add Hibiscus to bag', exact: true }).click();
    await page.goto(base + '/checkout', { waitUntil: 'networkidle' }); await settled(page);
    await fillCheckout(page, width);
    await page.getByRole('button', { name: 'Review order', exact: true }).click();
    assert.match(await page.locator('.checkout-summary .shopping-total dd').textContent(), /195/);
    await fits(page, `checkout review ${width}`); await accessible(page, `checkout review ${width}`);
    await page.screenshot({ path: `artifacts/admin/checkout-${width}.png`, fullPage: true });
    const beforeOrders = db.prepare('SELECT COUNT(*) AS count FROM orders').get().count;
    if (width === 375) {
      // Let the server commit the order, then drop its response before the browser receives it.
      let dropped = false;
      await page.route('**/api/orders', async route => {
        const response = await route.fetch();
        if (!dropped) { dropped = true; await route.abort('failed'); } else await route.fulfill({ response });
      });
      await page.getByRole('button', { name: 'Submit order request', exact: true }).click();
      await page.locator('.checkout-review .field-error').waitFor();
      assert.equal(db.prepare('SELECT COUNT(*) AS count FROM orders').get().count, beforeOrders + 1);
      const attempt = await page.evaluate(() => sessionStorage.getItem('herby-order-attempt'));
      assert.ok(attempt && !attempt.includes('customer-375') && !attempt.includes('Garden Road'));
      await page.reload({ waitUntil: 'networkidle' }); await settled(page);
      await fillCheckout(page, width);
      await page.getByRole('button', { name: 'Review order', exact: true }).click();
    }
    await page.getByRole('button', { name: 'Submit order request', exact: true }).click();
    await page.getByRole('heading', { name: 'Your request is with us.', exact: true }).waitFor();
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM orders').get().count, beforeOrders + 1, 'Retry must not create another order');
    assert.equal(await page.evaluate(() => sessionStorage.getItem('herby-order-attempt')), null);
    const reference = await page.locator('.checkout-empty strong').textContent(); assert.match(reference, /^HH-/);
    await page.goto(base + '/contact', { waitUntil: 'networkidle' }); await settled(page);
    await page.getByLabel('First name', { exact: true }).fill('Browser');
    await page.getByLabel('Surname', { exact: true }).fill(`Enquiry${width}`);
    await page.getByLabel('Email address', { exact: true }).fill(`enquiry-${width}@example.com`);
    await page.getByLabel('Phone number', { exact: true }).fill('0821234567');
    await page.getByLabel('Your message', { exact: true }).fill(`A little question from the ${width}px browser check.`);
    await page.locator('input[type=file]').setInputFiles({ name: 'question.txt', mimeType: 'text/plain', buffer: Buffer.from('A private attachment.') });
    await page.getByRole('button', { name: 'Send message', exact: true }).click();
    await page.getByRole('button', { name: 'Message received', exact: true }).waitFor();
    assert.match(await page.locator('.form-status').textContent(), /HE-/);
    await page.locator('footer.site-footer').scrollIntoViewIfNeeded();
    const box = await page.locator('footer.site-footer').boundingBox(); await page.mouse.move(100, Math.max(100, box.y + 80));
    assert.equal(await page.locator('.following-pointer, .footer-cursor').count(), 0);
    await page.goto(base + '/admin/orders', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: reference, exact: true }).click();
    await page.getByLabel('Order status', { exact: true }).selectOption('confirmed');
    await page.getByRole('button', { name: 'Save order', exact: true }).click();
    await page.waitForFunction(() => [...document.querySelectorAll('.admin-detail select option')].some(option => option.value === 'fulfilled'));
    await page.getByLabel('Order status', { exact: true }).selectOption('fulfilled');
    await page.getByRole('button', { name: 'Save order', exact: true }).click();
    await page.getByText('Fulfilled', { exact: true }).first().waitFor();
    await fits(page, `order details ${width}`); await accessible(page, `order details ${width}`);
    await page.screenshot({ path: `artifacts/admin/order-detail-${width}.png`, fullPage: true });
    await page.goto(base + '/admin/enquiries', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: `Browser Enquiry${width}`, exact: true }).click();
    const download = page.waitForEvent('download'); await page.getByRole('link', { name: /question.txt/ }).click();
    assert.equal((await download).suggestedFilename(), 'question.txt');
    await page.getByLabel('Enquiry status', { exact: true }).selectOption('resolved');
    await page.getByLabel('Internal notes', { exact: true }).fill('Resolved in the browser check.');
    await page.getByRole('button', { name: 'Save enquiry', exact: true }).click();
    await page.getByText('Enquiry updated.', { exact: true }).waitFor();
    await accessible(page, `inbox details ${width}`); await fits(page, `inbox details ${width}`);
    await page.screenshot({ path: `artifacts/admin/inbox-detail-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    await page.getByRole('button', { name: 'Sign in to your workspace', exact: true }).waitFor();
    assert.equal((await page.request.get(base + '/api/admin/orders')).status(), 401);
    await context.close(); console.log(`Dashboard and connected storefront passed at ${width}px.`);
  }
  assert.deepEqual(errors, [], 'No browser runtime or hydration errors');
  console.log('All responsive admin routes, accessibility, product/settings persistence, checkout, private inbox download, footer removal and logout checks passed.');
} finally {
  await browser.close(); await new Promise(resolve => server.close(resolve)); db.close();
  assert.equal(dirname(resolve(directory)), resolve(tmpdir()));
  await rm(directory, { recursive: true, force: true });
}
