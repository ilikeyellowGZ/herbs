import Contact from '../components/Contact';
import ResponsiveImage from '../components/ResponsiveImage';
import { ArrowDown } from 'lucide-react';
import '../contact.css';

export default function ContactPage() {
  return <div className="destination-page contact-page">
    <section className="contact-hero" aria-labelledby="contact-title">
      <div className="contact-hero-copy">
        <p className="eyebrow">A little closer, together</p>
        <h1 id="contact-title">A conversation,<br /><em>naturally.</em></h1>
        <p>Questions, little discoveries, ideas taking root.<br className="contact-desktop-break" /> There’s always room for a conversation.</p>
        <a className="text-link" href="#contact">Let’s talk <ArrowDown size={16} aria-hidden="true" /></a>
        <span className="contact-hero-signoff">Herby Health · Gauteng, South Africa</span>
      </div>
      <div className="contact-hero-photo"><ResponsiveImage name="contact-tea" sizes="(max-width: 767px) 120vw, 110vw" priority /></div>
    </section>
    <Contact />
  </div>;
}
