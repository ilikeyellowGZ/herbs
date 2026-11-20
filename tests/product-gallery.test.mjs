import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { products } from '../src/data/catalogue.mjs';

test('every product exposes at least four distinct, available gallery views', () => {
  const manifest = JSON.parse(readFileSync(new URL('../src/data/images.json', import.meta.url)));
  for (const product of products) {
    assert.ok(product.images?.length >= 4, `${product.name} needs at least four views`);
    assert.equal(new Set(product.images.map(image => image.key)).size, product.images.length);
    for (const image of product.images) {
      assert.ok(image.label, `${product.name} view needs a readable label`);
      const asset = manifest[image.key];
      assert.ok(asset?.alt, `${image.key} needs a manifest entry and alt text`);
      for (const path of [asset.fallback, ...asset.srcSet.split(', ').map(source => source.split(' ')[0])]) {
        assert.ok(existsSync(new URL(`../public${path}`, import.meta.url)), `${path} is missing`);
      }
    }
  }
});
