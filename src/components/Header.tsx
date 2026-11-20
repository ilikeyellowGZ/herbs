import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Search, X, ArrowUpRight } from 'lucide-react';
import Logo, { BotanicalMark } from './Logo';
import { products } from '../data/catalogue.mjs';
import useDialogFocus from './useDialogFocus';
import { pages } from '../data/pages.mjs';
import SayHello from './SayHello';

const links = pages.slice(0, 3).map(page => ({ label: page.label, href: page.path }));

export default function Header() {
  const [query, setQuery] = useState('');
  const menu = useRef<HTMLDialogElement>(null);
  const search = useRef<HTMLDialogElement>(null);
  useDialogFocus(menu);
  useDialogFocus(search);

  const close = () => { menu.current?.close(); search.current?.close(); };
  const filtered = products.filter(product => `${product.name} ${product.category}`.toLowerCase().includes(query.toLowerCase()));

  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header header-light">
      <div className="announcement">Small rituals. A little closer to nature. <span>Gauteng, South Africa</span></div>
      <div className="nav-bar"><Logo /><nav className="desktop-nav" aria-label="Main navigation">{links.map(link => <Link className="nav-link" key={link.href} to={link.href}>{link.label}</Link>)}</nav>
        <div className="nav-actions"><SayHello className="hello-link">Say hello <ArrowUpRight size={16} strokeWidth={1.3} /></SayHello><button className="icon-button" onClick={() => search.current?.showModal()} aria-label="Search the collection"><Search size={20} strokeWidth={1.3} /></button><button className="icon-button menu-trigger" onClick={() => menu.current?.showModal()} aria-label="Open menu"><Menu size={24} strokeWidth={1.3} /></button></div>
      </div>
    </header>
    <dialog className="navigation-dialog" ref={menu} aria-labelledby="menu-title">
      <div className="dialog-top"><span id="menu-title">Herby Health</span><button className="icon-button" onClick={close} aria-label="Close menu"><X strokeWidth={1.3} /></button></div>
      <nav aria-label="Mobile navigation">{[...links, { label: 'A few answers', href: '/faqs' }].map(link => <Link key={link.href} to={link.href} onClick={close}>{link.label}<ArrowUpRight size={26} strokeWidth={1} /></Link>)}<SayHello onClick={close}>Say hello<ArrowUpRight size={26} strokeWidth={1} /></SayHello></nav>
      <div className="menu-bottom"><BotanicalMark /><p>A little closer<br />to nature.</p><span>Gauteng, South Africa</span></div>
    </dialog>
    <dialog ref={search} className="search-dialog" aria-labelledby="search-title">
      <div className="dialog-top"><span id="search-title">Find your everyday ritual</span><button className="icon-button" onClick={close} aria-label="Close search"><X strokeWidth={1.3} /></button></div>
      <label className="search-input"><Search size={22} strokeWidth={1.2} /><input type="search" placeholder="Search ingredients…" value={query} onChange={event => setQuery(event.target.value)} aria-label="Search ingredients" /></label>
      <div className="search-results" aria-live="polite">{filtered.length ? filtered.map(product => <Link key={product.slug} to={`/products/${product.slug}`} onClick={close}><span>{product.name}<small>{product.category}</small></span><ArrowUpRight size={22} strokeWidth={1} /></Link>) : <p>No ingredients found. Try “tea”, “moringa” or “spice”.</p>}</div>
    </dialog>
  </>;
}
