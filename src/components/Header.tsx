import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Menu, ShoppingBag, X, ArrowUpRight } from 'lucide-react';
import Logo, { BotanicalMark } from './Logo';
import { useCart } from './CartContext';
import useDialogFocus from './useDialogFocus';
import { pages } from '../data/pages.mjs';
import SayHello from './SayHello';

const links = pages.slice(0, 3).map(page => ({ label: page.label, href: page.path }));

export default function Header() {
  const { count, open, setOpen } = useCart();
  const menu = useRef<HTMLDialogElement>(null);
  useDialogFocus(menu);

  const close = () => menu.current?.close();

  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header header-light">
      <div className="announcement">Small rituals. A little closer to nature. <span>Gauteng, South Africa</span></div>
      <div className="nav-bar"><Logo /><nav className="desktop-nav" aria-label="Main navigation">{links.map(link => <Link className="nav-link" key={link.href} to={link.href}>{link.label}</Link>)}</nav>
        <div className="nav-actions"><SayHello className="hello-link">Say hello <ArrowUpRight size={16} strokeWidth={1.3} /></SayHello><button className="icon-button cart-trigger" onClick={() => setOpen(true)} aria-label={`Open shopping bag, ${count} ${count === 1 ? 'item' : 'items'}`} aria-haspopup="dialog" aria-controls="shopping-bag" aria-expanded={open}><ShoppingBag size={22} strokeWidth={1.3} /><span className="cart-count" aria-hidden="true">{count}</span></button><button className="icon-button menu-trigger" onClick={() => menu.current?.showModal()} aria-label="Open menu"><Menu size={24} strokeWidth={1.3} /></button></div>
      </div>
    </header>
    <dialog className="navigation-dialog" ref={menu} aria-labelledby="menu-title">
      <div className="dialog-top"><span id="menu-title">Herby Health</span><button className="icon-button" onClick={close} aria-label="Close menu"><X strokeWidth={1.3} /></button></div>
      <nav aria-label="Mobile navigation">{[...links, { label: 'A few answers', href: '/faqs' }].map(link => <Link key={link.href} to={link.href} onClick={close}>{link.label}<ArrowUpRight size={26} strokeWidth={1} /></Link>)}<SayHello onClick={close}>Say hello<ArrowUpRight size={26} strokeWidth={1} /></SayHello></nav>
      <div className="menu-bottom"><BotanicalMark /><p>A little closer<br />to nature.</p><span>Gauteng, South Africa</span></div>
    </dialog>

  </>;
}
