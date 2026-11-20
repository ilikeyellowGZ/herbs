import test from 'node:test';
import assert from 'node:assert/strict';
import { products, findProduct, prepareEnquiry } from '../src/data/catalogue.mjs';

test('all eight ingredients resolve to their own page, preserving the supplied order', () => {
  assert.deepEqual(products.map(p => p.slug), ['hibiscus', 'collagen', 'moringa', 'sea-moss', 'bay-leaves', 'cinnamon', 'chia-seeds', 'ashwagandha']);
  for (const product of products) assert.equal(findProduct(product.slug)?.name, product.name);
  assert.equal(findProduct('unknown'), undefined);
  assert.equal(findProduct('collagen').category, 'Wellness supplement');
});

test('enquiry requires a real message and email and preserves the selected ingredient', () => {
  assert.equal(prepareEnquiry({ name: 'Ada', email: 'bad', message: 'Hello' }).ok, false);
  assert.equal(prepareEnquiry({ name: ' ', email: 'ada@example.com', message: 'Hello' }).ok, false);
  assert.equal(prepareEnquiry({ name: 'Ada', email: 'ada@example.com', message: ' ' }).ok, false);
  const result = prepareEnquiry({ name: ' Ada ', email: 'ada@example.com', ingredient: 'hibiscus', message: 'Please confirm the available format.' });
  assert.equal(result.ok, true);
  assert.match(result.text, /Hibiscus/);
  assert.match(result.text, /Please confirm the available format/);
  assert.match(result.text, /Ada/);
});
