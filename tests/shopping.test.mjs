import test from 'node:test';
import assert from 'node:assert/strict';
import { products } from '../src/data/catalogue.mjs';
import { normaliseCart, changeQuantity, cartSummary, validateCheckout, orderRequest } from '../src/data/shopping.mjs';

test('stored cart rejects unknown products, invalid quantities and untrusted prices', () => {
  assert.deepEqual(normaliseCart(null), []);
  assert.deepEqual(normaliseCart({ slug: 'hibiscus' }), []);
  assert.deepEqual(normaliseCart([
    { slug: 'hibiscus', quantity: 2, price: 0 }, { slug: 'unknown', quantity: 3 },
    { slug: 'chia-seeds', quantity: -1 }, { slug: 'collagen', quantity: 1.5 },
    { slug: 'moringa', quantity: '3' }, { slug: 'cinnamon', quantity: Infinity },
    { slug: 'hibiscus', quantity: 1 }, { slug: 'bay-leaves', quantity: 1000000 },
  ]), [{ slug: 'hibiscus', quantity: 3 }, { slug: 'bay-leaves', quantity: 99 }]);
});

test('quantity changes merge items, cap at 99 and remove at zero', () => {
  let cart = changeQuantity([], 'hibiscus', 2);
  cart = changeQuantity(cart, 'hibiscus', 3);
  assert.deepEqual(cart, [{ slug: 'hibiscus', quantity: 3 }]);
  assert.deepEqual(changeQuantity(cart, 'unknown', 2), cart);
  assert.deepEqual(changeQuantity(cart, 'hibiscus', NaN), cart);
  assert.equal(changeQuantity(cart, 'hibiscus', 100)[0].quantity, 99);
  assert.deepEqual(changeQuantity(cart, 'hibiscus', 0), []);
});

test('totals count units, price from catalogue and apply delivery thresholds in cents', () => {
  const small = cartSummary([{ slug: 'hibiscus', quantity: 2, price: 0 }, { slug: 'bay-leaves', quantity: 1 }]);
  assert.equal(small.count, 3);
  assert.equal(small.subtotal, 22500);
  assert.equal(small.shipping, 7500);
  assert.equal(small.total, 30000);
  assert.equal(cartSummary([{ slug: 'hibiscus', quantity: 2 }], 'collection').shipping, 0);
  assert.equal(cartSummary([{ slug: 'collagen', quantity: 2 }, { slug: 'chia-seeds', quantity: 1 }]).shipping, 0);
  assert.equal(cartSummary([{ slug: 'collagen', quantity: 2 }, { slug: 'cinnamon', quantity: 1 }]).shipping, 7500);
  assert.equal(cartSummary([{ slug: 'sea-moss', quantity: 3 }, { slug: 'chia-seeds', quantity: 1 }, { slug: 'bay-leaves', quantity: 1 }]).subtotal, 65000);
  assert.equal(cartSummary([{ slug: 'sea-moss', quantity: 3 }, { slug: 'chia-seeds', quantity: 1 }, { slug: 'bay-leaves', quantity: 1 }]).shipping, 0);
  assert.equal(cartSummary([]).total, 0);
  assert.equal(cartSummary([{ slug: 'ashwagandha', quantity: 99 }]).subtotal, Math.round(products.find(p => p.slug === 'ashwagandha').price * 100) * 99);
});

const details = { name: 'Ada Lovelace', email: 'ada@example.com', phone: '+27 82 123 4567', address: '12 Garden Road', city: 'Pretoria', province: 'Gauteng', postalCode: '0002', notes: '' };
test('checkout validates details according to fulfilment and creates an honest itemised request', () => {
  assert.deepEqual(validateCheckout(details, 'courier'), {});
  assert.ok(validateCheckout({ ...details, email: 'bad', address: '', postalCode: '12' }, 'courier').email);
  assert.ok(validateCheckout({ ...details, address: '' }, 'courier').address);
  assert.deepEqual(validateCheckout({ ...details, address: '', city: '', province: '', postalCode: '' }, 'collection'), {});
  assert.ok(validateCheckout({ ...details, phone: '123' }, 'collection').phone);
  assert.ok(validateCheckout({ ...details, province: 'Unknown' }, 'courier').province);
  const request = orderRequest([{ slug: 'hibiscus', quantity: 2 }], details, 'courier');
  assert.match(request, /Hibiscus.*100 g.*2/);
  assert.match(request, /Ada Lovelace/);
  assert.match(request, /12 Garden Road/);
  assert.match(request, /No order or payment has been submitted/);
  assert.match(request, /265[.,]00/);
});
