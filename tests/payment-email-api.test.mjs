import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createApp } from '../server/app.mjs';

test('checkout, signed payment callbacks, durable emails and owner enquiry replies connect end to end', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'herby-integrations-'));
  const origin = 'https://shop.example.com', webhookSecret = 'whsec_paystack_test';
  const resendSecret = `whsec_${Buffer.from('test resend endpoint secret').toString('base64')}`;
  const transactions = new Map(), sent = [];
  const created = await createApp({ dataDir: directory, origin, production: true, adminEmail: 'owner@example.com', adminPassword: 'test-owner-password-123', integrations: {
    paystackKey: 'sk_test_private', paystackWebhookSecret: webhookSecret, resendKey: 're_private', resendWebhookSecret: resendSecret, emailFrom: 'Herby Health <orders@example.com>', replyTo: 'hello@example.com', notifyEmail: 'owner@example.com',
    fetch: async (url, options) => {
      if (url === 'https://api.resend.com/emails') { sent.push({ ...JSON.parse(options.body), key: options.headers['Idempotency-Key'] }); return new Response(JSON.stringify({ id: `email_${sent.length}` }), { status: 200 }); }
      if (url.endsWith('/transaction/initialize')) {
        const body = JSON.parse(options.body);
        transactions.set(body.reference, { reference: body.reference, amount: body.amount, currency: body.currency, customer: { email: body.email }, domain: 'test', status: 'success', id: 123456 });
        return new Response(JSON.stringify({ status: true, data: { reference: body.reference, authorization_url: 'https://checkout.paystack.com/test' } }), { status: 200 });
      }
      const reference = url.split('/').pop();
      return new Response(JSON.stringify({ status: true, data: transactions.get(reference) }), { status: 200 });
    },
  } });
  const { app, db, notifications } = created, server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  let cookie = '', csrf = '';
  async function request(path, body, owner = false, headers = {}, method = body === undefined ? 'GET' : 'POST') {
    const response = await fetch(base + '/api' + path, { method, headers: { Origin: origin, ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}), ...(owner ? { Cookie: cookie, 'X-CSRF-Token': csrf } : {}), ...headers }, body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body) });
    return { response, value: response.headers.get('content-type')?.includes('application/json') ? await response.json() : await response.text() };
  }
  try {
    const details = { name: 'Ada Lovelace', email: 'ada@example.com', phone: '0821234567', address: '12 Garden Road', city: 'Pretoria', province: 'Gauteng', postalCode: '0002', notes: '' };
    const body = { details, method: 'courier', items: [{ slug: 'hibiscus', quantity: 2 }], expectedTotal: 26500 }, key = randomUUID();
    const order = await request('/orders', body, false, { 'Idempotency-Key': key });
    assert.equal(order.response.status, 201); assert.equal(order.value.paymentReady, true);
    assert.equal((await request('/orders', body, false, { 'Idempotency-Key': key })).value.paymentToken, order.value.paymentToken);
    const initial = await request('/payments/initialize', { orderId: order.value.id, token: order.value.paymentToken });
    assert.equal(initial.response.status, 200);
    const reference = initial.value.reference;
    const localStatus = await request('/payments/status', { orderId: order.value.id, token: order.value.paymentToken });
    assert.equal(localStatus.value.reference, reference);
    assert.equal(localStatus.value.payment, 'unpaid');
    assert.equal((await request('/payments/verify', { reference, token: 'forged-token-that-is-long-enough-1234' })).response.status, 403);
    const payload = JSON.stringify({ event: 'charge.success', data: transactions.get(reference) });
    const timestamp = Math.floor(Date.now() / 1000), signature = `t=${timestamp},v1=whk_test:${createHmac('sha512', webhookSecret).update(`${timestamp}.`).update(payload).digest('hex')}`;
    const webhook = headers => fetch(base + '/api/webhooks/paystack', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: payload });
    assert.equal((await webhook({ 'paystack-signature': 'forged' })).status, 401);
    assert.equal((await webhook({ 'paystack-signature': signature })).status, 200);
    assert.equal((await webhook({ 'paystack-signature': signature })).status, 200);
    const verified = await request('/payments/verify', { reference, token: order.value.paymentToken });
    assert.equal(verified.value.payment, 'paid');
    assert.equal(db.prepare("SELECT COUNT(*) AS count FROM email_outbox WHERE type='payment-received'").get().count, 1);
    assert.equal(db.prepare("SELECT COUNT(*) AS count FROM email_outbox WHERE type='invoice'").get().count, 1);
    assert.equal((await request('/payments/invoice', { orderId: order.value.id, token: order.value.paymentToken })).response.status, 200);
    assert.equal((await request('/admin/notifications')).response.status, 401);
    assert.equal((await request(`/admin/orders/${order.value.id}/invoice`)).response.status, 401);
    const login = await request('/auth/login', { email: 'owner@example.com', password: 'test-owner-password-123' });
    cookie = login.response.headers.get('set-cookie').split(';')[0]; csrf = login.value.csrf;
    assert.equal((await request(`/admin/orders/${order.value.id}`, { payment: 'unpaid' }, true, {}, 'PATCH')).response.status, 409);
    const form = new FormData();
    for (const [field, value] of Object.entries({ name: 'Ada', surname: 'Lovelace', email: 'ada@example.com', phone: '0821234567', message: 'A private enquiry about the ingredient.' })) form.set(field, value);
    assert.equal((await request('/enquiries', form)).response.status, 201);
    const enquiry = db.prepare('SELECT id FROM enquiries').get(), replyKey = randomUUID();
    assert.equal((await request(`/admin/enquiries/${enquiry.id}/replies`, { message: 'A considered reply.' }, false, { 'Idempotency-Key': replyKey })).response.status, 401);
    const reply = await request(`/admin/enquiries/${enquiry.id}/replies`, { message: 'A considered reply.' }, true, { 'Idempotency-Key': replyKey });
    assert.equal(reply.response.status, 201);
    assert.equal((await request(`/admin/enquiries/${enquiry.id}/replies`, { message: 'A considered reply.' }, true, { 'Idempotency-Key': replyKey })).response.status, 200);
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM enquiry_replies').get().count, 1);
    await notifications.process({ limit: 20 });
    assert.ok(sent.some(message => message.to[0] === 'owner@example.com'));
    assert.ok(sent.some(message => message.subject.includes('Invoice') || message.subject.includes('invoice')));
    assert.ok(sent.some(message => message.text.includes('A considered reply.')));
    const acknowledgement = sent.find(message => message.subject.includes('Enquiry received'));
    assert.ok(acknowledgement);
    assert.equal(acknowledgement.text.includes('private enquiry'), false);
    const messageId = db.prepare("SELECT provider_id FROM email_outbox WHERE type='payment-received'").get().provider_id;
    const deliveryPayload = JSON.stringify({ type: 'email.delivered', created_at: new Date().toISOString(), data: { email_id: messageId } });
    const eventId = 'msg_integration_test', resendSignature = createHmac('sha256', Buffer.from(resendSecret.slice(6), 'base64')).update(`${eventId}.${timestamp}.`).update(deliveryPayload).digest('base64');
    const delivered = await fetch(base + '/api/webhooks/resend', { method: 'POST', headers: { 'Content-Type': 'application/json', 'svix-id': eventId, 'svix-timestamp': String(timestamp), 'svix-signature': `v1,${resendSignature}` }, body: deliveryPayload });
    assert.equal(delivered.status, 200);
    assert.equal(db.prepare("SELECT delivery_state FROM email_outbox WHERE type='payment-received'").get().delivery_state, 'delivered');
    const log = await request('/admin/notifications', undefined, true);
    assert.equal(log.value.readiness.emailEnabled, true); assert.equal(log.value.templates.length, 16);
    assert.ok(!JSON.stringify(log.value).includes('sk_test_private') && !JSON.stringify(log.value).includes('re_private'));
    const publicData = await request('/catalogue');
    assert.equal(publicData.value.integrations.paymentsEnabled, true);
    assert.equal(JSON.stringify(publicData.value).includes('owner@example.com'), false);
  } finally { await new Promise(resolve => server.close(resolve)); await notifications.stop(); db.close(); await rm(directory, { recursive: true, force: true }); }
});
