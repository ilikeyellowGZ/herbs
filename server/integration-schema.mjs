import { randomBytes } from 'node:crypto';

export function ensureIntegrationSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS integration_secrets (name TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS order_access (order_id TEXT PRIMARY KEY REFERENCES orders(id), token_hash TEXT NOT NULL UNIQUE);
    CREATE TABLE IF NOT EXISTS payment_attempts (reference TEXT PRIMARY KEY, order_id TEXT NOT NULL UNIQUE REFERENCES orders(id), mode TEXT NOT NULL, amount INTEGER NOT NULL, currency TEXT NOT NULL DEFAULT 'ZAR', state TEXT NOT NULL DEFAULT 'created', authorization_url TEXT, transaction_id TEXT, refunded INTEGER NOT NULL DEFAULT 0, last_checked_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS payment_events (event_key TEXT PRIMARY KEY, event_type TEXT NOT NULL, reference TEXT, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS refund_events (id TEXT PRIMARY KEY, reference TEXT NOT NULL REFERENCES payment_attempts(reference), amount INTEGER NOT NULL, state TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS email_outbox (id TEXT PRIMARY KEY, event_key TEXT NOT NULL UNIQUE, type TEXT NOT NULL, audience TEXT NOT NULL, recipient TEXT, entity_id TEXT, payload TEXT NOT NULL, brand TEXT NOT NULL, message TEXT, state TEXT NOT NULL DEFAULT 'queued', attempts INTEGER NOT NULL DEFAULT 0, next_attempt_at INTEGER NOT NULL DEFAULT 0, locked_until INTEGER NOT NULL DEFAULT 0, first_attempt_at INTEGER, provider_id TEXT UNIQUE, last_error TEXT NOT NULL DEFAULT '', delivery_state TEXT, delivery_at TEXT, created_at TEXT NOT NULL, sent_at TEXT);
    CREATE TABLE IF NOT EXISTS email_events (id TEXT PRIMARY KEY, provider_id TEXT, type TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS email_suppressions (email TEXT PRIMARY KEY, reason TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS enquiry_replies (id TEXT PRIMARY KEY, enquiry_id TEXT NOT NULL REFERENCES enquiries(id), request_key TEXT NOT NULL UNIQUE, message TEXT NOT NULL, actor TEXT NOT NULL, email_id TEXT NOT NULL REFERENCES email_outbox(id), created_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS email_outbox_pending ON email_outbox(state,next_attempt_at);
  `);
  db.prepare('INSERT OR IGNORE INTO integration_secrets (name,value) VALUES (?,?)').run('payment-access', randomBytes(32).toString('hex'));
}
