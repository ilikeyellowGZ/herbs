import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { prepareEnquiry } from '../data/catalogue.mjs';
import { useEnquiry, type Draft } from './EnquiryContext';

export default function Contact() {
  const { draft, setDraft, focusRequest } = useEnquiry();
  const [prepared, setPrepared] = useState('');
  const [status, setStatus] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!focusRequest) return;
    const timer = setTimeout(() => {
      sectionRef.current?.scrollIntoView({ behavior: 'instant' });
      nameRef.current?.focus({ preventScroll: true });
    }, 450);
    return () => clearTimeout(timer);
  }, [focusRequest]);

  const update = (key: keyof Draft, value: string) => {
    setDraft(previous => ({ ...previous, [key]: value }));
    if (prepared) { setPrepared(''); setStatus(''); }
  };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const result = prepareEnquiry(draft);
    if (!result.ok) { setStatus(result.text); return; }
    setPrepared(result.text);
    setStatus('Your message is ready to copy. This preview has not sent a message.');
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(prepared); setStatus('Message copied. No message has been sent.'); }
    catch { setStatus('Select the prepared message below and copy it manually. No message has been sent.'); }
  };

  return <section id="contact" className="contact-section section-gutters" ref={sectionRef}>
    <div className="contact-intro"><p className="eyebrow">Get in touch</p><h1>Good things begin<br />with a <em>hello.</em></h1><p>Have a question, some feedback or an idea for working together? We’d love to hear from you. Leave your details and a message below.</p><p className="location-line">Gauteng, South Africa</p></div>
    <form onSubmit={submit} className="enquiry-form">
      <div className="form-row"><label>First name<input ref={nameRef} name="name" autoComplete="given-name" value={draft.name} onChange={event => update('name', event.target.value)} required placeholder="First name" maxLength={120} /></label><label>Surname<input name="surname" autoComplete="family-name" value={draft.surname} onChange={event => update('surname', event.target.value)} required placeholder="Surname" maxLength={120} /></label></div>
      <div className="form-row"><label>Email address<input type="email" name="email" autoComplete="email" value={draft.email} onChange={event => update('email', event.target.value)} required placeholder="you@example.com" maxLength={254} /></label><label>Phone number<input type="tel" name="phone" autoComplete="tel" value={draft.phone} onChange={event => update('phone', event.target.value)} required placeholder="Your phone number" maxLength={40} /></label></div>
      <div className="form-field"><label htmlFor="enquiry-message">Your message</label><textarea id="enquiry-message" name="message" value={draft.message} onChange={event => update('message', event.target.value)} required placeholder="Tell us a little more…" rows={3} maxLength={4000} /></div>
      <div className="form-bottom"><p>Website preview — messages are not yet connected.</p><button className="solid-button" type="submit">Prepare message</button></div>
      <div className="form-status" role="status">{status}</div>
      {prepared && <div className="prepared-enquiry"><div><span><Check size={16} /> Ready to copy</span><button type="button" onClick={copy}><Copy size={15} />Copy message</button></div><textarea aria-label="Prepared message" readOnly value={prepared} rows={9} onFocus={event => event.target.select()} /></div>}
    </form>
  </section>;
}
