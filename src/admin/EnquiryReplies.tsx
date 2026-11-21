import { useRef, useState, type FormEvent } from 'react';
import { Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, json } from '../lib/api';
import { useStore } from '../components/StoreContext';
import { useResource, Feedback, Status, date } from './shared';

type Reply = { id: string; message: string; actor: string; createdAt: string; state: string; deliveryState: string | null };
export default function EnquiryReplies({ enquiryId }: { enquiryId: string }) {
  const { data, error, loading, load } = useResource<Reply[]>(`/admin/enquiries/${enquiryId}/replies`);
  const { integrations } = useStore();
  const [message, setMessage] = useState(''), [busy, setBusy] = useState(false), [sendError, setSendError] = useState(''), [status, setStatus] = useState('');
  const attempt = useRef<{ message: string; key: string } | null>(null);
  async function send(event: FormEvent) {
    event.preventDefault(); if (busy || !message.trim()) return;
    setBusy(true); setSendError(''); setStatus('');
    if (attempt.current?.message !== message.trim()) attempt.current = { message: message.trim(), key: crypto.randomUUID() };
    try {
      await api(`/admin/enquiries/${enquiryId}/replies`, { ...json('POST', { message: attempt.current.message }), headers: { 'Idempotency-Key': attempt.current.key } });
      setMessage(''); attempt.current = null; await load(); setStatus('Your reply has been saved and queued for email delivery.');
    } catch (e) { setSendError((e as Error).message); } finally { setBusy(false); }
  }
  return <section className="admin-replies" aria-label="Email conversation"><h3>A thoughtful reply.</h3><Feedback error={error} loading={loading} retry={load} />{data?.map(reply => <article className="admin-reply" key={reply.id}><div><small>{date(reply.createdAt, true)} · {reply.actor}</small><Status value={reply.deliveryState || reply.state} /></div><p className="admin-preserve">{reply.message}</p></article>)}{!integrations.emailEnabled && <p className="admin-notice">Email replies need Resend and a verified sender. Check <Link className="admin-inline-link" to="/admin/notifications">Notifications</Link> for setup status.</p>}<form className="admin-form" onSubmit={send}><label>Your reply<textarea aria-label="Your reply" aria-describedby={`reply-help-${enquiryId}`} required rows={6} maxLength={5000} value={message} onChange={event => { setMessage(event.target.value); setStatus(''); }} placeholder="A little guidance, a helpful answer…" /><small id={`reply-help-${enquiryId}`}>This message is emailed to the customer. Internal notes stay private.</small></label>{sendError && <p className="admin-error" role="alert">{sendError}</p>}<p role="status">{status}</p><button className="admin-button" type="submit" disabled={busy || !integrations.emailEnabled || !message.trim()}><Mail size={16} />{busy ? 'Saving reply…' : 'Send reply by email'}</button></form></section>;
}
