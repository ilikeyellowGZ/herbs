export type PaymentSession = { orderId: string; token: string; orderReference: string; total: number; reference?: string; settled?: boolean; mode: 'test' | 'live' };
const key = 'herby-payment-recovery-v1';
let current: PaymentSession | null = null;
export function readPaymentSession(): PaymentSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = JSON.parse(sessionStorage.getItem(key) || 'null');
    if (value && typeof value.orderId === 'string' && value.orderId.length <= 100 && typeof value.token === 'string' && /^[a-f0-9]{64}$/.test(value.token) && typeof value.orderReference === 'string' && value.orderReference.length <= 120 && Number.isSafeInteger(value.total) && value.total >= 0 && (!value.reference || /^[A-Za-z0-9.=-]{1,120}$/.test(value.reference)) && ['test', 'live'].includes(value.mode)) current = value;
  } catch { /* In-memory recovery remains available when storage is blocked. */ }
  return current;
}
export function savePaymentSession(value: PaymentSession) {
  current = value;
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* The current tab can still continue to payment. */ }
}
export function paystackUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.hostname !== 'checkout.paystack.com' || url.port || url.username || url.password) throw new Error('The payment provider returned an unexpected checkout address. Please contact the store.');
  return url.href;
}

export async function downloadInvoice(session: PaymentSession) {
  const { api, json } = await import('./api');
  const invoice = await api<{ html: string }>('/payments/invoice', json('POST', { orderId: session.orderId, token: session.token }));
  const url = URL.createObjectURL(new Blob([invoice.html], { type: 'text/html;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url; link.download = `INV-${session.orderReference.replace(/[^A-Za-z0-9-]/g, '')}.html`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
