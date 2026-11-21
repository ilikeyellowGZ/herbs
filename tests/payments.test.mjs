import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { openDatabase, mapOrder } from '../server/database.mjs';
import { placeOrder, updateOrder } from '../server/commerce.mjs';
import { createPayments } from '../server/payments.mjs';
import { integrationConfig } from '../server/providers.mjs';

const details = { name: 'Ada Lovelace', email: 'ada@example.com', phone: '0821234567', address: '12 Garden Road', city: 'Pretoria', province: 'Gauteng', postalCode: '0002', notes: '' };
async function fixture(callback) {
  const directory = await mkdtemp(join(tmpdir(), 'herby-payment-')), db = openDatabase(directory);
  const key = randomUUID(), order = placeOrder(db, { details, method: 'courier', items: [{ slug: 'hibiscus', quantity: 2 }], expectedTotal: 26500 }, key);
  const events = new Map();
  let result = {}, calls = [];
  const notifications = { enqueue: (type, payload, options) => events.set(options.key, { type, payload }) };
  const providers = { paystack: async (path, body) => { calls.push({ path, body }); return path === 'transaction/initialize' ? { reference: body.reference, authorization_url: `https://checkout.paystack.com/testcode` } : result; } };
  const config = integrationConfig('https://herby.example.com', { paystackKey: 'sk_test_unit' });
  const service = createPayments(db, config, providers, notifications);
  try { await callback({ db, key, order, events, calls, service, config, providers, notifications, setResult: value => { result = value; } }); }
  finally { db.close(); await rm(directory, { recursive: true, force: true }); }
}

test('initialisation uses saved cents, opaque access and one stable reference on retries', async () => fixture(async ({ service, order, key, calls }) => {
  const token = service.access(order.id, key);
  assert.equal(service.access(order.id, key), token);
  await assert.rejects(() => service.initialise(order.id, 'forged'), /access/i);
  const result = await service.initialise(order.id, token);
  assert.equal(result.authorizationUrl, 'https://checkout.paystack.com/testcode');
  assert.equal(calls[0].body.amount, 26500);
  assert.equal(calls[0].body.currency, 'ZAR');
  assert.equal(calls[0].body.email, 'ada@example.com');
  assert.equal(calls[0].body.callback_url, 'https://herby.example.com/checkout/payment');
  assert.equal((await service.initialise(order.id, token)).reference, result.reference);
  assert.equal(calls.length, 1);
}));

test('failed or unsafe initialization keeps one order and reference across concurrent retries', async () => fixture(async ({ db, key, order, service, providers }) => {
  const token = service.access(order.id, key);
  const references = [];
  let checkoutUrl = 'https://checkout.paystack.com.example.org/checkout';
  providers.paystack = async (path, request) => {
    references.push(request.reference);
    return { reference: request.reference, authorization_url: checkoutUrl };
  };
  await assert.rejects(service.initialise(order.id, token));
  assert.equal(db.prepare('SELECT count(*) AS n FROM orders').get().n, 1);
  checkoutUrl = 'https://checkout.paystack.com/session';
  const attempts = await Promise.all([service.initialise(order.id, token), service.initialise(order.id, token)]);
  assert.equal(new Set(references).size, 1);
  assert.equal(references.length, 2);
  assert.equal(attempts[0].authorizationUrl, checkoutUrl);
  assert.deepEqual(attempts[0], attempts[1]);
}));

test('access survives restart, binds order creation key and fails before sending provider requests', async () => fixture(async ({ db, key, order, service, config, providers, notifications, calls }) => {
  assert.throws(() => service.access(order.id, randomUUID()), { status: 403 });
  const token = service.access(order.id, key);
  const stored = db.prepare('SELECT token_hash FROM order_access WHERE order_id=?').get(order.id);
  assert.notEqual(stored.token_hash, token);
  const restart = createPayments(db, config, providers, notifications);
  assert.equal(restart.authorise(order.id, token).details.email, 'ada@example.com');
  assert.equal(restart.access(order.id, key), token);
  const attempt = await restart.initialise(order.id, token);
  await assert.rejects(restart.verify(attempt.reference, 'invalid'), { status: 403 });
  await assert.rejects(restart.verify('unknown', token), { status: 403 });
  updateOrder(db, order.id, { status: 'cancelled' }, 'tester');
  await assert.rejects(restart.initialise(order.id, token), { status: 409 });
  assert.equal(calls.length, 1);
}));

test('refund webhook reconciles independent equal partial refunds by ID even without ID in event', async () => fixture(async ({ db, key, order, service, setResult, calls, events }) => {
  const token = service.access(order.id, key);
  const { reference } = await service.initialise(order.id, token);
  service.settle({ id: 728, status: 'success', reference, domain: 'test', amount: 26500, currency: 'ZAR', customer: { email: details.email } });
  const record = { id: 75, transaction: 728, domain: 'test', currency: 'ZAR', amount: 5000, status: 'processed' };
  setResult([record, { ...record, id: 76 }]);
  const signal = { event: 'refund.processed', data: { transaction_reference: reference, refund_reference: null, amount: '5000', currency: 'ZAR', domain: 'test' } };
  await service.webhook(signal);
  await service.webhook(signal);
  assert.equal(calls[1].path, 'refund?transaction=728&perPage=100&page=1');
  assert.equal(db.prepare('SELECT refunded FROM payment_attempts').get().refunded, 10000);
  assert.equal([...events.values()].filter(event => event.type === 'refund-received').length, 2);
  setResult({ ...record, status: 'failed' });
  await service.webhook({ event: 'refund.failed', data: { id: 75 } });
  assert.equal(calls.at(-1).path, 'refund/75');
  assert.equal(db.prepare('SELECT refunded FROM payment_attempts').get().refunded, 10000);
  assert.ok(![...events.values()].some(event => event.type === 'refund-failed'));
  assert.throws(() => service.refund({ ...record, id: 77, amount: 22000 }));
  assert.equal(db.prepare('SELECT count(*) AS n FROM refund_events').get().n, 2);
}));

test('verification checks amount, currency, payer and mode; callbacks cannot forge success', async () => fixture(async ({ service, order, key, db, setResult, events }) => {
  const token = service.access(order.id, key), attempt = await service.initialise(order.id, token);
  const valid = { status: 'success', reference: attempt.reference, amount: 26500, currency: 'ZAR', domain: 'test', customer: { email: 'ada@example.com' }, id: 10001 };
  for (const bad of [{ amount: 1 }, { currency: 'NGN' }, { domain: 'live' }, { customer: { email: 'other@example.com' } }, { reference: 'other' }]) {
    setResult({ ...valid, ...bad });
    await assert.rejects(() => service.verify(attempt.reference, token), /match|verify/i);
    assert.equal(db.prepare('SELECT payment FROM orders WHERE id=?').get(order.id).payment, 'unpaid');
  }
  setResult(valid);
  assert.equal((await service.verify(attempt.reference, token)).payment, 'paid');
  assert.equal((await service.verify(attempt.reference, token)).payment, 'paid');
  assert.equal(db.prepare('SELECT status FROM orders WHERE id=?').get(order.id).status, 'confirmed');
  assert.equal([...events.values()].filter(e => e.type === 'payment-received').length, 1);
  assert.equal([...events.values()].filter(e => e.type === 'invoice').length, 1);
  service.settle({ ...valid, status: 'failed' });
  assert.equal(db.prepare('SELECT payment FROM orders WHERE id=?').get(order.id).payment, 'paid');
}));

test('late successful payment on a cancelled order alerts owner without reopening or changing stock', async () => fixture(async ({ service, order, key, db, events }) => {
  const token = service.access(order.id, key), attempt = await service.initialise(order.id, token);
  updateOrder(db, order.id, { status: 'cancelled' }, 'owner@example.com');
  service.settle({ status: 'success', reference: attempt.reference, amount: 26500, currency: 'ZAR', domain: 'test', customer: { email: 'ada@example.com' }, id: 10002 });
  const updated = mapOrder(db.prepare('SELECT * FROM orders WHERE id=?').get(order.id));
  assert.equal(updated.status, 'cancelled');
  assert.equal(updated.payment, 'paid');
  assert.ok([...events.values()].some(e => e.type === 'owner-alert'));
}));

test('refund notifications are idempotent, partial-aware and never claim a refund from cancellation', async () => fixture(async ({ service, order, key, db, events }) => {
  const token = service.access(order.id, key), attempt = await service.initialise(order.id, token);
  service.settle({ status: 'success', reference: attempt.reference, amount: 26500, currency: 'ZAR', domain: 'test', customer: { email: 'ada@example.com' }, id: 10003 });
  service.refund({ id: 1, status: 'processed', amount: 6500, currency: 'ZAR', domain: 'test', transaction: { reference: attempt.reference } });
  assert.equal(db.prepare('SELECT payment FROM orders WHERE id=?').get(order.id).payment, 'paid');
  service.refund({ id: 1, status: 'processed', amount: 6500, currency: 'ZAR', domain: 'test', transaction: { reference: attempt.reference } });
  service.refund({ id: 2, status: 'processed', amount: 20000, currency: 'ZAR', domain: 'test', transaction: { reference: attempt.reference } });
  assert.equal(db.prepare('SELECT payment FROM orders WHERE id=?').get(order.id).payment, 'refunded');
  assert.equal([...events.values()].filter(e => e.type === 'refund-received').length, 2);
}));

test('a refund signal retries until the provider list reflects the processed state', async () => fixture(async ({ service, order, key, db, setResult }) => {
  const token = service.access(order.id, key), { reference } = await service.initialise(order.id, token);
  service.settle({ id: 500, status: 'success', reference, domain: 'test', amount: 26500, currency: 'ZAR', customer: { email: details.email } });
  const record = { id: 401, transaction: 500, amount: 26500, currency: 'ZAR', domain: 'test' };
  const signal = { event: 'refund.processed', data: { transaction_reference: reference, amount: '26500', currency: 'ZAR', domain: 'test' } };
  setResult([{ ...record, status: 'pending' }]);
  await assert.rejects(service.webhook(signal), { status: 503 });
  setResult([{ ...record, status: 'processed' }]);
  await service.webhook(signal);
  assert.equal(db.prepare('SELECT payment FROM orders').get().payment, 'refunded');
}));

test('an ambiguous equal partial refund is reconciled later without needing another webhook', async () => fixture(async ({ service, order, key, db, setResult, events }) => {
  const token = service.access(order.id, key), { reference } = await service.initialise(order.id, token);
  service.settle({ id: 600, status: 'success', reference, domain: 'test', amount: 26500, currency: 'ZAR', customer: { email: details.email } });
  const first = { id: 501, transaction: 600, amount: 5000, currency: 'ZAR', domain: 'test', status: 'processed' };
  const signal = { event: 'refund.processed', data: { transaction_reference: reference, refund_reference: null, amount: '5000', currency: 'ZAR', domain: 'test' } };
  setResult([first]); await service.webhook(signal);
  await service.webhook(signal); // The second refund is still absent from the provider list.
  assert.equal(db.prepare('SELECT refunded FROM payment_attempts').get().refunded, 5000);
  setResult([first, { ...first, id: 502 }]);
  await service.processRefunds({ now: Date.now() + 61000 });
  assert.equal(db.prepare('SELECT refunded FROM payment_attempts').get().refunded, 10000);
  assert.equal([...events.values()].filter(event => event.type === 'refund-received').length, 2);
}));

test('access uses the imported database secret after host setup', async () => fixture(async ({ service, order, key, db, config, providers, notifications }) => {
  db.prepare("UPDATE integration_secrets SET value=? WHERE name='payment-access'").run('ba'.repeat(32));
  const token = service.access(order.id, key);
  const restart = createPayments(db, config, providers, notifications);
  assert.equal(restart.access(order.id, key), token);
  assert.equal(restart.authorise(order.id, token).id, order.id);
}));

test('unconfigured Paystack leaves request-only orders available for manual recording', async () => fixture(async ({ service, order, key, db, calls, config }) => {
  config.paystackEnabled = false;
  const token = service.access(order.id, key);
  await assert.rejects(service.initialise(order.id, token), { status: 503 });
  assert.equal(calls.length, 0);
  assert.equal(db.prepare('SELECT count(*) AS n FROM payment_attempts').get().n, 0);
  assert.equal(updateOrder(db, order.id, { payment: 'paid' }, 'Owner').payment, 'paid');
}));

test('payment and outbox event commit together and a replay recovers a rolled-back settlement', async () => fixture(async ({ db, service, order, key, notifications, events }) => {
  const { reference } = await service.initialise(order.id, service.access(order.id, key));
  const event = { event: 'charge.success', data: { status: 'success', reference, amount: 26500, currency: 'ZAR', domain: 'test', customer: { email: details.email }, id: 7383 } };
  const enqueue = notifications.enqueue;
  notifications.enqueue = () => { throw new Error('simulated storage failure'); };
  await assert.rejects(service.webhook(event), /storage/);
  assert.equal(db.prepare('SELECT payment FROM orders').get().payment, 'unpaid');
  assert.equal(db.prepare('SELECT count(*) AS n FROM payment_events').get().n, 0);
  notifications.enqueue = enqueue;
  await service.webhook(event);
  await service.webhook(event);
  assert.equal(db.prepare('SELECT payment FROM orders').get().payment, 'paid');
  assert.equal(db.prepare('SELECT count(*) AS n FROM payment_events').get().n, 1);
  assert.deepEqual([...events.keys()].sort(), ['invoice/' + order.id, 'owner-payment/' + order.id, 'payment-received/' + order.id].sort());
}));
