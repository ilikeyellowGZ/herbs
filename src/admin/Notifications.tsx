import { useEffect, useState } from 'react';
import { Eye, Mail, RefreshCw, ShieldCheck } from 'lucide-react';
import { api, json } from '../lib/api';
import { useResource, Feedback, Status, Table, Empty, date, label } from './shared';

type Message = { id: string; type: string; audience: string; recipient: string | null; state: string; attempts: number; lastError: string; deliveryState: string | null; createdAt: string; sentAt: string | null };
type Readiness = { paymentsEnabled: boolean; paymentMode: string; paymentWebhook: boolean; emailEnabled: boolean; emailWebhook: boolean; sender: string; replyTo: string; notificationEmail: string; origin: string };
type Data = { readiness: Readiness; messages: Message[]; templates: string[] };
type Preview = { subject: string; html: string; text: string };

export default function Notifications() {
  const { data, error, loading, load } = useResource<Data>('/admin/notifications');
  const [selected, setSelected] = useState('payment-received'), [preview, setPreview] = useState<Preview | null>(null);
  const [previewError, setPreviewError] = useState(''), [actionError, setActionError] = useState(''), [busy, setBusy] = useState(''), [notice, setNotice] = useState('');
  const [showText, setShowText] = useState(false);
  useEffect(() => {
    let active = true;
    setPreview(null); setPreviewError('');
    void api<Preview>(`/admin/notifications/templates/${selected}`).then(value => { if (active) setPreview(value); }).catch(e => { if (active) setPreviewError(e.message); });
    return () => { active = false; };
  }, [selected]);
  async function inspect(message: Message) {
    setBusy(message.id); setActionError('');
    try { setPreview(await api<Preview>(`/admin/notifications/${message.id}/preview`)); setNotice('Showing the saved notification.'); document.getElementById('email-preview-title')?.scrollIntoView({ behavior: 'instant', block: 'start' }); }
    catch (e) { setActionError((e as Error).message); } finally { setBusy(''); }
  }
  async function retry(message: Message) {
    setBusy(message.id); setActionError(''); setNotice('');
    try { await api(`/admin/notifications/${message.id}/retry`, json('POST', {})); await load(); setNotice('Notification queued for another delivery attempt.'); }
    catch (e) { setActionError((e as Error).message); } finally { setBusy(''); }
  }
  const r = data?.readiness;
  return <><Feedback error={error} loading={loading} retry={load} />{r && <section className="admin-integration-grid" aria-label="Payment and email configuration"><div className="admin-panel admin-integration-card"><ShieldCheck size={24} strokeWidth={1.2} /><h2>Payments with Paystack.</h2><Status value={r.paymentsEnabled ? r.paymentMode === 'live' ? 'configured' : 'test-mode' : 'not-configured'} /><p>{r.paymentsEnabled ? `The ${r.paymentMode} API key is configured. Payment status is verified on the server.` : 'Add the Paystack secret key in the server environment to enable hosted checkout.'}</p><small>{r.paymentWebhook ? 'Timestamped webhook verification configured.' : 'Modern webhook secret is not set. Legacy signature verification uses the secret API key.'}</small><code>/api/webhooks/paystack</code></div><div className="admin-panel admin-integration-card"><Mail size={24} strokeWidth={1.2} /><h2>A little care, delivered.</h2><Status value={r.emailEnabled ? 'configured' : 'not-configured'} /><p>{r.emailEnabled ? `Sender: ${r.sender}` : 'Add a Resend API key and a sender on your verified sending domain.'}</p><small>Reply to: {r.replyTo || 'not configured'}<br />Owner notifications: {r.notificationEmail || 'not configured'}</small><small>{r.emailWebhook ? 'Signed delivery updates configured.' : 'Add the Resend signing secret to track delivery and bounces.'}</small><code>/api/webhooks/resend</code></div></section>}
    <section className="admin-panel admin-email-library" aria-labelledby="email-preview-title"><div className="admin-panel-heading"><div><p className="eyebrow">Every little message, considered</p><h2 id="email-preview-title">Your correspondence.</h2><p>Preview the branded purchase, invoice, payment and enquiry emails.</p></div></div><div className="admin-email-controls"><label>Email template<select aria-label="Email template" value={selected} onChange={e => { setSelected(e.target.value); setNotice(''); }}>{(data?.templates || ['payment-received']).map(type => <option key={type} value={type}>{label(type)}</option>)}</select></label><button className="admin-button admin-button--secondary" onClick={() => setShowText(value => !value)}>{showText ? 'View email design' : 'View plain text'}</button></div>{previewError && <p className="admin-error" role="alert">{previewError}</p>}{preview ? <><p className="admin-email-subject"><strong>Subject</strong> {preview.subject}</p>{showText ? <pre className="admin-email-text">{preview.text}</pre> : <iframe className="admin-email-preview" sandbox="" referrerPolicy="no-referrer" title={`${preview.subject} email preview`} srcDoc={preview.html} />}</> : !previewError && <p className="admin-loading" role="status">Preparing the email preview…</p>}<p className="admin-footnote">Template previews use fictional details. No email is sent from this preview.</p></section>
    <section className="admin-panel"><div className="admin-panel-heading"><div><h2>From queued to delivered.</h2><p>Sent means Resend accepted the message. Delivered means the recipient’s mail server accepted it.</p></div><button className="admin-button admin-button--secondary" onClick={load}><RefreshCw size={16} />Refresh</button></div>{data?.messages.length ? <Table name="Email notification delivery log"><thead><tr><th>Message</th><th>Recipient</th><th>Delivery</th><th>Attempts</th><th>Created</th><th>Actions</th></tr></thead><tbody>{data.messages.map(message => <tr key={message.id}><td><strong>{label(message.type)}</strong><small>{label(message.audience)}</small></td><td>{message.recipient || 'Awaiting configuration'}</td><td><Status value={message.deliveryState || message.state} />{message.lastError && <small className="admin-email-error">{message.lastError}</small>}</td><td>{message.attempts}</td><td>{date(message.createdAt, true)}</td><td><div className="admin-email-actions"><button className="admin-inline-link" disabled={busy === message.id} onClick={() => inspect(message)} aria-label={`Preview ${label(message.type)} for ${message.recipient || 'pending recipient'}`}><Eye size={15} />Preview</button>{['failed', 'retry', 'blocked'].includes(message.state) && <button className="admin-inline-link" disabled={busy === message.id} onClick={() => retry(message)}>Retry</button>}</div></td></tr>)}</tbody></Table> : !loading && <Empty title="A little quiet, for now.">Order, payment and enquiry notifications will appear here as they are created.</Empty>}<p className="admin-footnote">Latest 500 messages. Bounced and complained-about recipients are suppressed. Uncertain sends need reconciliation in Resend before sending again.</p></section>{actionError && <p className="admin-error" role="alert">{actionError}</p>}<p role="status">{notice}</p></>;
}
