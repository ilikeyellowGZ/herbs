import assert from 'node:assert/strict';
import test from 'node:test';
import { emailTypes, renderEmail } from '../server/email-templates.mjs';
import * as templates from '../server/email-templates.mjs';

const types = [
  'order-received', 'invoice', 'payment-received', 'payment-failed', 'payment-pending',
  'order-confirmed', 'order-fulfilled', 'order-cancelled', 'refund-received', 'refund-failed',
  'enquiry-received', 'enquiry-reply', 'owner-order', 'owner-payment', 'owner-enquiry', 'owner-alert',
];
const order = {
  id: 'fixture', reference: 'HH-1001', createdAt: '2026-11-21T12:00:00Z', method: 'courier',
  status: 'pending', payment: 'unpaid', subtotal: 2550, shipping: 780, total: 3330,
  details: { name: 'Customer One', email: 'one@example.test', address: '12 Example St', city: 'Cape Town', postalCode: '8001' },
  items: [{ name: 'Sage & thyme', quantity: 2, price: 1275, lineTotal: 2550, packSize: '40 g', form: 'Loose leaf' }],
  notes: 'SECRET private note',
};
const enquiry = { id: 'enq', reference: 'EN-1001', name: 'Customer', surname: 'One', message: 'First question', notes: 'SECRET private note' };
const brand = { businessName: 'Herby & Health', origin: 'https://shop.example.test', email: 'hello@example.test' };
const all = { order, enquiry, message: 'A personal reply', notice: 'Check this settlement', payment: { amount: 1234, reference: 'transaction-17' } };

test('every lifecycle event has distinct, accessible HTML and a readable text alternative', () => {
  assert.deepEqual([...emailTypes].sort(), [...types].sort());
  const subjects = new Set();
  for (const type of types) {
    const { subject, html, text } = renderEmail(type, all, brand);
    subjects.add(subject);
    assert.match(html, /<html lang="en"/);
    assert.match(html, /<h1\b/);
    assert.match(html, /<table\b/);
    assert.match(html, /Herby &amp; Health/);
    assert.match(text, /Herby & Health/);
    assert.match(text, /hello@example.test/);
    assert.doesNotMatch(html + text, /undefined|\[object Object\]|SECRET private note/);
    assert.doesNotMatch(html, /<(?:script|form|iframe|img)\b|@font-face/i);
  }
  assert.equal(subjects.size, types.length);
  assert.throws(() => renderEmail('unknown', {}, brand));
  assert.throws(() => renderEmail('constructor', {}, brand));
});

test('invoice preserves the stored line, shipping and order totals and identifies recipient and status', () => {
  const invoice = renderEmail('invoice', { order }, brand);
  assert.match(invoice.subject, /INV-HH-1001/);
  for (const expected of ['INV-HH-1001', '2', 'R12.75', 'R25.50', 'R7.80', 'R33.30', 'ZAR', '40 g', 'Loose leaf', 'Customer One', 'one@example.test', '12 Example St', '8001', 'Courier delivery', 'Unpaid', '21 November 2026']) {
    assert.ok(invoice.html.includes(expected) && invoice.text.includes(expected), expected);
  }
  assert.match(invoice.html, /Sage &amp; thyme/);
  assert.match(invoice.text, /Sage & thyme/);
  const collection = renderEmail('invoice', { order: { ...order, method: 'collection', shipping: 0, total: 2550, reference: 'HH-1002' } }, brand);
  assert.match(collection.text, /INV-HH-1002/);
  assert.match(collection.text, /Gauteng collection/);
  assert.match(collection.text, /R0.00/);
  assert.doesNotMatch(collection.html + collection.text, /12 Example St|VAT|registration number/i);
});

test('enquiry replies preserve the explicit reply and line breaks, escape HTML, and omit private notes', () => {
  const payload = { enquiry: { ...enquiry, reference: 'EN-1001\r\nBcc: x' }, message: 'Hello <Jane>\nUse & enjoy.' };
  const result = renderEmail('enquiry-reply', payload, { ...brand, address: '<unsafe>', phone: '01234' });
  assert.doesNotMatch(result.subject, /[\r\n]/);
  assert.match(result.html, /Hello &lt;Jane&gt;<br\s*\/?>(?:\n)?Use &amp; enjoy\./);
  assert.match(result.text, /Hello <Jane>\nUse & enjoy\./);
  assert.match(result.html, /&lt;unsafe&gt;/);
  assert.doesNotMatch(result.html + result.text, /First question|SECRET/);
});

test('customer acknowledgement is reference-only; full enquiry is restricted to owner mail', () => {
  const secretMessage = 'Private medical question — never relay this via acknowledgement';
  const payload = { enquiry: { ...enquiry, message: secretMessage } };
  const customer = renderEmail('enquiry-received', payload, brand);
  assert.doesNotMatch(customer.html + customer.text, /Private medical question/);
  assert.ok(customer.text.includes(enquiry.reference));
  assert.match(renderEmail('owner-enquiry', payload, brand).text, /Private medical question/);
});

test('customer action links stay on the configured store origin and omit unsafe URLs', () => {
  for (const actionUrl of ['javascript:alert(1)', 'http://other.test/foo', 'https://user:pass@example.test', '//other.test', '/\\other.test', 'https:example.test', 'https://a.test/\nb', 'https://other.test/order']) {
    const message = renderEmail('order-received', { order, actionUrl }, brand);
    assert.doesNotMatch(message.html, /href=/i, actionUrl);
    assert.ok(!message.text.includes(actionUrl), actionUrl);
  }
  for (const [actionUrl, origin, expected] of [
    ['/order?id=123', brand.origin, 'https://shop.example.test/order?id=123'],
    ['https://shop.example.test/order?a=1&b=2', brand.origin, 'https://shop.example.test/order?a=1&b=2'],
    ['/order', 'http://localhost:5173', 'http://localhost:5173/order'],
  ]) {
    const message = renderEmail('order-received', { order, actionUrl }, { ...brand, origin });
    assert.ok(message.text.includes(expected));
    assert.ok(message.html.includes(expected.replace('&', '&amp;')));
  }
});

test('owner alerts display the explicit notice and owner actions always open the private dashboard without tokens', () => {
  for (const type of types.filter(type => type.startsWith('owner-'))) {
    const message = renderEmail(type, { ...all, actionUrl: 'https://external.test/path?token=SECRET' }, brand);
    const links = [...message.html.matchAll(/href="([^"]+)"/g)].map(match => new URL(match[1]));
    assert.ok(links.length);
    assert.ok(links.every(url => url.origin === brand.origin && url.pathname.startsWith('/admin')));
    assert.equal(links[0].pathname, type === 'owner-enquiry' ? '/admin/enquiries' : '/admin/orders');
    assert.doesNotMatch(message.html + message.text, /external.test|token=SECRET/);
    if (type === 'owner-alert') assert.match(message.text, /Check this settlement/);
  }
});

test('refund notices identify the amount of the refund and cancellation does not claim one', () => {
  const refund = renderEmail('refund-received', all, brand);
  assert.match(refund.text, /R12.34/);
  assert.match(refund.text, /transaction-17/);
  assert.doesNotMatch(renderEmail('order-cancelled', all, brand).text, /refund (?:has been|was|will be) (?:issued|processed)/i);
  assert.match(renderEmail('refund-failed', all, brand).text, /failed|unsuccessful/i);
});

test('links containing private tokens are omitted from customer messages', () => {
  for (const actionUrl of ['/order?token=private-value', '/order?paymentAccessToken=private-value', '/return#access_token=private-value']) {
    const { html, text } = renderEmail('order-received', { order, actionUrl }, brand);
    assert.doesNotMatch(html + text, /private-value/);
  }
});

test('owner previews cover all lifecycle events with fictional details and matching statuses', () => {
  assert.equal(typeof templates.emailPreviewPayload, 'function');
  assert.match(templates.emailPreviewBrand.email, /\.example$/);
  for (const type of types) {
    const payload = templates.emailPreviewPayload(type);
    const result = renderEmail(type, payload, templates.emailPreviewBrand);
    assert.doesNotMatch(result.html + result.text, /undefined|\[object Object\]/);
    if (type === 'payment-received') assert.equal(payload.order.payment, 'paid');
    if (type === 'order-cancelled') assert.equal(payload.order.status, 'cancelled');
    if (type === 'refund-received') assert.equal(payload.order.payment, 'refunded');
  }
});
