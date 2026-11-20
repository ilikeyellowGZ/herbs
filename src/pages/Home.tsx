import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import ScrollExpand from '../components/ScrollExpand';
import type { Product } from '../components/ProductCard';
import QuickView from '../components/QuickView';
import { products } from '../data/catalogue.mjs';
import images from '../data/images.json';

export default function Home() {
  const [quick, setQuick] = useState<Product | null>(null);
  return <div id="home">
    <section className="home-hero" aria-labelledby="hero-heading">
      <div className="hero-intro section-gutters">
        <p className="hero-kicker">Garden</p>
        <h1 id="hero-heading">A little closer to nature.<br />Botanical ingredients and everyday rituals, simply chosen to be part of your day.</h1>
        <div className="hero-intro-links"><button className="text-link" onClick={() => setQuick(products[0])}>Explore hibiscus <ArrowUpRight size={17} strokeWidth={1.2} /></button><Link className="text-link" to="/collection">The collection <ArrowUpRight size={17} strokeWidth={1.2} /></Link></div>
      </div>
      <ScrollExpand className="hero-expand" variant="editorial" syncNavigation src={images['garden-aerial'].src} srcSet={images['garden-aerial'].srcSet} sizes="max(100vw, 178vh)" alt={images['garden-aerial'].alt} width={images['garden-aerial'].width} height={images['garden-aerial'].height} priority startRadius={0} mediaZoom={1} overlayScrim={.38} title={null}>
        <p className="hero-full-copy">A little closer<br /><em>to nature.</em></p>
      </ScrollExpand>
    </section>

    <section className="home-destinations section-gutters" aria-labelledby="destinations-heading">
      <p className="eyebrow">A few good places to begin</p><h2 id="destinations-heading">Find your <em>good things.</em></h2>
      <div className="destination-links">{[
        { href: '/collection', label: 'The collection', detail: 'Eight ingredients, simply chosen.' },
        { href: '/rituals', label: 'Everyday rituals', detail: 'A little room for your kind of day.' },
        { href: '/our-story', label: 'Our story', detail: 'Good things. Deep roots.' },
        { href: '/contact', label: 'Contact', detail: 'A conversation starts here.' },
        { href: '/faqs', label: 'A few answers', detail: 'A little clarity before you begin.' },
      ].map(item => <Link key={item.href} to={item.href}><span><span className="destination-title">{item.label}</span><span className="destination-description">{item.detail}</span></span><ArrowUpRight size={24} strokeWidth={1.2} /></Link>)}</div>
    </section>

    <ScrollExpand className="garden-expand" src={images['garden-aerial'].src} srcSet={images['garden-aerial'].srcSet} startWidth={74} startHeight={70} startRadius={0} scrollDistance={.6} holdDistance={.05} overlayScrim={.18} title={<div className="garden-title"><p className="eyebrow">Take a little nature with you.</p><h2>Back to the<br /><em>good things.</em></h2></div>}><p className="garden-full-copy">A little closer<br /><em>to nature.</em></p></ScrollExpand>
    <QuickView product={quick} onClose={() => setQuick(null)} />
  </div>;
}

