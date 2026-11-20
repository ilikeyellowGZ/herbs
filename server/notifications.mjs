import { randomUUID } from 'node:crypto';
import { getSettings, transaction } from './database.mjs';
import { fail } from './validation.mjs';
import { mailbox } from './providers.mjs';
import { renderEmail } from './email-templates.mjs';

export function createNotifications(db, config, providers) {
  let running = null, timer = null;
  const brand = () => ({ ...getSettings(db), email: mailbox(config.replyTo) || getSettings(db).email || mailbox(config.emailFrom), origin: config.origin });
  const ownerEmail = () => mailbox(config.notifyEmail) || mailbox(getSettings(db).email) || db.prepare('SELECT email FROM users ORDER BY created_at LIMIT 1').get()?.email || '';
  function enqueue(type, payload, options) {
    const existing = db.prepare('SELECT id FROM email_outbox WHERE event_key=?').get(options.key);
    if (existing) return existing.id;
    const id = randomUUID();
    db.prepare('INSERT INTO email_outbox (id,event_key,type,audience,recipient,entity_id,payload,brand,created_at) VALUES (?,?,?,?,?,?,?,?,?)').run(id, options.key, type, options.audience || 'customer', mailbox(options.recipient) || null, options.entityId || null, JSON.stringify(payload), JSON.stringify(brand()), new Date().toISOString());
    return id;
  }
  function list() {
    return db.prepare('SELECT id,event_key,type,audience,recipient,entity_id,state,attempts,provider_id,last_error,delivery_state,created_at,sent_at FROM email_outbox ORDER BY rowid DESC LIMIT 500').all().map(row => ({ id: row.id, eventKey: row.event_key, type: row.type, audience: row.audience, recipient: row.recipient, entityId: row.entity_id, state: row.state, attempts: row.attempts, providerId: row.provider_id, lastError: row.last_error, deliveryState: row.delivery_state, createdAt: row.created_at, sentAt: row.sent_at }));
  }
  function applyDelivery(row, type, date) {
    const state = type.replace('email.', '');
    if (!['sent', 'delivered', 'delivery_delayed', 'bounced', 'complained', 'failed', 'suppressed'].includes(state)) return;
    const rank = { sent: 1, delivery_delayed: 2, delivered: 3, failed: 4, suppressed: 5, bounced: 6, complained: 7 };
    if (rank[row.delivery_state] > rank[state] || (row.delivery_at && date < row.delivery_at && rank[row.delivery_state] >= rank[state])) return;
    db.prepare('UPDATE email_outbox SET delivery_state=?,delivery_at=? WHERE id=?').run(state, date, row.id);
    if (['bounced', 'complained', 'suppressed'].includes(state) && mailbox(row.recipient)) db.prepare('INSERT OR IGNORE INTO email_suppressions (email,reason,created_at) VALUES (?,?,?)').run(row.recipient.toLowerCase(), state, date);
  }
  function delivery(event, eventId) {
    const providerId = event?.data?.email_id;
    if (typeof providerId !== 'string' || providerId.length > 200 || typeof event.type !== 'string') fail('Invalid delivery event.');
    const parsed = Date.parse(event.created_at), date = Number.isFinite(parsed) ? new Date(parsed).toISOString() : new Date().toISOString();
    return transaction(db, () => {
      if (db.prepare('SELECT id FROM email_events WHERE id=?').get(eventId)) return { duplicate: true };
      db.prepare('INSERT INTO email_events (id,provider_id,type,created_at) VALUES (?,?,?,?)').run(eventId, providerId, event.type, date);
      const row = db.prepare('SELECT * FROM email_outbox WHERE provider_id=?').get(providerId);
      if (row) applyDelivery(row, event.type, date);
      return { ok: true };
    });
  }
  async function processBatch({ now = Date.now(), limit = 10 } = {}) {
    for (let i = 0; i < limit; i++) {
      const row = transaction(db, () => {
        const row = db.prepare("SELECT * FROM email_outbox WHERE state IN ('queued','retry','blocked','sending') AND next_attempt_at<=? AND locked_until<=? ORDER BY rowid LIMIT 1").get(now, now);
        if (!row) return null;
        db.prepare("UPDATE email_outbox SET state='sending',locked_until=? WHERE id=?").run(now + 60000, row.id);
        return row;
      });
      if (!row) break;
      const update = (state, message, next = 0) => db.prepare('UPDATE email_outbox SET state=?,last_error=?,locked_until=0,next_attempt_at=? WHERE id=?').run(state, message, next, row.id);
      if (row.first_attempt_at !== null && now - row.first_attempt_at >= 23 * 3600000 && !row.provider_id) { update('uncertain', 'Reconcile this attempt in Resend before sending again; the provider deduplication window has passed.'); continue; }
      let message;
      try {
        if (row.message) message = JSON.parse(row.message);
        else {
          const recipient = row.audience === 'owner' ? ownerEmail() : mailbox(row.recipient);
          if (!config.emailEnabled || !recipient) { update('blocked', 'Email delivery needs a Resend API key, verified sender and recipient.', now + 60000); continue; }
          const rendered = renderEmail(row.type, JSON.parse(row.payload), { ...JSON.parse(row.brand), ...brand() });
          const replyTo = row.type === 'owner-enquiry' ? mailbox(JSON.parse(row.payload).enquiry?.email) : brand().email;
          message = { from: config.emailFrom, to: [recipient], ...rendered, ...(mailbox(replyTo) ? { reply_to: mailbox(replyTo) } : {}) };
          db.prepare('UPDATE email_outbox SET message=?,recipient=? WHERE id=?').run(JSON.stringify(message), recipient, row.id);
        }
        if (!config.emailEnabled) { update('blocked', 'Resend delivery is not configured.', now + 60000); continue; }
        if (db.prepare('SELECT email FROM email_suppressions WHERE email=?').get(message.to[0].toLowerCase())) { update('suppressed', 'This recipient previously bounced or reported a message.'); continue; }
        db.prepare('UPDATE email_outbox SET attempts=attempts+1,first_attempt_at=COALESCE(first_attempt_at,?) WHERE id=?').run(now, row.id);
        const result = await providers.resend(message, row.event_key);
        if (typeof result?.id !== 'string' || !result.id) throw new Error('Email provider did not return a message identifier.');
        transaction(db, () => {
          db.prepare("UPDATE email_outbox SET state='sent',provider_id=?,sent_at=?,last_error='',locked_until=0 WHERE id=?").run(result.id, new Date().toISOString(), row.id);
          // A delivery webhook may reach us before the API send response.
          for (const event of db.prepare('SELECT type,created_at FROM email_events WHERE provider_id=? ORDER BY created_at').all(result.id)) applyDelivery(db.prepare('SELECT * FROM email_outbox WHERE id=?').get(row.id), event.type, event.created_at);
        });
      } catch {
        const attempts = db.prepare('SELECT attempts FROM email_outbox WHERE id=?').get(row.id).attempts;
        update(attempts >= 8 ? 'failed' : 'retry', 'Email provider could not accept this message. The saved request will be retried safely.', now + Math.min(3600000, 30000 * 2 ** Math.min(attempts, 7)));
      }
    }
  }
  function process(options) {
    if (running) return running;
    running = processBatch(options).finally(() => { running = null; });
    return running;
  }
  function retry(id) {
    const row = db.prepare('SELECT * FROM email_outbox WHERE id=?').get(id);
    if (!row) fail('Email notification not found.', 404);
    if (row.state === 'uncertain' || (row.first_attempt_at && Date.now() - row.first_attempt_at >= 23 * 3600000 && !row.provider_id)) fail('Reconcile this email in Resend before attempting another send.', 409);
    if (!['failed', 'retry', 'blocked'].includes(row.state) || row.provider_id) fail('Only an unsent failed or blocked email can be retried.', 409);
    db.prepare("UPDATE email_outbox SET state='queued',next_attempt_at=0,locked_until=0 WHERE id=?").run(id);
    return { queued: true };
  }
  function start() { if (!timer) { timer = setInterval(() => { void process({ limit: 1 }).catch(() => {}); }, 1000); timer.unref(); } }
  async function stop() { if (timer) clearInterval(timer); timer = null; if (running) await running; }
  return { enqueue, list, delivery, process, retry, start, stop, brand, ownerEmail };
}
