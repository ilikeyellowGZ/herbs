import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import '../legal.css';

type LegalSection = { id: string; title: string; content: ReactNode };
type LegalPageProps = {
  title: string;
  introduction: string;
  related: { path: string; title: string };
  sections: LegalSection[];
};

export default function LegalPage({ title, introduction, related, sections }: LegalPageProps) {
  return <div className="destination-page legal-page">
    <header className="legal-intro section-gutters">
      <p className="eyebrow">Herby Health · Legal</p>
      <h1>{title}</h1>
      <p className="legal-introduction">{introduction}</p>
      <p className="legal-updated">Last updated <time dateTime="2026-11-20">20 November 2026</time></p>
    </header>
    <div className="legal-layout section-gutters">
      <nav className="legal-contents" aria-label={`${title} contents`}>
        <h2>On this page</h2>
        <ol>{sections.map(section => <li key={section.id}><Link to={`#${section.id}`}>{section.title}</Link></li>)}</ol>
        <Link className="text-link" to={related.path}>{related.title}</Link>
      </nav>
      <article className="legal-article" aria-label={title}>
        <aside className="legal-notice" aria-label="Website service notice"><p>Contact submissions and order requests are saved securely for the Herby Health team. Checkout does not collect payment. A request is subject to confirmation of availability, payment and delivery arrangements.</p></aside>
        {sections.map((section, index) => <section id={section.id} key={section.id} aria-labelledby={`${section.id}-heading`}>
          <h2 id={`${section.id}-heading`}>{index + 1}. {section.title}</h2>
          {section.content}
        </section>)}
        <div className="legal-related"><Link className="text-link" to={related.path}>{related.title}</Link><Link className="text-link" to="/contact">Visit the contact page</Link></div>
      </article>
    </div>
  </div>;
}
