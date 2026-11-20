import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { verifyPaystackSignature, verifyResendSignature, createProviders } from '../server/providers.mjs';

test('Paystack rejects forged, mutated, stale and downgraded signatures', () => {
  const body = Buffer.from('{"event":"charge.success", "data":{"amount":100}}');
  const key = 'sk_test_signature', secret = 'whsec_paystack_signature', now = 1800000000;
  const legacy = createHmac('sha512', key).update(body).digest('hex');
  assert.equal(verifyPaystackSignature(body, { 'x-paystack-signature': legacy }, { paystackKey: key }, now), true);
  assert.equal(verifyPaystackSignature(Buffer.from('{}'), { 'x-paystack-signature': legacy }, { paystackKey: key }, now), false);
  assert.equal(verifyPaystackSignature(body, { 'x-paystack-signature': 'x' }, { paystackKey: key }, now), false);
  const signed = timestamp => `t=${timestamp},v1=whk_test:${createHmac('sha512', secret).update(`${timestamp}.`).update(body).digest('hex')}`;
  assert.equal(verifyPaystackSignature(body, { 'paystack-signature': signed(now) }, { paystackKey: key, paystackWebhookSecret: secret }, now), true);
  assert.equal(verifyPaystackSignature(body, { 'paystack-signature': signed(now - 301) }, { paystackKey: key, paystackWebhookSecret: secret }, now), false);
  assert.equal(verifyPaystackSignature(body, { 'x-paystack-signature': legacy }, { paystackKey: key, paystackWebhookSecret: secret }, now), false);
  assert.equal(verifyPaystackSignature(body, {}, {}, now), false);
});

test('Resend Svix signature requires raw bytes, timestamp and the endpoint signing secret', () => {
  const body = Buffer.from('{"type":"email.delivered"}'), now = 1800000000;
  const key = Buffer.from('a sufficiently long test webhook secret');
  const secret = `whsec_${key.toString('base64')}`;
  const signature = createHmac('sha256', key).update(`msg_test.${now}.`).update(body).digest('base64');
  const headers = { 'svix-id': 'msg_test', 'svix-timestamp': String(now), 'svix-signature': `v1,${signature}` };
  assert.equal(verifyResendSignature(body, headers, secret, now), true);
  assert.equal(verifyResendSignature(body, headers, secret, now + 301), false);
  assert.equal(verifyResendSignature(Buffer.from('{}'), headers, secret, now), false);
  assert.equal(verifyResendSignature(body, { ...headers, 'svix-signature': 'v1,bad' }, secret, now), false);
  assert.equal(verifyResendSignature(body, headers, '', now), false);
});

test('provider requests keep credentials server-side and verify HTTP and provider results', async () => {
  const calls = [];
  const providers = createProviders({ paystackKey: 'sk_test_key', resendKey: 're_test', fetch: async (url, options) => {
    calls.push({ url, options });
    return new Response(JSON.stringify(url.includes('paystack') ? { status: true, data: { reference: 'ref' } } : { id: 'email_123' }), { status: 200 });
  } });
  assert.deepEqual(await providers.paystack('transaction/initialize', { amount: 100 }), { reference: 'ref' });
  assert.equal(calls[0].options.headers.Authorization, 'Bearer sk_test_key');
  await providers.resend({ from: 'sender@example.com', to: ['buyer@example.com'], subject: 'Hello', html: '<p>Hello</p>' }, 'unique-event');
  assert.equal(calls[1].options.headers['Idempotency-Key'], 'unique-event');
  assert.equal(calls[1].url, 'https://api.resend.com/emails');
  const failed = createProviders({ paystackKey: 'sk_test_key', fetch: async () => new Response('{"status":false,"message":"sensitive provider details"}', { status: 200 }) });
  await assert.rejects(() => failed.paystack('transaction/initialize', {}), error => !error.message.includes('sensitive'));
});
