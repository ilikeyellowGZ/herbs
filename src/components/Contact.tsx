import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { products, prepareEnquiry } from '../data/catalogue.mjs';
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
    setStatus('Your enquiry is ready to copy. This preview has not sent a message.');
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(prepared); setStatus('Enquiry copied. No message has been sent.'); }
    catch { setStatus('Select the prepared message below and copy it manually. No message has been sent.'); }
  };

  return <section id="contact" className="contact-section section-gutters" ref={sectionRef}>
    <div className="contact-intro"><p className="eyebrow">A conversation starts here</p><h2>Good things begin<br />with a <em>hello.</em></h2><p>Curious about an ingredient? Putting together a new routine? We’d love to hear what’s on your mind.</p><p className="location-line">Gauteng, South Africa</p></div>
    <form onSubmit={submit} className="enquiry-form">
      <div className="form-row"><label>Your name<input ref={nameRef} name="name" autoComplete="name" value={draft.name} onChange={event => update('name', event.target.value)} required placeholder="Name and surname" maxLength={120} /></label><label>Email address<input type="email" name="email" autoComplete="email" value={draft.email} onChange={event => update('email', event.target.value)} required placeholder="you@example.com" maxLength={254} /></label></div>
      <label>What caught your eye? <span className="optional">(optional)</span><select name="ingredient" value={draft.ingredient} onChange={event => update('ingredient', event.target.value)}><option value="">Choose an ingredient</option>{products.map(product => <option key={product.slug} value={product.slug}>{product.name}</option>)}</select></label>
      <div className="form-field"><label htmlFor="enquiry-message">Your message</label><textarea id="enquiry-message" name="message" value={draft.message} onChange={event => update('message', event.target.value)} required placeholder="Tell us a little more…" rows={3} maxLength={4000} /></div>
      <div className="form-bottom"><p>Website preview — enquiries are not yet connected.</p><button className="solid-button" type="submit">Prepare enquiry</button></div>
      <div className="form-status" role="status">{status}</div>
      {prepared && <div className="prepared-enquiry"><div><span><Check size={16} /> Ready to copy</span><button type="button" onClick={copy}><Copy size={15} />Copy message</button></div><textarea aria-label="Prepared enquiry" readOnly value={prepared} rows={8} onFocus={event => event.target.select()} /></div>}
    </form>
  </section>;
}
