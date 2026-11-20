import test from 'node:test';
import assert from 'node:assert/strict';
import { products, findProduct, prepareEnquiry } from '../src/data/catalogue.mjs';

test('all eight ingredients resolve to their own page, preserving the supplied order', () => {
  assert.deepEqual(products.map(p => p.slug), ['hibiscus', 'collagen', 'moringa', 'sea-moss', 'bay-leaves', 'cinnamon', 'chia-seeds', 'ashwagandha']);
  for (const product of products) assert.equal(findProduct(product.slug)?.name, product.name);
  assert.equal(findProduct('unknown'), undefined);
  assert.equal(findProduct('collagen').category, 'Wellness supplement');
});

test('contact message requires first name, surname, phone, email and message', () => {
  const draft = { name: 'Ada', surname: 'Nkosi', phone: '+27 82 123 4567', email: 'ada@example.com', message: 'I would like to discuss a collaboration.' };
  for (const field of ['name', 'surname', 'phone', 'email', 'message']) {
    assert.equal(prepareEnquiry({ ...draft, [field]: ' ' }).ok, false, `${field} is required`);
  }
  assert.equal(prepareEnquiry({ ...draft, email: 'bad' }).ok, false);
  const result = prepareEnquiry({ ...draft, name: ' Ada ', surname: ' Nkosi ', phone: ' +27 82 123 4567 ', ingredient: 'hibiscus' });
  assert.equal(result.ok, true);
  assert.match(result.text, /I would like to discuss a collaboration\./);
  assert.match(result.text, /First name: Ada\nSurname: Nkosi\nEmail: ada@example.com\nPhone: \+27 82 123 4567$/);
  assert.doesNotMatch(result.text, /Ingredient:|Hibiscus|General enquiry/);
});
