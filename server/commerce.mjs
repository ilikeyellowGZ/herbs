import { randomUUID } from 'node:crypto';
import { validateCheckout } from '../src/data/shopping.mjs';
import { digest } from './auth.mjs';
import { getSettings, transaction, activity, mapOrder } from './database.mjs';
import { fail, integer, object, text, email, phone } from './validation.mjs';

export function quote(db, input) {
  object(input);
  if (!['courier', 'collection'].includes(input.method)) fail('Choose courier delivery or collection.');
  const settings = getSettings(db);
  if (input.method === 'collection' && !settings.collectionEnabled) fail('Collection is currently unavailable.');
  if (!Array.isArray(input.items) || !input.items.length || input.items.length > 50) fail('Add 1–50 ingredients to your bag.');
  const combined = new Map();
  for (const line of input.items) {
    object(line); text(line.slug, 'ingredient', 1, 80); integer(line.quantity, 'quantity', 1, 99);
    const quantity = (combined.get(line.slug) || 0) + line.quantity;
    if (quantity > 99) fail('Maximum 99 per ingredient.');
    combined.set(line.slug, quantity);
  }
  const items = [...combined].map(([slug, quantity]) => {
    const product = db.prepare('SELECT * FROM products WHERE slug=?').get(slug);
    if (!product) fail('An ingredient could not be found.');
    if (!product.active || (product.stock !== null && product.stock < quantity)) fail(`${product.name} is unavailable in that quantity. Please update your bag.`, 409);
    return { slug, name: product.name, packSize: product.pack_size, form: product.form, quantity, price: product.price, lineTotal: product.price * quantity, tracked: product.stock !== null };
  });
  const subtotal = items.reduce((sum, line) => sum + line.lineTotal, 0);
  const shipping = input.method === 'collection' || subtotal >= settings.freeDelivery ? 0 : settings.courierFee;
  return { items, subtotal, shipping, total: subtotal + shipping };
}
export function placeOrder(db, input, key, onCreated) {
  object(input); object(input.details);
  if (!Array.isArray(input.items)) fail('Add ingredients to your bag.');
  text(input.details.name, 'full name', 2, 100); email(input.details.email); phone(input.details.phone);
  if (input.details.notes !== undefined) text(input.details.notes, 'note', 0, 500);
  if (input.method === 'courier') for (const key of ['address', 'city', 'province', 'postalCode']) text(input.details[key], key, 1, key === 'address' ? 200 : 100);
  text(key, 'request key', 16, 128);
  const errors = validateCheckout(input.details, input.method);
  if (Object.keys(errors).length) fail(Object.values(errors)[0]);
  const details = Object.fromEntries(['name', 'email', 'phone', 'address', 'city', 'province', 'postalCode', 'notes'].map(key => [key, typeof input.details[key] === 'string' ? input.details[key].trim() : '']));
  details.email = details.email.toLowerCase();
  const requestHash = digest(JSON.stringify({ items: input.items.map?.(i => ({ slug: i?.slug, quantity: i?.quantity })), details, method: input.method, expectedTotal: input.expectedTotal }));
  return transaction(db, () => {
    const previous = db.prepare('SELECT * FROM orders WHERE idempotency_key=?').get(key);
    if (previous) { if (previous.request_hash !== requestHash) fail('This request was already used with different details. Refresh before submitting again.', 409); return { ...publicOrder(previous), duplicate: true }; }
    const summary = quote(db, input);
    if (!Number.isSafeInteger(input.expectedTotal) || input.expectedTotal !== summary.total) fail('Prices or delivery rates have changed. Refresh the page, review your total and submit again.', 409);
    const id = randomUUID(), reference = `HH-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${randomUUID().slice(0, 8).toUpperCase()}`, now = new Date().toISOString();
    db.prepare('INSERT INTO orders (id,reference,idempotency_key,request_hash,customer,method,items,subtotal,shipping,total,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').run(id, reference, key, requestHash, JSON.stringify(details), input.method, JSON.stringify(summary.items), summary.subtotal, summary.shipping, summary.total, now, now);
    for (const item of summary.items) if (item.tracked) db.prepare('UPDATE products SET stock=stock-?,updated_at=? WHERE slug=?').run(item.quantity, now, item.slug);
    activity(db, 'Storefront', 'Received order request', reference);
    onCreated?.(mapOrder(db.prepare('SELECT * FROM orders WHERE id=?').get(id)));
    return { id, reference, total: summary.total, status: 'pending', payment: 'unpaid' };
  });
}
const publicOrder = order => ({ id: order.id, reference: order.reference, total: order.total, status: order.status, payment: order.payment });
export function updateOrder(db, id, input, actor, onChanged) {
  object(input);
  return transaction(db, () => {
    const raw = db.prepare('SELECT * FROM orders WHERE id=?').get(id);
    if (!raw) fail('Order not found.', 404);
    if (input.payment !== undefined && input.payment !== raw.payment && db.prepare('SELECT reference FROM payment_attempts WHERE order_id=?').get(id)) fail('Paystack manages this payment record. Use verified provider updates; this form does not charge or refund.', 409);
    const transitions = { pending: ['pending', 'confirmed', 'cancelled'], confirmed: ['confirmed', 'fulfilled', 'cancelled'], fulfilled: ['fulfilled'], cancelled: ['cancelled'] };
    const status = input.status ?? raw.status, payment = input.payment ?? raw.payment;
    if (!transitions[raw.status].includes(status)) fail('This order cannot move to that status.', 409);
    if (!['unpaid', 'paid', 'refunded'].includes(payment)) fail('Choose a valid payment status.');
    if (payment === 'refunded' && !['paid', 'refunded'].includes(raw.payment)) fail('Only a recorded paid order can be marked refunded.', 409);
    const notes = input.notes === undefined ? raw.notes : text(input.notes, 'internal note', 0, 4000);
    if (status === 'cancelled' && raw.status !== 'cancelled') for (const item of JSON.parse(raw.items)) if (item.tracked) db.prepare('UPDATE products SET stock=CASE WHEN stock IS NULL THEN NULL ELSE stock+? END,updated_at=? WHERE slug=?').run(item.quantity, new Date().toISOString(), item.slug);
    db.prepare('UPDATE orders SET status=?,payment=?,notes=?,updated_at=? WHERE id=?').run(status, payment, notes, new Date().toISOString(), id);
    activity(db, actor, `Updated order: ${status}, ${payment}`, raw.reference);
    const updated = mapOrder(db.prepare('SELECT * FROM orders WHERE id=?').get(id));
    onChanged?.(updated, mapOrder(raw));
    return updated;
  });
}
