import test from 'node:test';
import assert from 'node:assert/strict';
import { helpTopics, searchHelp } from '../src/data/help.mjs';

test('help search finds questions through both topic names and answer text', () => {
  assert.ok(searchHelp('shipping').some(result => result.article.id === 'delivery-cost'));
  assert.ok(searchHelp('  GAUTENG collection  ').some(result => result.article.id === 'collection'));
  assert.ok(searchHelp('copy order').some(result => result.article.id === 'place-order'));
});

test('help search handles empty and unmatched queries without changing the directory', () => {
  const original = JSON.stringify(helpTopics);
  assert.deepEqual(searchHelp('   '), []);
  assert.deepEqual(searchHelp('xyz-no-matching-question'), []);
  searchHelp('ingredient');
  assert.equal(JSON.stringify(helpTopics), original);
});

test('every help article has a unique deep link and an answer', () => {
  const ids = new Set();
  for (const topic of helpTopics) {
    assert.ok(topic.articles.length > 0);
    for (const article of topic.articles) {
      const id = `${topic.id}/${article.id}`;
      assert.ok(!ids.has(id), `Duplicate article: ${id}`);
      ids.add(id);
      assert.ok(article.title && article.body);
    }
  }
});
