import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, Check, Copy, Mail, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { prepareEnquiry } from '../data/catalogue.mjs';
import { useEnquiry, type Draft } from './EnquiryContext';
import EnquiryAttachments from './EnquiryAttachments';

export default function Contact() {
  const { draft, setDraft, attachments, setAttachments, focusRequest } = useEnquiry();
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
    setPrepared(''); setStatus('');
  };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const result = prepareEnquiry(draft);
    if (!result.ok) { setStatus(result.text); return; }
    const fileSummary = attachments.length ? `\n\nSelected files (not uploaded):\n${attachments.map(file => `• ${file.name}`).join('\n')}\n\nAttach these files separately when sending your message.` : '';
    setPrepared(result.text + fileSummary);
    setStatus('Your message is ready to copy. No message or files have been sent.');
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(prepared); setStatus('Message copied. No message has been sent.'); }
    catch { setStatus('Select the prepared message below and copy it manually. No message has been sent.'); }
  };

  return <section id="contact" className="contact-section section-gutters" ref={sectionRef}>
    <div className="contact-intro">
      <p className="eyebrow">Let’s get to know each other</p>
      <h2>We’re all <em>ears.</em></h2>
      <p>Curious about an ingredient? Want to share your daily ritual, or grow something together? Tell us what’s on your mind.</p>
      <dl className="contact-details">
        <div><dt><Mail size={16} aria-hidden="true" />Write to us</dt><dd><a href="mailto:hello@herby.example">hello@herby.example</a></dd></div>
        <div><dt><Phone size={16} aria-hidden="true" />Give us a ring</dt><dd><a href="tel:+27000000000">+27 00 000 0000</a></dd></div>
        <div><dt><MapPin size={16} aria-hidden="true" />Find our roots</dt><dd>12 Rooibos Lane<br />Johannesburg, 2000<br />Gauteng, South Africa</dd></div>
      </dl>
      <p className="contact-sample-note">Sample contact details for this website preview.</p>
      <div className="contact-faq-note"><p>A question already taking root?</p><Link to="/faqs" className="text-link">You might find the answer here <ArrowUpRight size={16} aria-hidden="true" /></Link></div>
    </div>
    <form onSubmit={submit} className="enquiry-form" aria-labelledby="enquiry-title">
      <div className="enquiry-form-heading"><h2 id="enquiry-title">Send a little hello.</h2><p>A few details, and whatever you’d like to share.</p></div>
      <div className="form-row"><label>First name<input ref={nameRef} name="name" autoComplete="given-name" value={draft.name} onChange={event => update('name', event.target.value)} required placeholder="First name" maxLength={120} /></label><label>Surname<input name="surname" autoComplete="family-name" value={draft.surname} onChange={event => update('surname', event.target.value)} required placeholder="Surname" maxLength={120} /></label></div>
      <div className="form-row"><label>Email address<input type="email" name="email" autoComplete="email" value={draft.email} onChange={event => update('email', event.target.value)} required placeholder="you@example.com" maxLength={254} /></label><label>Phone number<input type="tel" name="phone" autoComplete="tel" value={draft.phone} onChange={event => update('phone', event.target.value)} required placeholder="Your phone number" maxLength={40} /></label></div>
      <div className="form-field"><label htmlFor="enquiry-message">Your message</label><textarea id="enquiry-message" name="message" value={draft.message} onChange={event => update('message', event.target.value)} required placeholder="What’s on your mind?" rows={4} maxLength={4000} /></div>
      <EnquiryAttachments files={attachments} onChange={files => { setAttachments(files); setPrepared(''); setStatus(''); }} />
      <p className="enquiry-preview-note">You’re exploring a website preview. Messages and files stay in your browser; nothing is sent. You can prepare and copy your message below.</p>
      <div className="form-bottom"><span>Little notes. New beginnings.</span><button className="solid-button" type="submit">Prepare message <ArrowRight size={16} aria-hidden="true" /></button></div>
      <div className="form-status" role="status">{status}</div>
      {prepared && <div className="prepared-enquiry"><div><span><Check size={16} /> Ready to copy</span><button type="button" onClick={copy}><Copy size={15} />Copy message</button></div><textarea aria-label="Prepared message" readOnly value={prepared} rows={9} onFocus={event => event.target.select()} /></div>}
    </form>
  </section>;
}
