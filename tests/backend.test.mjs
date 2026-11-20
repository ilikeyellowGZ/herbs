import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { DatabaseSync } from 'node:sqlite';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../server/app.mjs';

const details = { name: 'Test Customer', email: 'customer@example.com', phone: '0821234567', address: '10 Garden Road', city: 'Johannesburg', province: 'Gauteng', postalCode: '2000', notes: '' };

test('persistent API protects owner data and connects commerce and inbox', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'herby-api-'));
  const { app, db } = await createApp({ dataDir: directory, adminEmail: 'owner@example.com', adminPassword: 'a-long-test-password-47', origin: 'http://localhost:5174' });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  let cookie = '', csrf = '';
  async function request(path, method = 'GET', body, authenticated = true, extra = {}) {
    const response = await fetch(base + path, { method, headers: { ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}), Origin: 'http://localhost:5174', ...(authenticated ? { Cookie: cookie, 'X-CSRF-Token': csrf } : {}), ...extra }, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined });
    const value = response.headers.get('content-type')?.includes('application/json') ? await response.json() : await response.text();
    return { response, value };
  }
  try {
    await t.test('protected routes reject anonymous access and login rejects wrong credentials', async () => {
      assert.equal((await request('/api/admin/overview', 'GET', undefined, false)).response.status, 401);
      assert.equal((await request('/api/auth/login', 'POST', { email: 'owner@example.com', password: 'wrong' }, false)).response.status, 401);
      const login = await request('/api/auth/login', 'POST', { email: 'owner@example.com', password: 'a-long-test-password-47' }, false);
      assert.equal(login.response.status, 200);
      assert.match(login.response.headers.get('set-cookie'), /HttpOnly/);
      cookie = login.response.headers.get('set-cookie').split(';')[0]; csrf = login.value.csrf;
      assert.equal((await request('/api/auth/session')).value.user.email, 'owner@example.com');
    });
    await t.test('CSRF and origin protection guard mutations', async () => {
      assert.equal((await request('/api/admin/products/hibiscus', 'PATCH', { price: 110 }, true, { 'X-CSRF-Token': '' })).response.status, 403);
      assert.equal((await request('/api/admin/products/hibiscus', 'PATCH', { price: 110 }, true, { Origin: 'https://evil.example' })).response.status, 403);
    });
    await t.test('product edits persist, invalid input is rejected and public data excludes internals', async () => {
      assert.equal((await request('/api/admin/products/hibiscus', 'PATCH', { price: -1 })).response.status, 400);
      assert.equal((await request('/api/admin/products/hibiscus', 'PATCH', { price: 110, stock: 3 })).response.status, 200);
      const catalogue = (await request('/api/catalogue', 'GET', undefined, false)).value;
      assert.equal(catalogue.products.find(p => p.slug === 'hibiscus').price, 110);
      assert.equal(catalogue.products.find(p => p.slug === 'hibiscus').available, true);
      assert.equal(catalogue.products.find(p => p.slug === 'hibiscus').stock, undefined);
    });
    let order;
    const payload = { items: [{ slug: 'hibiscus', quantity: 2, price: 1 }], details, method: 'courier', expectedTotal: 29500 };
    await t.test('orders recalculate totals, protect idempotency, reserve stock, and reject overselling', async () => {
      const created = await request('/api/orders', 'POST', payload, false, { 'Idempotency-Key': 'test-request-idempotency-123' });
      assert.equal(created.response.status, 201, JSON.stringify(created.value)); order = created.value;
      assert.equal(order.total, 29500); assert.match(order.reference, /^HH-/);
      const duplicate = await request('/api/orders', 'POST', payload, false, { 'Idempotency-Key': 'test-request-idempotency-123' });
      assert.equal(duplicate.value.reference, order.reference);
      assert.equal((await request('/api/orders', 'POST', { ...payload, items: [{ slug: 'hibiscus', quantity: 1 }] }, false, { 'Idempotency-Key': 'test-request-idempotency-123' })).response.status, 409);
      assert.equal((await request('/api/orders', 'POST', payload, false, { 'Idempotency-Key': 'test-request-oversell-123' })).response.status, 409);
      assert.equal((await request('/api/orders', 'POST', { ...payload, items: [{ slug: 'unknown', quantity: 1 }] }, false, { 'Idempotency-Key': 'test-request-unknown-1234' })).response.status, 400);
      assert.equal((await request('/api/orders', 'POST', { details, method: 'courier' }, false, { 'Idempotency-Key': 'test-malformed-body-1234' })).response.status, 400);
      assert.equal((await request('/api/orders', 'POST', { ...payload, details: { ...details, name: { bad: 'type' } } }, false, { 'Idempotency-Key': 'test-malformed-name-1234' })).response.status, 400);
      assert.equal((await request('/api/orders', 'POST', { ...payload, items: [{ slug: 'collagen', quantity: 1 }], expectedTotal: 1 }, false, { 'Idempotency-Key': 'test-request-price-12345' })).response.status, 409);
    });
    await t.test('cancellation restores reserved stock only once and data survives reopen', async () => {
      const orders = (await request('/api/admin/orders')).value;
      assert.equal(orders.length, 1);
      assert.equal((await request(`/api/admin/orders/${order.id}`, 'PATCH', { status: 'cancelled', notes: 'Customer requested cancellation.' })).response.status, 200);
      assert.equal((await request(`/api/admin/orders/${order.id}`, 'PATCH', { status: 'cancelled' })).response.status, 200);
      assert.equal((await request('/api/admin/products')).value.find(p => p.slug === 'hibiscus').stock, 3);
      assert.equal((await request(`/api/admin/orders/${order.id}`, 'PATCH', { status: 'confirmed' })).response.status, 409);
      assert.equal((await request('/api/admin/customers')).value.length, 1);
    });
    await t.test('inbox accepts private attachments and rejects disguised files', async () => {
      const form = new FormData();
      for (const [key, value] of Object.entries({ name: 'Ada', surname: 'Test', email: 'ada@example.com', phone: '0821234567', message: 'Please tell me about the ingredients.' })) form.set(key, value);
      form.append('files', new Blob(['a little question'], { type: 'text/plain' }), 'question.txt');
      const sent = await request('/api/enquiries', 'POST', form, false);
      assert.equal(sent.response.status, 201, JSON.stringify(sent.value));
      const enquiry = (await request('/api/admin/enquiries')).value[0];
      assert.equal(enquiry.attachments.length, 1);
      assert.equal((await request(`/api/admin/attachments/${enquiry.attachments[0].id}`, 'GET', undefined, false)).response.status, 401);
      assert.equal((await request(`/api/admin/attachments/${enquiry.attachments[0].id}`)).value, 'a little question');
      assert.equal((await request(`/api/admin/enquiries/${enquiry.id}`, 'PATCH', { status: 'resolved', notes: 'Handled by phone.' })).response.status, 200);
      const bad = new FormData();
      for (const [key, value] of form.entries()) if (typeof value === 'string') bad.set(key, value);
      bad.append('files', new Blob(['<script>bad</script>'], { type: 'image/png' }), 'fake.png');
      assert.equal((await request('/api/enquiries', 'POST', bad, false)).response.status, 400);
    });
    await t.test('settings are validated and overview/activity reflect real records', async () => {
      assert.equal((await request('/api/admin/settings', 'PATCH', { courierFee: -1 })).response.status, 400);
      assert.equal((await request('/api/admin/settings', 'PATCH', { courierFee: 8500, freeDelivery: 70000, businessName: 'Herby Health' })).response.status, 200);
      assert.equal((await request('/api/catalogue', 'GET', undefined, false)).value.settings.courierFee, 8500);
      const overview = (await request('/api/admin/overview')).value;
      assert.equal(overview.totalOrders, 1); assert.equal(overview.paidRevenue, 0);
      assert.ok((await request('/api/admin/activity')).value.length >= 4);
      assert.equal((await request('/api/auth/logout', 'POST', {})).response.status, 200);
      assert.equal((await request('/api/admin/overview')).response.status, 401);
    });
  } finally { await new Promise(resolve => server.close(resolve)); db.close(); }
  const reopened = await createApp({ dataDir: directory, origin: 'http://localhost:5174' });
  assert.equal(reopened.db.prepare('SELECT COUNT(*) AS count FROM orders').get().count, 1);
  reopened.db.close();
  await promisify(execFile)(process.execPath, ['server/backup.mjs'], { env: { ...process.env, DATA_DIR: directory } });
  const backups = await readdir(join(directory, 'backups'));
  const backupDb = new DatabaseSync(join(directory, 'backups', backups[0], 'herby.sqlite'));
  assert.equal(backupDb.prepare('SELECT COUNT(*) AS count FROM orders').get().count, 1);
  assert.equal(backupDb.prepare('SELECT COUNT(*) AS count FROM attachments').get().count, 1);
  const backedFiles = await readdir(join(directory, 'backups', backups[0], 'uploads')); assert.equal(backedFiles.length, 1);
  backupDb.close(); await rm(directory, { recursive: true, force: true });
});
