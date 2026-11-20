import test from 'node:test';
import assert from 'node:assert/strict';
import { products } from '../src/data/catalogue.mjs';
import { queryProducts, formatPrice, hasPrice } from '../src/data/catalogue-query.mjs';

test('search and category compose, with case and whitespace ignored', () => {
  assert.deepEqual(queryProducts(products, { query: '  HIBISCUS ', category: 'tea' }).map(p => p.slug), ['hibiscus']);
  assert.equal(queryProducts(products, { query: 'hibiscus', category: 'pantry' }).length, 0);
  assert.ok(queryProducts(products, { query: 'Salvia' }).some(p => p.slug === 'chia-seeds'));
  assert.equal(queryProducts(products, { query: '<script>' }).length, 0);
  assert.equal(queryProducts(products, { category: 'unknown', sort: 'unknown' }).length, 8);
});

test('alphabetical sorting preserves the source and featured order', () => {
  const original = products.map(p => p.slug);
  assert.equal(queryProducts(products, { sort: 'name-asc' })[0].name, 'Ashwagandha');
  assert.equal(queryProducts(products, { sort: 'name-desc' })[0].name, 'Sea Moss');
  assert.deepEqual(products.map(p => p.slug), original);
  assert.deepEqual(queryProducts(products).map(p => p.slug), original);
});

test('both price directions keep missing prices last and accept zero', () => {
  const items = [
    { name: 'Unknown', price: null, currency: 'ZAR' },
    { name: 'Higher', price: 120, currency: 'ZAR' },
    { name: 'Free', price: 0, currency: 'ZAR' },
    { name: 'Lower', price: 60, currency: 'ZAR' },
    { name: 'Invalid', price: -1, currency: 'ZAR' },
  ];
  assert.deepEqual(queryProducts(items, { sort: 'price-asc' }).map(p => p.name), ['Free', 'Lower', 'Higher', 'Unknown', 'Invalid']);
  assert.deepEqual(queryProducts(items, { sort: 'price-desc' }).map(p => p.name), ['Higher', 'Lower', 'Free', 'Unknown', 'Invalid']);
  assert.equal(hasPrice({ price: 20, currency: null }), false);
  assert.equal(hasPrice({ price: Infinity, currency: 'ZAR' }), false);
  assert.equal(formatPrice({ price: null }), 'Price on enquiry');
  assert.match(formatPrice({ price: 0, currency: 'ZAR' }), /^R\s*0[.,]00$/);
});

test('all eight products provide practical guides and honest commercial data', () => {
  for (const product of products) {
    assert.equal(product.price, null);
    assert.equal(product.packSize, null);
    assert.ok(['tea', 'pantry', 'supplements'].includes(product.collection));
    assert.ok(product.guide.benefits.length >= 2, product.slug);
    for (const field of ['preparation', 'suitability', 'storage', 'summary', 'evidence']) assert.ok(product.guide[field]?.length > 20, `${product.slug}: ${field}`);
    for (const source of product.guide.sources) assert.match(source.url, /^https:\/\//);
  }
});
