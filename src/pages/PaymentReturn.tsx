import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check, Clock3, Download, RefreshCw, ShieldCheck, TriangleAlert } from 'lucide-react';
import { api, json } from '../lib/api';
import { downloadInvoice, paystackUrl, readPaymentSession, savePaymentSession, type PaymentSession } from '../lib/payment-session';
import { money } from '../data/shopping.mjs';
import { useCart } from '../components/CartContext';
import { useStore } from '../components/StoreContext';
import { clearOrderSubmission } from '../lib/order-submission';

type Result = { orderId: string; reference: string; orderReference: string; total: number; status: string; payment: string; paymentState: string; mode: string };
export default function PaymentReturn() {
  const [params] = useSearchParams();
  const [session, setSession] = useState<PaymentSession | null>(null);
  const [ready, setReady] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [result, setResult] = useState<Result | null>(null), [invoiceBusy, setInvoiceBusy] = useState(false);
  const { consume, ready: cartReady } = useCart();
  const { refresh } = useStore();
  const lock = useRef(false), heading = useRef<HTMLHeadingElement>(null);
  const callbackReference = params.get('reference') || params.get('trxref') || '';
  useEffect(() => { setSession(readPaymentSession()); setReady(true); }, []);
  const verify = useCallback(async (saved: PaymentSession, reference: string) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const local = await api<Result>('/payments/status', json('POST', { orderId: saved.orderId, token: saved.token }));
      const resolvedReference = reference || local.reference;
      const response = ['paid', 'refunded'].includes(local.payment) ? local : resolvedReference ? await api<Result>('/payments/verify', json('POST', { reference: resolvedReference, token: saved.token })) : local;
      setResult(response);
      if (['paid', 'refunded'].includes(response.payment)) {
        if (!readPaymentSession()?.settled) consume(saved.items || []);
        if (!saved.settled && saved.submissionKey) clearOrderSubmission(saved.submissionKey);
        const next = { ...saved, reference: response.reference, settled: true };
        savePaymentSession(next); setSession(next); void refresh();
      } else if (response.status === 'cancelled' && ['failed', 'abandoned', 'created'].includes(response.paymentState)) {
        if (!saved.closed && saved.submissionKey) clearOrderSubmission(saved.submissionKey);
        const next = { ...saved, closed: true };
        savePaymentSession(next); setSession(next);
      }
    } catch (e) { setError((e as Error).message); }
    finally { lock.current = false; setBusy(false); }
  }, [consume, refresh]);
  useEffect(() => { if (cartReady && session && !result) void verify(session, callbackReference || session.reference || ''); }, [cartReady, session, callbackReference, result, verify]);
  useEffect(() => { if (result) heading.current?.focus({ preventScroll: true }); }, [result]);

  async function resume() {
    if (!session || busy) return;
    setBusy(true); setError('');
    try {
      const response = await api<{ authorizationUrl: string; reference: string }>('/payments/initialize', json('POST', { orderId: session.orderId, token: session.token }));
      savePaymentSession({ ...session, reference: response.reference });
      window.location.assign(paystackUrl(response.authorizationUrl));
    } catch (e) { setError((e as Error).message); setBusy(false); }
  }
  async function invoice() {
    if (!session) return;
    setInvoiceBusy(true); setError('');
    try { await downloadInvoice(session); } catch (e) { setError((e as Error).message); } finally { setInvoiceBusy(false); }
  }
  const paid = result?.payment === 'paid', refunded = result?.payment === 'refunded';
  const cancelled = result?.status === 'cancelled' && (result.payment !== 'unpaid' || ['failed', 'abandoned', 'created'].includes(result.paymentState));
  const pending = !cancelled && !paid && !refunded && !['failed', 'abandoned'].includes(result?.paymentState || '');
  const Icon = paid || refunded ? Check : pending ? Clock3 : TriangleAlert;
  return <section className="checkout-page section-gutters"><div className="payment-result">
    <Icon size={40} strokeWidth={1.2} aria-hidden="true" /><p className="eyebrow">Herby Health · Secure checkout</p>
    <h1 ref={heading} tabIndex={-1}>{paid ? cancelled ? 'Payment received. We’ll be in touch.' : 'A little nature, on its way.' : refunded ? 'Your refund is recorded.' : cancelled ? 'Your order is cancelled.' : busy || !ready ? 'Checking your payment.' : pending ? 'A little patience, please.' : 'Let’s take another look.'}</h1>
    <p>{paid ? cancelled ? 'Payment arrived after this order was cancelled. The team has been alerted to arrange the next step. The order has not been reopened.' : 'Your payment has been verified with Paystack. Thank you for making us part of your everyday.' : refunded ? 'Paystack has confirmed the recorded refund. Your bank may need additional time to show the funds.' : cancelled ? 'This unpaid order has been cancelled. Your bag has been kept so you can begin a fresh checkout.' : pending ? 'We haven’t confirmed a successful payment yet. If you completed payment, check the status again before attempting another payment.' : 'This payment attempt did not complete. Your order reference is saved, and you can return to Paystack to try again.'}</p>
    {(result || session) && <dl className="payment-result__facts"><div><dt>Order reference</dt><dd>{result?.orderReference || session?.orderReference}</dd></div><div><dt>Order total</dt><dd>{money(result?.total ?? session?.total ?? 0)}</dd></div>{result && <div><dt>Payment status</dt><dd>{result.paymentState.replaceAll('_', ' ')}</dd></div>}</dl>}
    {!session && ready && <p role="status">Payment recovery is not available in this tab. If you paid, the signed provider notification will still update your order. Check your confirmation email or contact us with your order reference.</p>}
    {error && <p className="field-error" role="alert">{error}</p>}
    <div className="payment-result__actions">{session && !paid && !refunded && !cancelled && <><button className="solid-button" disabled={busy} onClick={() => void verify(session, callbackReference || session.reference || '')}><RefreshCw size={17} />{busy ? 'Checking…' : 'Check payment status'}</button>{(!pending || !session.reference) && !cancelled && <button className="text-link" disabled={busy} onClick={resume}>Return to Paystack</button>}</>}{cancelled && !paid && <Link className="solid-button" to="/checkout">Start a new checkout</Link>}{session && <button className={paid || refunded ? 'solid-button' : 'text-link'} disabled={invoiceBusy} onClick={invoice}><Download size={17} />{invoiceBusy ? 'Preparing invoice…' : 'Download invoice'}</button>}<Link className="text-link" to="/contact">Ask about your order</Link><Link className="text-link" to="/collection">Back to the collection</Link></div>
    {session?.mode === 'test' && <p className="shopping-preview"><ShieldCheck size={15} /> Test mode · this does not collect a live payment.</p>}
  </div></section>;
}
