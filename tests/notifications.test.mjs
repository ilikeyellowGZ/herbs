import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDatabase } from '../server/database.mjs';
import { createNotifications } from '../server/notifications.mjs';
import { integrationConfig } from '../server/providers.mjs';

const sample = { enquiry: { id: 'example', reference: 'HE-TEST', name: 'Ada', surname: 'Lovelace', email: 'ada@example.com', message: 'A question about tea.' } };
test('durable outbox deduplicates events, retries exact payloads and separates accepted from delivered', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'herby-mail-')), db = openDatabase(directory);
  let fail = true; const calls = [];
  const config = integrationConfig('https://store.example.com', { resendKey: 're_test', emailFrom: 'Herby Health <orders@example.com>', notifyEmail: 'owner@example.com' });
  const mail = createNotifications(db, config, { resend: async (message, key) => { calls.push({ message, key }); if (fail) throw new Error('Provider unavailable'); return { id: 'provider_1' }; } });
  try {
    const first = mail.enqueue('enquiry-received', sample, { key: 'enquiry-received/example', recipient: 'ada@example.com', entityId: 'example' });
    assert.equal(mail.enqueue('enquiry-received', sample, { key: 'enquiry-received/example', recipient: 'ada@example.com' }), first);
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM email_outbox').get().count, 1);
    await mail.process({ now: 1000000 });
    assert.equal(mail.list()[0].state, 'retry');
    fail = false;
    await mail.process({ now: 10000000 });
    assert.deepEqual(calls[1], calls[0]);
    assert.equal(mail.list()[0].state, 'sent');
    assert.notEqual(mail.list()[0].deliveryState, 'delivered');
    mail.delivery({ type: 'email.delivered', created_at: '2026-11-21T08:01:00Z', data: { email_id: 'provider_1' } }, 'event1');
    assert.equal(mail.list()[0].deliveryState, 'delivered');
    mail.delivery({ type: 'email.sent', created_at: '2026-11-21T08:00:00Z', data: { email_id: 'provider_1' } }, 'event2');
    assert.equal(mail.list()[0].deliveryState, 'delivered');
    assert.equal(mail.delivery({ type: 'email.delivered', created_at: '2026-11-21T08:01:00Z', data: { email_id: 'provider_1' } }, 'event1').duplicate, true);
    mail.delivery({ type: 'email.bounced', created_at: '2026-11-21T08:02:00Z', data: { email_id: 'provider_1' } }, 'event3');
    assert.equal(mail.list()[0].deliveryState, 'bounced');
    mail.enqueue('enquiry-received', sample, { key: 'enquiry-received/other', recipient: 'ada@example.com' });
    await mail.process({ now: 20000000 });
    assert.equal(mail.list()[0].state, 'suppressed');
    assert.equal(calls.length, 2);
  } finally { db.close(); await rm(directory, { recursive: true, force: true }); }
});

test('missing configuration queues without sending and uncertain old attempts need reconciliation', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'herby-mail-')), db = openDatabase(directory);
  const absent = createNotifications(db, integrationConfig('http://localhost:5174', { resendKey: '', emailFrom: '' }), { resend: async () => { throw new Error('Must not send'); } });
  try {
    absent.enqueue('enquiry-received', sample, { key: 'one', recipient: 'ada@example.com' });
    await absent.process();
    assert.equal(absent.list()[0].state, 'blocked');
    db.prepare("UPDATE email_outbox SET state='retry',first_attempt_at=1,next_attempt_at=0").run();
    const configured = createNotifications(db, integrationConfig('https://store.example.com', { resendKey: 're_test', emailFrom: 'orders@example.com' }), { resend: async () => { throw new Error('Must not retry after deduplication window'); } });
    await configured.process({ now: 25 * 3600000 });
    assert.equal(configured.list()[0].state, 'uncertain');
    assert.throws(() => configured.retry(configured.list()[0].id), /reconcil/i);
  } finally { db.close(); await rm(directory, { recursive: true, force: true }); }
});
