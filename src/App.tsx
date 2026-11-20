import { lazy, Suspense, useEffect } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from 'framer-motion';
import Header from './components/Header';
import Footer from './components/Footer';
import { EnquiryProvider } from './components/EnquiryContext';
import { findProduct } from './data/catalogue.mjs';
import { pages } from './data/pages.mjs';

const Home = lazy(() => import('./pages/Home'));
const Product = lazy(() => import('./pages/Product'));
const Collection = lazy(() => import('./pages/Collection'));
const Rituals = lazy(() => import('./pages/Rituals'));
const Story = lazy(() => import('./pages/Story'));
const Contact = lazy(() => import('./pages/Contact'));
const Faqs = lazy(() => import('./pages/Faqs'));

function NavigationEffects() {
  const { pathname, hash } = useLocation();
  const reduced = useReducedMotion();
  useEffect(() => {
    const product = pathname.startsWith('/products/') ? findProduct(pathname.split('/').pop()) : undefined;
    const page = pages.find(page => page.path === pathname);
    document.title = product || page ? `${product?.name || page?.title} — Herby Health` : 'Herby Health — A little closer to nature';
    const meta = document.querySelector('meta[name="description"]');
    meta?.setAttribute('content', product?.description || page?.description || 'Eight considered ingredients for everyday rituals. Discover Herby Health, a botanical and everyday wellness brand in Gauteng, South Africa.');
    const timer = setTimeout(() => {
      if (hash) {
        const target = document.getElementById(hash.slice(1));
        if (target) { target.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth' }); return; }
      }
      window.scrollTo({ top: 0, behavior: 'instant' });
      if (pathname !== '/') {
        const heading = document.querySelector<HTMLElement>('main h1');
        heading?.setAttribute('tabindex', '-1');
        heading?.focus({ preventScroll: true });
      }
    }, reduced ? 60 : 380);
    return () => clearTimeout(timer);
  }, [pathname, hash, reduced]);
  return null;
}

export default function App() {
  const location = useLocation();
  const reduced = useReducedMotion();
  return <EnquiryProvider><NavigationEffects /><Header /><main id="main" tabIndex={-1}>
    <LazyMotion features={domAnimation}><AnimatePresence mode="wait" initial={false}><m.div key={location.pathname} initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 12 }} animate={{ opacity: 1, y: 0, transitionEnd: { transform: 'none' } }} exit={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : -8 }} transition={{ duration: reduced ? 0 : .28, ease: [.2, .65, .3, 1] }}>
      <Suspense fallback={<div className="page-loading" role="status">A little nature, on its way…</div>}>
      <Routes location={location}><Route path="/" element={<Home />} /><Route path="/collection" element={<Collection />} /><Route path="/rituals" element={<Rituals />} /><Route path="/our-story" element={<Story />} /><Route path="/contact" element={<Contact />} /><Route path="/faqs" element={<Faqs />} /><Route path="/products/:slug" element={<Product key={location.pathname} />} /><Route path="*" element={<section className="not-found section-gutters"><p className="eyebrow">A little off the garden path</p><h1>This page is still growing.</h1><Link className="solid-button" to="/">Back to Herby Health</Link></section>} /></Routes>
      </Suspense>
    </m.div></AnimatePresence></LazyMotion>
  </main><Footer /></EnquiryProvider>;
}
