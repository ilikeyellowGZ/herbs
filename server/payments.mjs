import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { activity, mapOrder, transaction } from './database.mjs';
import { fail } from './validation.mjs';

const denyAccess = () => fail('Invalid payment access.', 403);
const mismatch = () => fail('The payment provider record does not match the saved order.', 502);
const hash = value => createHash('sha256').update(value).digest();
const now = () => new Date().toISOString();
const refundStates = new Set(['pending', 'processing', 'needs-attention', 'failed', 'processed']);

function refundStateCaughtUp(observed, announced) {
  if (observed === announced || observed === 'processed') return true;
  if (announced === 'processed') return false;
  return observed === 'failed' || announced === 'pending' || (announced === 'processing' && observed === 'needs-attention');
}

// Paystack transaction IDs can be unsigned 64-bit values. Reject rounded JSON numbers.
function numericId(value) {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) return String(value);
  if (typeof value === 'string' && /^[1-9][0-9]{0,19}$/.test(value)) return value;
  return null;
}

function checkoutUrl(value) {
  let url;
  try { url = new URL(value); } catch { mismatch(); }
  if (url.origin !== 'https://checkout.paystack.com' || url.username || url.password || url.pathname === '/') mismatch();
  return url.href;
}

function requirePayable(order) {
  if (order.payment !== 'unpaid' || !['pending', 'confirmed'].includes(order.status)) {
    fail('This order can no longer accept a payment.', 409);
  }
}

export function createPayments(db, config, providers, notifications) {
  const initializing = new Map();
  let refundTimer, refundWork;
  const readOrder = id => mapOrder(db.prepare('SELECT * FROM orders WHERE id=?').get(id));
  const byReference = reference => typeof reference === 'string' && db.prepare('SELECT * FROM payment_attempts WHERE reference=?').get(reference);
  const requireEnabled = () => { if (!config.paystackEnabled) fail('Online payment is not configured. Your order is saved.', 503); };

  function access(id, key) {
    if (typeof id !== 'string' || typeof key !== 'string' || !db.prepare('SELECT id FROM orders WHERE id=? AND idempotency_key=?').get(id, key)) denyAccess();
    const secret = Buffer.from(db.prepare("SELECT value FROM integration_secrets WHERE name='payment-access'").get().value, 'hex');
    const token = createHmac('sha256', secret).update(JSON.stringify([id, key])).digest('base64url');
    db.prepare('INSERT INTO order_access (order_id,token_hash) VALUES (?,?) ON CONFLICT(order_id) DO NOTHING').run(id, hash(token).toString('hex'));
    return token;
  }

  function authorise(id, token) {
    if (typeof id !== 'string' || typeof token !== 'string' || token.length !== 43) denyAccess();
    const row = db.prepare('SELECT token_hash FROM order_access WHERE order_id=?').get(id);
    if (!row || !timingSafeEqual(hash(token), Buffer.from(row.token_hash, 'hex'))) denyAccess();
    return readOrder(id);
  }

  function view(attempt) {
    const order = readOrder(attempt.order_id);
    return { orderId: order.id, reference: attempt.reference, orderReference: order.reference, total: order.total,
      status: order.status, payment: order.payment, paymentState: attempt.state, mode: attempt.mode };
  }

  async function openCheckout(order) {
    const date = now();
    const reference = 'HH-P-' + order.id;
    db.prepare('INSERT INTO payment_attempts (reference,order_id,mode,amount,created_at,updated_at) VALUES (?,?,?,?,?,?) ON CONFLICT(order_id) DO NOTHING')
      .run(reference, order.id, config.paystackMode, order.total, date, date);
    const attempt = db.prepare('SELECT * FROM payment_attempts WHERE order_id=?').get(order.id);
    if (attempt.mode !== config.paystackMode || attempt.amount !== order.total || attempt.currency !== 'ZAR') mismatch();
    if (attempt.authorization_url) return { ...view(attempt), authorizationUrl: checkoutUrl(attempt.authorization_url) };
    const data = await providers.paystack('transaction/initialize', {
      reference: attempt.reference, email: order.details.email, amount: order.total, currency: 'ZAR',
      callback_url: new URL('/checkout/payment', config.origin).href,
    });
    if (data?.reference !== attempt.reference) mismatch();
    const url = checkoutUrl(data.authorization_url);
    requirePayable(readOrder(order.id)); // The owner or a webhook may have changed the order during checkout setup.
    db.prepare("UPDATE payment_attempts SET authorization_url=?,state=CASE WHEN state='created' THEN 'initialized' ELSE state END,updated_at=? WHERE reference=?")
      .run(url, now(), attempt.reference);
    return { ...view(byReference(attempt.reference)), authorizationUrl: url };
  }

  async function initialise(id, token) {
    const order = authorise(id, token);
    requireEnabled();
    requirePayable(order);
    if (!initializing.has(id)) initializing.set(id, openCheckout(order).finally(() => initializing.delete(id)));
    return initializing.get(id);
  }

  function notify(type, order, payment, suffix = order.id, notice) {
    const { notes, ...publicOrder } = order;
    const owner = type.startsWith('owner-');
    notifications.enqueue(type, { order: publicOrder, payment, ...(notice && { notice }) }, {
      key: type + '/' + suffix, recipient: owner ? undefined : order.details.email, audience: owner ? 'owner' : 'customer', entityId: order.id,
    });
  }

  function settle(data) {
    requireEnabled();
    return transaction(db, () => {
      const attempt = byReference(data?.reference);
      if (!attempt) mismatch();
      const order = readOrder(attempt.order_id), id = numericId(data.id);
      if (!id || (attempt.transaction_id && attempt.transaction_id !== id) ||
          attempt.mode !== config.paystackMode || data.domain !== attempt.mode ||
          data.currency !== 'ZAR' || data.currency !== attempt.currency ||
          data.amount !== attempt.amount || data.amount !== order.total ||
          typeof data.customer?.email !== 'string' || data.customer.email.trim().toLowerCase() !== order.details.email.toLowerCase()) mismatch();
      const other = db.prepare('SELECT reference FROM payment_attempts WHERE mode=? AND transaction_id=? AND reference<>?').get(attempt.mode, id, attempt.reference);
      if (other) mismatch();
      const date = now();
      db.prepare('UPDATE payment_attempts SET transaction_id=?,last_checked_at=? WHERE reference=?').run(id, date, attempt.reference);
      if (order.payment === 'refunded' || order.payment === 'paid') return view(attempt);
      let state = data.status;
      if (['ongoing', 'processing', 'queued'].includes(state)) state = 'pending';
      if (!['success', 'failed', 'abandoned', 'pending'].includes(state)) fail('Unable to verify the transaction status. Please check again shortly.', 502);
      if (state === 'pending' && ['abandoned', 'failed'].includes(attempt.state)) return view(attempt);
      const eventKey = 'charge/' + attempt.reference + '/' + state;
      if (db.prepare('SELECT event_key FROM payment_events WHERE event_key=?').get(eventKey)) return view(attempt);
      db.prepare('INSERT INTO payment_events (event_key,event_type,reference,created_at) VALUES (?,?,?,?)').run(eventKey, state, attempt.reference, date);
      db.prepare('UPDATE payment_attempts SET state=?,updated_at=? WHERE reference=?').run(state, date, attempt.reference);
      const payment = { amount: attempt.amount, reference: attempt.reference, status: state };
      if (state === 'success') {
        db.prepare("UPDATE orders SET payment='paid',status=CASE WHEN status='pending' THEN 'confirmed' ELSE status END,updated_at=? WHERE id=?").run(date, order.id);
        const paid = readOrder(order.id);
        activity(db, 'Paystack', 'Confirmed payment', order.reference);
        for (const type of ['payment-received', 'invoice', 'owner-payment']) notify(type, paid, payment);
        if (order.status === 'cancelled') notify('owner-alert', paid, payment, 'late-payment/' + order.id,
          'Payment arrived after cancellation. Review this payment in Paystack and contact the customer.');
      } else {
        notify(state === 'pending' ? 'payment-pending' : 'payment-failed', order, payment, attempt.reference + '/' + state);
        notify('owner-payment', order, payment, attempt.reference + '/' + state);
      }
      return view(byReference(attempt.reference));
    });
  }

  async function verify(reference, token) {
    const attempt = byReference(reference);
    if (!attempt) denyAccess();
    authorise(attempt.order_id, token);
    requireEnabled();
    if (attempt.mode !== config.paystackMode) mismatch();
    const data = await providers.paystack('transaction/verify/' + attempt.reference);
    if (data?.reference !== attempt.reference) mismatch();
    return settle(data);
  }

  function refundAttempt(data) {
    const reference = data.transaction?.reference ?? data.transaction_reference;
    const id = numericId(data.transaction?.id ?? data.transaction);
    const attempt = reference ? byReference(reference) : id && db.prepare('SELECT * FROM payment_attempts WHERE transaction_id=? AND mode=?').get(id, config.paystackMode);
    if (!attempt || (id && id !== attempt.transaction_id) || (data.transaction_reference && data.transaction_reference !== attempt.reference)) mismatch();
    return attempt;
  }

  function refund(data) {
    requireEnabled();
    return transaction(db, () => {
      const id = numericId(data?.id);
      if (!id || !refundStates.has(data.status)) mismatch();
      const attempt = refundAttempt(data), order = readOrder(attempt.order_id);
      if (!attempt.transaction_id || order.payment === 'unpaid') fail('Waiting for verified payment before recording this refund.', 503);
      const { amount, status } = data;
      if (data.domain !== attempt.mode || attempt.mode !== config.paystackMode || data.currency !== attempt.currency ||
          !Number.isSafeInteger(amount) || amount <= 0 || amount > attempt.amount) mismatch();
      const previous = db.prepare('SELECT * FROM refund_events WHERE id=?').get(id);
      if (previous && (previous.amount !== amount || previous.reference !== attempt.reference)) mismatch();
      if (previous?.state === 'processed' || previous?.state === status ||
          (previous?.state === 'failed' && status !== 'processed')) return view(attempt);
      const date = now();
      db.prepare('INSERT INTO refund_events (id,reference,amount,state,updated_at) VALUES (?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET state=excluded.state,updated_at=excluded.updated_at')
        .run(id, attempt.reference, amount, status, date);
      const payment = { amount, reference: attempt.reference, status };
      if (status === 'processed') {
        const refunded = attempt.refunded + amount;
        if (refunded > attempt.amount) mismatch();
        const full = refunded === attempt.amount;
        db.prepare('UPDATE payment_attempts SET refunded=?,state=?,updated_at=? WHERE reference=?').run(refunded, full ? 'refunded' : 'partially_refunded', date, attempt.reference);
        if (full) db.prepare("UPDATE orders SET payment='refunded',updated_at=? WHERE id=?").run(date, order.id);
        activity(db, 'Paystack', 'Recorded processed refund', order.reference);
        const updated = readOrder(order.id);
        notify('refund-received', updated, payment, attempt.reference + '/' + id);
        notify('owner-payment', updated, payment, 'refund/' + attempt.reference + '/' + id, 'Paystack processed a refund on this order.');
      } else if (status === 'failed' || status === 'needs-attention') {
        if (status === 'failed') notify('refund-failed', order, payment, attempt.reference + '/' + id);
        notify('owner-alert', order, payment, 'refund/' + attempt.reference + '/' + id + '/' + status,
          status === 'failed' ? 'The refund failed. Review it in Paystack and contact the customer.' : 'Paystack needs more information to process this refund. Review it in the dashboard.');
      } else {
        notify('owner-payment', order, payment, 'refund/' + attempt.reference + '/' + id + '/' + status, 'A refund is awaiting provider confirmation. No completed refund has been recorded yet.');
      }
      return view(byReference(attempt.reference));
    });
  }

  async function reconcileRefunds(data, announced) {
    const attempt = byReference(data?.transaction_reference);
    if (!attempt) return; // Other systems may use this merchant account.
    if (data.domain !== attempt.mode || data.currency !== attempt.currency) mismatch();
    if (!attempt.transaction_id) fail('Awaiting verified payment for this refund.', 503);
    let matched = false;
    for (let page = 1; page <= 10; page++) {
      const rows = await providers.paystack('refund?transaction=' + attempt.transaction_id + '&perPage=100&page=' + page);
      if (!Array.isArray(rows)) mismatch();
      for (const record of rows) {
        if (refundAttempt(record).reference !== attempt.reference) mismatch();
        refund(record);
        if (record.amount === Number(data.amount) && refundStateCaughtUp(record.status, announced) &&
            (!data.refund_reference || record.reference === data.refund_reference)) matched = true;
      }
      if (rows.length < 100) {
        if (!matched) fail('The refund is awaiting confirmation from the provider.', 503);
        return;
      }
    }
    fail('Refund reconciliation requires another review.', 503);
  }

  async function webhook(event) {
    const type = event?.event, data = event?.data;
    if (type === 'charge.success' || type === 'charge.failed') {
      if (!byReference(data?.reference)) return { ignored: true };
      if (data.status !== type.slice('charge.'.length)) mismatch();
      settle(data);
    } else if (typeof type === 'string' && type.startsWith('refund.') && refundStates.has(type.slice(7))) {
      requireEnabled();
      const id = numericId(data?.id ?? data?.refund_id);
      if (id) {
        const canonical = await providers.paystack('refund/' + id);
        if (numericId(canonical?.id) !== id || (data.transaction_reference && refundAttempt(canonical).reference !== data.transaction_reference)) mismatch();
        refund(canonical);
        if (!refundStateCaughtUp(canonical.status, type.slice(7))) fail('The refund is awaiting confirmation from the provider.', 503);
      } else {
        if (!data?.transaction_reference) mismatch();
        const attempt = byReference(data.transaction_reference);
        if (attempt) {
          const timestamp = Date.now();
          db.prepare('INSERT INTO refund_reconciliation (reference,payload,next_attempt_at,until_at) VALUES (?,?,?,?) ON CONFLICT(reference) DO UPDATE SET payload=excluded.payload,next_attempt_at=excluded.next_attempt_at,until_at=excluded.until_at').run(attempt.reference, JSON.stringify({ data, announced: type.slice(7) }), timestamp + 60000, timestamp + 72 * 3600000);
        }
        await reconcileRefunds(data, type.slice(7));
      }
    }
    return { ok: true };
  }

  async function reconcileJobs({ now: timestamp = Date.now(), limit = 2 } = {}) {
    for (const job of db.prepare('SELECT * FROM refund_reconciliation WHERE next_attempt_at<=? ORDER BY next_attempt_at LIMIT ?').all(timestamp, limit)) {
      let error = '';
      try { const payload = JSON.parse(job.payload); await reconcileRefunds(payload.data, payload.announced); }
      catch { error = 'Refund provider records are not yet available. Reconciliation will retry.'; }
      const attempt = byReference(job.reference);
      if (attempt?.refunded >= attempt?.amount) db.prepare('DELETE FROM refund_reconciliation WHERE reference=?').run(job.reference);
      else if (timestamp >= job.until_at) transaction(db, () => {
        const removed = db.prepare('DELETE FROM refund_reconciliation WHERE reference=? AND until_at=?').run(job.reference, job.until_at);
        if (removed.changes && attempt) notify('owner-alert', readOrder(attempt.order_id), {}, 'refund-reconciliation/' + job.reference, 'Automatic refund follow-up reached its reconciliation window. Review the provider refund records for this order.');
      });
      else db.prepare('UPDATE refund_reconciliation SET next_attempt_at=?,last_error=? WHERE reference=? AND until_at=?').run(timestamp + 60000, error, job.reference, job.until_at);
    }
  }
  function processRefunds(options) { if (!refundWork) refundWork = reconcileJobs(options).finally(() => { refundWork = null; }); return refundWork; }
  function start() { if (!refundTimer && config.paystackEnabled) { refundTimer = setInterval(() => { void processRefunds().catch(() => {}); }, 60000); refundTimer.unref(); } }
  async function stop() { clearInterval(refundTimer); refundTimer = null; if (refundWork) await refundWork; }
  return { access, authorise, initialise, verify, settle, refund, webhook, processRefunds, start, stop };
}
