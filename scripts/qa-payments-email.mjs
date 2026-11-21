import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createHmac } from 'node:crypto';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { createApp } from '../server/app.mjs';

const directory = await mkdtemp(join(tmpdir(), 'herby-browser-payments-'));
const server = createServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`, transactions = new Map(), sends = [], errors = [];
const secret = 'whsec_browser_fixture';
const store = await createApp({ dataDir: directory, distDir: process.env.QA_DIST || resolve('artifacts/payments-email/site'), origin, adminEmail: 'owner@example.com', adminPassword: 'browser-test-owner-123', integrations: {
  paystackKey: 'sk_test_fixture', paystackWebhookSecret: secret, resendKey: 're_fixture', emailFrom: 'Herby Health <orders@example.com>', notifyEmail: 'owner@example.com', replyTo: 'hello@example.com',
  fetch: async (url, options) => {
    if (url === 'https://api.resend.com/emails') { sends.push(JSON.parse(options.body)); return new Response(JSON.stringify({ id: `browser-email-${sends.length}` }), { status: 200 }); }
    if (url.endsWith('/transaction/initialize')) {
      const body = JSON.parse(options.body);
      transactions.set(body.reference, { ...body, customer: { email: body.email }, id: transactions.size + 1, domain: 'test', status: 'pending' });
      return new Response(JSON.stringify({ status: true, data: { reference: body.reference, authorization_url: `https://checkout.paystack.com/test-${body.reference}` } }), { status: 200 });
    }
    return new Response(JSON.stringify({ status: true, data: transactions.get(url.split('/').pop()) }), { status: 200 });
  },
} });
server.on('request', store.app);
const browser = await chromium.launch({ channel: process.env.QA_BROWSER || (process.platform === 'win32' ? 'msedge' : 'chrome'), headless: true });
await mkdir('artifacts/payments-email', { recursive: true });
async function axe(page, context) {
  const results = await new AxeBuilder({ page }).disableRules(['frame-tested']).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  assert.deepEqual(results.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })), [], context);
}
async function screenshot(page, name) {
  await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow on ${page.url()}`);
  await page.screenshot({ path: `artifacts/payments-email/${name}.png`, fullPage: true });
}
let lastPage;
try {
  for (const width of [375, 768, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', acceptDownloads: true });
    await context.route('https://checkout.paystack.com/**', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><html lang="en"><title>Fake hosted checkout</title><body><h1>Paystack test checkout</h1><p>Local fixture. No external request or charge.</p></body></html>' }));
    const page = await context.newPage();
    lastPage = page;
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(origin + '/products/hibiscus', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Add Hibiscus to bag', exact: true }).click();
    await page.getByRole('button', { name: 'Open shopping bag, 1 item', exact: true }).click();
    await page.getByRole('dialog', { name: 'Your bag' }).getByRole('link', { name: 'Checkout', exact: true }).click();
    await page.getByLabel('Full name', { exact: true }).fill('Ada Lovelace');
    await page.getByLabel('Email address', { exact: true }).fill(`buyer${width}@example.com`);
    await page.getByLabel('Phone number', { exact: true }).fill('0821234567');
    await page.getByRole('radio', { name: /Collect in Gauteng/ }).check();
    await page.getByRole('button', { name: 'Review order', exact: true }).click();
    await page.getByRole('button', { name: 'Continue to Paystack', exact: true }).click();
    await page.waitForURL('https://checkout.paystack.com/**');
    const reference = [...transactions.keys()].at(-1);
    assert.equal(store.db.prepare('SELECT payment FROM orders ORDER BY rowid DESC LIMIT 1').get().payment, 'unpaid');
    await page.goto(origin + '/checkout/payment?reference=' + reference, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'A little patience, please.', exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Open shopping bag, 1 item', exact: true }).count(), 1);
    transactions.get(reference).status = 'success';
    const payload = JSON.stringify({ event: 'charge.success', data: transactions.get(reference) });
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = `t=${timestamp},v1=whk_fixture:${createHmac('sha512', secret).update(`${timestamp}.`).update(payload).digest('hex')}`;
    const webhook = await fetch(origin + '/api/webhooks/paystack', { method: 'POST', headers: { 'Content-Type': 'application/json', 'paystack-signature': signature }, body: payload });
    assert.equal(webhook.status, 200);
    await page.getByRole('button', { name: 'Check payment status', exact: true }).click();
    await page.getByRole('heading', { name: 'A little nature, on its way.', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Open shopping bag, 0 items', exact: true }).waitFor();
    const downloaded = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download invoice', exact: true }).click();
    assert.match((await downloaded).suggestedFilename(), /^INV-HH-.*\.html$/);
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'A little nature, on its way.', exact: true }).waitFor();
    await axe(page, `payment return ${width}`);
    await screenshot(page, `payment-success-${width}`);
    await page.goto(origin + '/contact', { waitUntil: 'networkidle' });
    await page.getByLabel('First name', { exact: true }).fill('Ada');
    await page.getByLabel('Surname', { exact: true }).fill('Lovelace');
    await page.getByLabel('Email address', { exact: true }).fill(`buyer${width}@example.com`);
    await page.getByLabel('Phone number', { exact: true }).fill('0821234567');
    await page.getByLabel('Your message', { exact: true }).fill('Could you tell me more about the hibiscus preparation?');
    await page.getByRole('button', { name: 'Send message', exact: true }).click();
    await page.getByRole('button', { name: 'Message received', exact: true }).waitFor();
    await page.goto(origin + '/admin', { waitUntil: 'networkidle' });
    await page.getByLabel('Email address', { exact: true }).fill('owner@example.com');
    await page.getByLabel('Password', { exact: true }).fill('browser-test-owner-123');
    await page.getByRole('button', { name: 'Sign in to your workspace', exact: true }).click();
    await page.getByRole('link', { name: 'Enquiries', exact: true }).click();
    await page.getByRole('button', { name: 'Ada Lovelace', exact: true }).first().click();
    await page.getByLabel('Your reply', { exact: true }).fill('Thanks for asking. Follow the preparation directions on your supplied pack.');
    await page.getByRole('button', { name: 'Send reply by email', exact: true }).click();
    await page.getByText('Your reply has been saved and queued for email delivery.', { exact: true }).waitFor();
    await store.notifications.process({ limit: 50 });
    await screenshot(page, `enquiry-reply-${width}`);
    await page.getByRole('link', { name: 'Notifications', exact: true }).click();
    await page.getByRole('heading', { name: 'Your correspondence.', exact: true }).waitFor();
    await page.getByLabel('Email template', { exact: true }).selectOption('invoice');
    await page.frameLocator('.admin-email-preview').getByRole('heading', { name: 'Your invoice', exact: true }).waitFor();
    await axe(page, `notifications ${width}`);
    await screenshot(page, `notification-centre-${width}`);
    await page.getByRole('button', { name: 'View plain text', exact: true }).click();
    assert.match(await page.locator('.admin-email-text').textContent(), /INV-HH-/);
    await context.close();
    console.log(`${width}px: hosted redirect, pending and signed success, status reload, invoice download, enquiry/reply, notification log/template and axe passed.`);
  }
  assert.ok(sends.some(message => message.subject.includes('invoice')));
  assert.ok(sends.some(message => message.text.includes('Thanks for asking.')));
  assert.deepEqual(errors, []);
  console.log(`${sends.length} fixture emails accepted locally. No external emails or payments were sent.`);
} catch (error) {
  if (lastPage && !lastPage.isClosed()) { await lastPage.screenshot({ path: 'artifacts/payments-email/failure.png', fullPage: true }); await writeFile('artifacts/payments-email/failure.html', await lastPage.content()); }
  console.error('Browser diagnostics:', errors);
  throw error;
} finally {
  await browser.close(); await store.notifications.stop();
  await new Promise(resolve => server.close(resolve)); store.db.close();
  await rm(directory, { recursive: true, force: true });
}
