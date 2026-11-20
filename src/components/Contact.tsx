import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, Check, Mail, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { prepareEnquiry } from '../data/catalogue.mjs';
import { useEnquiry, type Draft } from './EnquiryContext';
import { useStore } from './StoreContext';
import { api } from '../lib/api';
import EnquiryAttachments from './EnquiryAttachments';

export default function Contact() {
  const { draft, setDraft, attachments, setAttachments, focusRequest } = useEnquiry();
  const { settings, connected } = useStore();
  const [status, setStatus] = useState(''), [busy, setBusy] = useState(false), [sent, setSent] = useState(false), [error, setError] = useState('');
  const nameRef = useRef<HTMLInputElement>(null), sectionRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!focusRequest) return;
    const timer = setTimeout(() => { sectionRef.current?.scrollIntoView({ behavior: 'instant' }); nameRef.current?.focus({ preventScroll: true }); }, 450);
    return () => clearTimeout(timer);
  }, [focusRequest]);
  const update = (key: keyof Draft, value: string) => { setDraft(previous => ({ ...previous, [key]: value })); setSent(false); setStatus(''); setError(''); };
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (busy || sent) return;
    const result = prepareEnquiry(draft); if (!result.ok) { setError(result.text); return; }
    setBusy(true); setError(''); setStatus('');
    const form = new FormData();
    Object.entries(draft).forEach(([key, value]) => form.set(key, value));
    attachments.forEach(file => form.append('files', file, file.name));
    try {
      const response = await api<{ reference: string }>('/enquiries', { method: 'POST', body: form });
      setSent(true); setStatus(`Thank you. Your message${attachments.length ? ' and attachments have' : ' has'} been received. Your reference is ${response.reference}.`);
      setAttachments([]);
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return <section id="contact" className="contact-section section-gutters" ref={sectionRef}>
    <div className="contact-intro"><p className="eyebrow">Let’s get to know each other</p><h2>We’re all <em>ears.</em></h2><p>Curious about an ingredient? Want to share your daily ritual, or grow something together? Tell us what’s on your mind.</p>
      <dl className="contact-details">{settings.email && <div><dt><Mail size={16} aria-hidden="true" />Write to us</dt><dd><a href={`mailto:${settings.email}`}>{settings.email}</a></dd></div>}{settings.phone && <div><dt><Phone size={16} aria-hidden="true" />Give us a ring</dt><dd><a href={`tel:${settings.phone}`}>{settings.phone}</a></dd></div>}{settings.address && <div><dt><MapPin size={16} aria-hidden="true" />Find our roots</dt><dd className="contact-address">{settings.address}</dd></div>}</dl>
      <div className="contact-faq-note"><p>A question already taking root?</p><Link to="/faqs" className="text-link">You might find the answer here <ArrowUpRight size={16} aria-hidden="true" /></Link></div>
    </div>
    <form onSubmit={submit} className="enquiry-form" aria-labelledby="enquiry-title" aria-busy={busy}>
      <div className="enquiry-form-heading"><h2 id="enquiry-title">Send a little hello.</h2><p>A few details, and whatever you’d like to share.</p></div>
      <div className="form-row"><label>First name<input ref={nameRef} name="name" autoComplete="given-name" value={draft.name} onChange={event => update('name', event.target.value)} required placeholder="First name" maxLength={120} /></label><label>Surname<input name="surname" autoComplete="family-name" value={draft.surname} onChange={event => update('surname', event.target.value)} required placeholder="Surname" maxLength={120} /></label></div>
      <div className="form-row"><label>Email address<input type="email" name="email" autoComplete="email" value={draft.email} onChange={event => update('email', event.target.value)} required placeholder="you@example.com" maxLength={254} /></label><label>Phone number<input type="tel" name="phone" autoComplete="tel" value={draft.phone} onChange={event => update('phone', event.target.value)} required placeholder="Your phone number" maxLength={40} /></label></div>
      <div className="form-field"><label htmlFor="enquiry-message">Your message</label><textarea id="enquiry-message" name="message" value={draft.message} onChange={event => update('message', event.target.value)} required placeholder="What’s on your mind?" rows={4} maxLength={4000} /></div>
      <EnquiryAttachments files={attachments} onChange={files => { setAttachments(files); setSent(false); setStatus(''); setError(''); }} />
      <p className="enquiry-preview-note">Sending shares your contact details, message and selected files with Herby Health so we can respond. Read our <Link className="text-link" to="/privacy-policy">Privacy policy</Link>. Please leave out sensitive medical or payment information.</p>
      {!connected && <p className="field-error" role="alert">The contact service is temporarily unavailable. Please try again shortly.</p>}
      {error && <p className="field-error" role="alert">{error}</p>}
      <div className="form-bottom"><span>Little notes. New beginnings.</span><button className="solid-button" type="submit" disabled={busy || sent || !connected}>{busy ? 'Sending…' : sent ? 'Message received' : 'Send message'} {sent ? <Check size={16} aria-hidden="true" /> : <ArrowRight size={16} aria-hidden="true" />}</button></div>
      <div className="form-status" role="status">{status}</div>
    </form>
  </section>;
}
