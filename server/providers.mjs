import { createHmac, timingSafeEqual } from 'node:crypto';
import { ApiError } from './validation.mjs';

const constantEqual = (expected, actual) => expected.length === actual.length && timingSafeEqual(expected, actual);
export function verifyPaystackSignature(body, headers, config, now = Math.floor(Date.now() / 1000)) {
  if (!Buffer.isBuffer(body)) return false;
  if (config.paystackWebhookSecret) {
    const header = headers['paystack-signature'];
    if (typeof header !== 'string' || header.length > 4096) return false;
    let timestamp;
    const signatures = [];
    for (const part of header.split(',')) {
      const index = part.indexOf('='), key = part.slice(0, index).trim(), value = part.slice(index + 1).trim();
      if (key === 't') { if (timestamp !== undefined || !/^\d+$/.test(value)) return false; timestamp = Number(value); }
      if (key === 'v1') signatures.push(value.slice(value.indexOf(':') + 1));
    }
    if (!Number.isSafeInteger(timestamp) || Math.abs(now - timestamp) > 300) return false;
    const expected = createHmac('sha512', config.paystackWebhookSecret).update(`${timestamp}.`).update(body).digest();
    return signatures.some(value => /^[a-f0-9]{128}$/.test(value) && constantEqual(expected, Buffer.from(value, 'hex')));
  }
  const signature = headers['x-paystack-signature'];
  if (!config.paystackKey || typeof signature !== 'string' || !/^[a-f0-9]{128}$/.test(signature)) return false;
  return constantEqual(createHmac('sha512', config.paystackKey).update(body).digest(), Buffer.from(signature, 'hex'));
}

export function verifyResendSignature(body, headers, secret, now = Math.floor(Date.now() / 1000)) {
  const id = headers['svix-id'], timestamp = headers['svix-timestamp'], signature = headers['svix-signature'];
  if (!Buffer.isBuffer(body) || typeof secret !== 'string' || !/^whsec_[A-Za-z0-9+/=]+$/.test(secret) || typeof id !== 'string' || !id || id.length > 200 || typeof timestamp !== 'string' || !/^\d+$/.test(timestamp) || typeof signature !== 'string' || signature.length > 4096) return false;
  if (!Number.isSafeInteger(Number(timestamp)) || Math.abs(now - Number(timestamp)) > 300) return false;
  const expected = createHmac('sha256', Buffer.from(secret.slice(6), 'base64')).update(`${id}.${timestamp}.`).update(body).digest();
  return signature.split(' ').some(value => {
    if (!/^v1,[A-Za-z0-9+/]+={0,2}$/.test(value)) return false;
    return constantEqual(expected, Buffer.from(value.slice(3), 'base64'));
  });
}

export function mailbox(value) {
  if (typeof value !== 'string' || value.length > 320 || /[\r\n]/.test(value)) return '';
  const address = value.match(/<([^<>]+)>$/)?.[1] || value;
  return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(address) ? address : '';
}

export function integrationConfig(origin, overrides = {}) {
  const config = {
    origin, paystackKey: process.env.PAYSTACK_SECRET_KEY || '', paystackWebhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET || '',
    resendKey: process.env.RESEND_API_KEY || '', resendWebhookSecret: process.env.RESEND_WEBHOOK_SECRET || '',
    emailFrom: process.env.EMAIL_FROM || '', replyTo: process.env.EMAIL_REPLY_TO || '', notifyEmail: process.env.NOTIFICATION_EMAIL || '',
    ...overrides,
  };
  config.paystackEnabled = /^sk_(test|live)_[A-Za-z0-9_-]+$/.test(config.paystackKey);
  config.paystackMode = config.paystackKey.startsWith('sk_live_') ? 'live' : 'test';
  config.emailEnabled = Boolean(config.resendKey && mailbox(config.emailFrom));
  return config;
}

export function createProviders(config) {
  const request = config.fetch || globalThis.fetch;
  async function call(url, key, body, headers = {}, service = 'Payment') {
    if (!key) throw new ApiError(503, `${service} service is not configured yet.`);
    let response, result;
    try {
      response = await request(url, { method: body === undefined ? 'GET' : 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...headers }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(12000), redirect: 'error' });
      result = await response.json();
    } catch { throw new ApiError(502, `${service} service did not respond. Please try again shortly.`); }
    if (!response.ok || (service === 'Payment' ? result.status !== true : !result.id)) {
      const error = new ApiError(502, `${service} service could not complete the request. Please try again shortly.`);
      error.providerStatus = response.status;
      throw error;
    }
    return service === 'Payment' ? result.data : result;
  }
  return {
    paystack: (path, body) => {
      if (!/^(transaction\/(initialize|verify\/[A-Za-z0-9.=-]+)|refund\/[0-9]+|refund\?transaction=[1-9]\d*&perPage=100&page=[1-9]\d*)$/.test(path)) throw new Error('Unexpected Paystack endpoint');
      return call(`https://api.paystack.co/${path}`, config.paystackKey, body);
    },
    resend: (body, key) => call('https://api.resend.com/emails', config.resendKey, body, { 'Idempotency-Key': key }, 'Email'),
  };
}
