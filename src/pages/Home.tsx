import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import ScrollExpand from '../components/ScrollExpand';
import ResponsiveImage from '../components/ResponsiveImage';
import ProductCard, { type Product } from '../components/ProductCard';
import QuickView from '../components/QuickView';
import Accordion from '../components/Accordion';
import Contact from '../components/Contact';
import { BotanicalMark } from '../components/Logo';
import { products } from '../data/catalogue.mjs';
import images from '../data/images.json';

export default function Home() {
  const root = useRef<HTMLDivElement>(null);
  const [quick, setQuick] = useState<Product | null>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced || !root.current) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      void import('../animations/reveals').then(module => {
        if (!disposed && root.current) cleanup = module.initialiseReveals(root.current);
      });
    }, { rootMargin: '400px 0px' });
    const collection = root.current.querySelector('#collection');
    if (collection) observer.observe(collection);
    return () => { disposed = true; observer.disconnect(); cleanup?.(); };
  }, [reduced]);

  return <div ref={root} id="home">
    <section className="home-hero" aria-labelledby="hero-heading">
      <div className="hero-intro section-gutters">
        <p className="hero-kicker">Garden</p>
        <h1 id="hero-heading">A little closer to nature.<br />Botanical ingredients and everyday rituals, simply chosen to be part of your day.</h1>
        <div className="hero-intro-links"><button className="text-link" onClick={() => setQuick(products[0])}>Explore hibiscus <ArrowUpRight size={17} strokeWidth={1.2} /></button><Link className="text-link" to="/#collection">The collection <ArrowUpRight size={17} strokeWidth={1.2} /></Link></div>
      </div>
      <ScrollExpand className="hero-expand" variant="editorial" src={images['garden-aerial'].src} srcSet={images['garden-aerial'].srcSet} sizes="max(100vw, 178vh)" alt={images['garden-aerial'].alt} width={images['garden-aerial'].width} height={images['garden-aerial'].height} priority startRadius={0} mediaZoom={1} overlayScrim={.38} title={null}>
        <p className="hero-full-copy">A little closer<br /><em>to nature.</em></p>
      </ScrollExpand>
    </section>

    <section id="collection" className="collection section-gutters">
      <div className="collection-intro" data-reveal><p className="eyebrow">The collection</p><h2>Eight ingredients for<br /><em>everyday rituals.</em></h2><p>A few good things from nature.<br />For your cup, your kitchen, your own kind of day.</p></div>
      <div className="collection-rule"><span>The everyday essentials</span><span>Good things, simply chosen.</span></div>
      <div className="product-grid">{products.map(product => <div key={product.slug} data-reveal><ProductCard product={product} onOpen={setQuick} /></div>)}</div>
    </section>

    <section id="rituals" className="rituals-section section-gutters">
      <div className="rituals-heading" data-reveal><p className="eyebrow">There’s no right way to slow down</p><h2>Find your <em>little ritual.</em></h2></div>
      <div className="ritual-grid"><Link to="/products/hibiscus" className="ritual-card" data-reveal><span className="ritual-time">When the kettle goes on</span><h3>The slow-down cup.</h3><p>Hibiscus, warm water, a little time.<br />Some things need very little else.</p><span className="text-link">Put the kettle on <ArrowUpRight size={17} /></span></Link><Link to="/products/chia-seeds" className="ritual-card" data-reveal><span className="ritual-time">Before the day begins</span><h3>Morning, unhurried.</h3><p>A bowl left overnight. Something fresh.<br />A small favour for your future self.</p><span className="text-link">Meet chia seeds <ArrowUpRight size={17} /></span></Link><Link to="/products/bay-leaves" className="ritual-card" data-reveal><span className="ritual-time">Something on the stove</span><h3>A leaf in the pot.</h3><p>Bay, a gentle simmer, the kitchen<br />smelling like someone’s home.</p><span className="text-link">Back to the kitchen <ArrowUpRight size={17} /></span></Link></div>
    </section>

    <section id="story" className="story-section section-gutters"><div className="story-photo" data-reveal><ResponsiveImage name="garden-harvest" sizes="(max-width: 880px) calc(100vw - 48px), 50vw" /><span>From nature, with a little care.</span></div><div className="story-copy" data-reveal><BotanicalMark /><p className="eyebrow">Rooted in the everyday</p><h2>Good things.<br />Deep <em>roots.</em></h2><p>We’re Herby Health, a botanical and everyday wellness brand based in Gauteng, South Africa.</p><p>We believe there’s something lovely in the ordinary: the first cup of the day, a meal made slowly, an ingredient you come to know by heart.</p><p>Our collection is an invitation to bring a little more of that into your day. Simply, thoughtfully, and in your own time.</p><Link to="/#contact" className="text-link">A conversation starts here <ArrowUpRight size={17} strokeWidth={1.2} /></Link></div></section>

    <section id="faqs" className="faq-section section-gutters"><div data-reveal><p className="eyebrow">A few things you might be wondering</p><h2>A little <em>clarity.</em></h2><Link to="/#contact" className="text-link">Something else on your mind?</Link></div><div data-reveal><Accordion items={[
      { title: 'Where do I begin?', content: 'Start with what catches your eye. Each ingredient has its own page with a little more about its character and everyday use. If you’d like a hand choosing, say hello.' },
      { title: 'How do I order?', content: 'We’re currently introducing the collection. Use the enquiry form to ask about your chosen ingredient, available formats and current pricing. Online checkout is not connected in this preview.' },
      { title: 'Where are you based?', content: 'Herby Health is based in Gauteng, South Africa. Enquire with your location so we can confirm current delivery or collection arrangements.' },
      { title: 'Can you help me choose an ingredient?', content: 'Of course. Tell us what you’re curious about and we can share product information. For individual supplement suitability, speak to a qualified healthcare practitioner.' },
      { title: 'Will my product look exactly like the photos?', content: 'The images show our visual direction and concept packaging. Please enquire to confirm the actual product format, contents and final packaging before ordering.' },
    ]} /></div></section>

    <Contact />
    <ScrollExpand className="garden-expand" src={images['garden-aerial'].src} srcSet={images['garden-aerial'].srcSet} startWidth={74} startHeight={70} startRadius={0} scrollDistance={.6} holdDistance={.05} overlayScrim={.18} title={<div className="garden-title"><p className="eyebrow">Take a little nature with you.</p><h2>Back to the<br /><em>good things.</em></h2></div>}><p className="garden-full-copy">A little closer<br /><em>to nature.</em></p></ScrollExpand>
    <QuickView product={quick} onClose={() => setQuick(null)} />
  </div>;
}

