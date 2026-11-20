import { findProduct, products } from './catalogue.mjs';

export const CART_KEY = 'herby-health-cart-v1';
export const MAX_QUANTITY = 99;
export const FREE_DELIVERY = 65000;
export const COURIER_FEE = 7500;
export const provinces = ['Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape'];
export const money = cents => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(cents / 100);

export function normaliseCart(value) {
  /** @type {{slug: string, quantity: number}[]} */
  const clean = [];
  if (!Array.isArray(value)) return clean;
  for (const item of value) {
    if (!item || !findProduct(item.slug) || !Number.isSafeInteger(item.quantity) || item.quantity < 1) continue;
    const existing = clean.find(line => line.slug === item.slug);
    if (existing) existing.quantity = Math.min(MAX_QUANTITY, existing.quantity + Math.min(MAX_QUANTITY, item.quantity));
    else clean.push({ slug: item.slug, quantity: Math.min(MAX_QUANTITY, item.quantity) });
  }
  return clean;
}

export function changeQuantity(cart, slug, quantity) {
  const clean = normaliseCart(cart);
  if (!findProduct(slug) || !Number.isSafeInteger(quantity)) return clean;
  if (quantity <= 0) return clean.filter(item => item.slug !== slug);
  const existing = clean.find(item => item.slug === slug);
  if (existing) existing.quantity = Math.min(MAX_QUANTITY, quantity);
  else clean.push({ slug, quantity: Math.min(MAX_QUANTITY, quantity) });
  return clean;
}

export function cartSummary(cart, method = 'courier', catalogue = products, rates = { courierFee: COURIER_FEE, freeDelivery: FREE_DELIVERY }) {
  const items = normaliseCart(cart).flatMap(item => {
    const product = catalogue.find(product => product.slug === item.slug);
    if (!product) return [];
    return [{ ...item, product, lineTotal: Math.round(product.price * 100) * item.quantity }];
  });
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const shipping = count && method !== 'collection' && subtotal < rates.freeDelivery ? rates.courierFee : 0;
  return { items, count, subtotal, shipping, total: subtotal + shipping };
}

export function validateCheckout(details, method) {
  /** @type {Record<string, string>} */
  const errors = {};
  const read = key => String(details[key] || '').trim();
  if (read('name').length < 2 || read('name').length > 100) errors.name = 'Enter your full name (2–100 characters).';
  if (read('email').length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(read('email'))) errors.email = 'Enter a valid email address.';
  if (!/^[+\d\s()-]+$/.test(read('phone')) || read('phone').replace(/\D/g, '').length < 9 || read('phone').replace(/\D/g, '').length > 15) errors.phone = 'Enter a valid contact number.';
  if (!['courier', 'collection'].includes(method)) errors.method = 'Choose courier delivery or collection.';
  if (method === 'courier') {
    if (read('address').length < 5 || read('address').length > 200) errors.address = 'Enter your street address.';
    if (read('city').length < 2 || read('city').length > 100) errors.city = 'Enter your town or city.';
    if (!provinces.includes(read('province'))) errors.province = 'Choose a South African province.';
    if (!/^\d{4}$/.test(read('postalCode'))) errors.postalCode = 'Enter a four-digit postal code.';
  }
  if (read('notes').length > 500) errors.notes = 'Keep your note to 500 characters.';
  return errors;
}

export function orderRequest(cart, details, method, catalogue = products, rates = { courierFee: COURIER_FEE, freeDelivery: FREE_DELIVERY }) {
  const summary = cartSummary(cart, method, catalogue, rates);
  return [
    'Herby Health — order request',
    'Preview: No order or payment has been submitted. Please confirm stock, final product labels, delivery and payment arrangements.',
    '', ...summary.items.map(item => `${item.product.name} · ${item.product.packSize} · ${item.product.form} × ${item.quantity} — ${money(item.lineTotal)}`),
    '', `Subtotal: ${money(summary.subtotal)}`, `Delivery: ${method === 'collection' ? 'Gauteng collection' : 'South African courier'} — ${money(summary.shipping)}`, `Total: ${money(summary.total)}`,
    '', `Name: ${details.name.trim()}`, `Email: ${details.email.trim()}`, `Phone: ${details.phone.trim()}`,
    method === 'collection' ? 'Collection location and time to be arranged in Gauteng.' : `Address: ${[details.address, details.city, details.province, details.postalCode, 'South Africa'].join(', ')}`,
    details.notes?.trim() ? `Note: ${details.notes.trim()}` : '',
  ].filter(line => line !== undefined).join('\n');
}
