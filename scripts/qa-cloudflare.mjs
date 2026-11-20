import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { initializeDatabase } from '../server/database.mjs';
import { createOwner } from '../server/auth.mjs';
import { snapshotDatabase } from '../cloudflare/snapshot.mjs';

const base = process.env.CF_QA_URL || 'http://localhost:8787';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Commerce QA must use an isolated local Worker, never the live store.');
const email = 'cloudflare-test@example.com', password = 'cloudflare-local-test-password-123';
let cookie = '', csrf = '';
async function request(path, { method = 'GET', body, authenticated = true, headers = {} } = {}) {
  const response = await fetch(base + path, { method,
    headers: { Origin: base, ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}), ...(authenticated ? { Cookie: cookie, 'X-CSRF-Token': csrf } : {}), ...headers },
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });
  const data = response.headers.get('content-type')?.includes('application/json') ? await response.json() : Buffer.from(await response.arrayBuffer());
  return { response, data };
}

assert.equal((await request('/__setup/import', { method: 'POST', body: {} })).response.status, 404, 'Setup requires its private token');
if ((await request('/api/health')).response.status === 503) {
  const db = initializeDatabase(new DatabaseSync(':memory:'));
  await createOwner(db, email, password);
  const snapshot = await snapshotDatabase(db, '.local');
  db.close();
  const setup = await request('/__setup/import', { method: 'POST', body: snapshot, headers: { Authorization: 'Bearer local-cloudflare-test-key' } });
  assert.equal(setup.response.status, 200, JSON.stringify(setup.data));
}
const health = await request('/api/health');
assert.equal(health.response.status, 200, JSON.stringify(health.data));
assert.equal(health.response.headers.get('cache-control'), 'no-store');
assert.equal(health.response.headers.get('x-content-type-options'), 'nosniff');
assert.equal((await request('/api/admin/overview', { authenticated: false })).response.status, 401);
const login = await request('/api/auth/login', { method: 'POST', body: { email, password }, authenticated: false });
assert.equal(login.response.status, 200, JSON.stringify(login.data));
assert.match(login.response.headers.get('set-cookie'), /HttpOnly/i);
cookie = login.response.headers.get('set-cookie').split(';')[0]; csrf = login.data.csrf;
assert.equal((await request('/api/admin/products/hibiscus', { method: 'PATCH', body: { stock: 3, price: 110 }, headers: { Origin: 'https://evil.example' } })).response.status, 403);
assert.equal((await request('/api/admin/products/hibiscus', { method: 'PATCH', body: { stock: 3, price: 110 }, headers: { 'X-CSRF-Token': '' } })).response.status, 403);
assert.equal((await request('/api/admin/products/hibiscus', { method: 'PATCH', body: { stock: 3, price: 110 } })).response.status, 200);
const orderBody = { items: [{ slug: 'hibiscus', quantity: 2 }], method: 'collection', expectedTotal: 22000,
  details: { name: 'Local QA', email: 'qa@example.com', phone: '0821234567', notes: '' } };
const orderKey = randomUUID();
const order = await request('/api/orders', { method: 'POST', body: orderBody, headers: { 'Idempotency-Key': orderKey } });
assert.equal(order.response.status, 201, JSON.stringify(order.data));
assert.equal((await request('/api/orders', { method: 'POST', body: orderBody, headers: { 'Idempotency-Key': orderKey } })).data.reference, order.data.reference);
assert.equal((await request('/api/orders', { method: 'POST', body: orderBody, headers: { 'Idempotency-Key': randomUUID() } })).response.status, 409);
assert.equal((await request(`/api/admin/orders/${order.data.id}`, { method: 'PATCH', body: { status: 'cancelled' } })).response.status, 200);
const catalogue = await request('/api/catalogue', { authenticated: false });
assert.equal(catalogue.data.products.length, 8);
assert.equal(catalogue.data.products[0].stock, undefined);
console.log('PASS Worker SQL, owner access, origin/CSRF, stock transactions and idempotency');

const content = 'a private question\n'.repeat(40000);
const form = new FormData();
for (const [key, value] of Object.entries({ name: 'Local', surname: 'QA', email: 'qa@example.com', phone: '0821234567', message: 'Checking private cloud uploads.' })) form.append(key, value);
form.append('files', new Blob([content], { type: 'text/plain' }), 'private-question.txt');
const enquiry = await request('/api/enquiries', { method: 'POST', body: form });
assert.equal(enquiry.response.status, 201, JSON.stringify(enquiry.data));
const enquiries = (await request('/api/admin/enquiries')).data;
const attachment = enquiries[0].attachments[0];
assert.equal((await request(`/api/admin/attachments/${attachment.id}`, { authenticated: false })).response.status, 401);
const download = await request(`/api/admin/attachments/${attachment.id}`);
assert.equal(download.data.toString(), content);
assert.match(download.response.headers.get('content-disposition'), /attachment/);
assert.equal(download.response.headers.get('cache-control'), 'no-store');
console.log('PASS private multi-chunk upload and authenticated download');

for (const [path, title] of [['/', 'Herby Health'], ['/collection', 'Collection'], ['/products/hibiscus', 'Hibiscus'], ['/get-help', 'Get help']]) {
  const response = await fetch(base + path);
  assert.equal(response.status, 200, path);
  assert.match(await response.text(), new RegExp(`<title>[^<]*${title}`, 'i'));
  assert.ok(response.headers.get('content-security-policy'));
}
const admin = await fetch(base + '/admin/orders');
assert.equal(admin.status, 200);
assert.equal(admin.headers.get('cache-control'), 'no-store');
assert.match(admin.headers.get('x-robots-tag'), /noindex/);
assert.equal((await fetch(base + '/missing-garden-page')).status, 404);
assert.equal((await request('/api/auth/logout', { method: 'POST', body: {} })).response.status, 200);
assert.equal((await request('/api/admin/overview')).response.status, 401);
console.log('PASS direct route HTML, admin shell, security/cache headers and sign-out');
