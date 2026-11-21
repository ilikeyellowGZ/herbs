import test from 'node:test';
import assert from 'node:assert/strict';
import { readPaymentSession, savePaymentSession, paystackUrl } from '../src/lib/payment-session.ts';
import { orderSubmissionKey, clearOrderSubmission } from '../src/lib/order-submission.ts';

test('payment recovery retains the server opaque token across a simulated reload and rejects malformed storage', () => {
  let stored = null;
  globalThis.window = {};
  globalThis.sessionStorage = { getItem: () => stored, setItem: (_key, value) => { stored = value; } };
  const session = { orderId: 'order-123', token: 'a'.repeat(43), orderReference: 'HH-123', total: 26500, mode: 'test', reference: 'HH-P-order-123' };
  savePaymentSession(session);
  assert.deepEqual(readPaymentSession(), session);
  stored = JSON.stringify({ ...session, token: 'invalid' });
  assert.equal(readPaymentSession(), null);
  assert.equal(paystackUrl('https://checkout.paystack.com/example'), 'https://checkout.paystack.com/example');
  for (const url of ['https://checkout.paystack.com.evil.test/example', 'http://checkout.paystack.com/example', 'https://user:pass@checkout.paystack.com/example']) assert.throws(() => paystackUrl(url));
  delete globalThis.window; delete globalThis.sessionStorage;
});

test('settlement clears only its matching submission key and allows a second identical purchase', async () => {
  const values = new Map();
  globalThis.sessionStorage = { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  const first = await orderSubmissionKey({ purchase: 'first' });
  clearOrderSubmission(first);
  assert.notEqual(await orderSubmissionKey({ purchase: 'first' }), first);
  const newer = await orderSubmissionKey({ purchase: 'newer' });
  clearOrderSubmission(first);
  assert.equal(await orderSubmissionKey({ purchase: 'newer' }), newer);
  clearOrderSubmission(); delete globalThis.sessionStorage;
});
