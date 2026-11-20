import { useState, useSyncExternalStore } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, X, ChevronDown, Leaf, CupSoda, BookOpen, SlidersHorizontal } from 'lucide-react';
import { useStore } from './StoreContext';
import { collectionCategories, sortOptions, queryProducts } from '../data/catalogue-query.mjs';
import type { Product } from './ProductCard';
import ProductImageSwap from './ProductImageSwap';
import ProductCartLink from './ProductCartLink';
import QuickView from './QuickView';
import Accordion from './Accordion';

const subscribeToHydration = () => () => {};
const clientReady = () => true;
const serverReady = () => false;
const collectionSortOptions = sortOptions.filter(option => !option.value.startsWith('price'));

function CollectionCard({ product, onOpen, priority }: { product: Product; onOpen: (product: Product) => void; priority: boolean }) {
  return <article className="catalogue-card" aria-labelledby={`ingredient-${product.slug}`}>
    <button className="catalogue-card__photo" onClick={() => onOpen(product)} aria-label={`Get to know ${product.name}`} aria-haspopup="dialog">
      <ProductImageSwap product={product} priority={priority} sizes="(max-width: 640px) calc(100vw - 48px), (max-width: 1100px) 46vw, (min-width: 1440px) 448px, 31vw" />
      <span>Get to know {product.name}<BookOpen size={18} strokeWidth={1.4} /></span>
    </button>
    <div className="catalogue-card__body"><p className="catalogue-category">{product.category}</p><h2 id={`ingredient-${product.slug}`}>{product.name}</h2><p className="catalogue-description">{product.guide.summary}</p><p className="catalogue-benefit"><Leaf size={16} strokeWidth={1.4} /><span>{product.guide.benefits[0]}</span></p><div className="catalogue-card__bottom"><ProductCartLink product={product} /><button className="catalogue-guide-button" onClick={() => onOpen(product)} aria-label={`Benefits, use & details for ${product.name}`} aria-haspopup="dialog">Benefits, use & details<BookOpen size={16} strokeWidth={1.4} /></button></div></div>
  </article>;
}

export default function CatalogueBrowser() {
  const { products: catalogue } = useStore();
  const products = catalogue.filter(p => p.active !== false);
  const [quick, setQuick] = useState<Product | null>(null);
  const [params, setParams] = useSearchParams();
  // Static HTML is generated without a query string. Match it during hydration,
  // then read the visitor's shareable filters once React takes over.
  const hydrated = useSyncExternalStore(subscribeToHydration, clientReady, serverReady);
  const query = hydrated ? params.get('q') || '' : '';
  const category = hydrated && collectionCategories.some(item => item.value === params.get('category')) ? params.get('category')! : 'all';
  const requestedSort = hydrated ? params.get('sort') || 'featured' : 'featured';
  const sort = collectionSortOptions.some(item => item.value === requestedSort) ? requestedSort : 'featured';
  const visible: Product[] = queryProducts(products, { query, category, sort });
  const filtered = Boolean(query || category !== 'all');

  function updateParam(key: string, value: string, replace = false) {
    setParams(previous => {
      const next = new URLSearchParams(previous);
      if (!value || value === 'all' || value === 'featured') next.delete(key);
      else next.set(key, value);
      return next;
    }, { replace, preventScrollReset: true });
  }
  function reset() { setParams({}, { preventScrollReset: true }); }

  return <>
    <section id="collection" className="catalogue section-gutters" aria-labelledby="collection-title">
      <div className="catalogue-intro"><p className="eyebrow">The Herby Health collection</p><h1 id="collection-title">Good things from nature.<br /><em>For your kind of everyday.</em></h1><p>Eight considered ingredients. From the first cup to the slow-cooked supper, find a little ritual that feels like you.</p><a className="text-link" href="#collection-products">Find your ingredient</a></div>
      <div className="catalogue-promise"><span><Leaf size={19} strokeWidth={1.3} />Know the benefits</span><span><CupSoda size={19} strokeWidth={1.3} />Make it part of your day</span><span><BookOpen size={19} strokeWidth={1.3} />Read before you begin</span></div>
      <div id="collection-products" className="catalogue-browser">
        <div className="catalogue-section-heading"><h2>The everyday essentials</h2><a className="text-link" href="#collection-help">A little guidance</a></div>
        <div className="catalogue-toolbar"><div className="catalogue-filters" role="group" aria-label="Filter ingredients by category">{collectionCategories.map(item => <button key={item.value} aria-pressed={category === item.value} onClick={() => updateParam('category', item.value)}>{item.label}<span>{item.value === 'all' ? products.length : products.filter(p => p.collection === item.value).length}</span></button>)}</div><div className="catalogue-search"><label className="sr-only" htmlFor="ingredient-search">Search ingredients</label><Search size={18} strokeWidth={1.4} /><input id="ingredient-search" type="search" value={query} onChange={event => updateParam('q', event.target.value, true)} placeholder="Find an ingredient…" />{query && <button type="button" aria-label="Clear ingredient search" onClick={() => updateParam('q', '', true)}><X size={17} strokeWidth={1.4} /></button>}</div></div>
        <div className="catalogue-results-bar"><p role="status" aria-live="polite" aria-atomic="true">{visible.length} of {products.length} ingredients{query.trim() && <> matching “{query.trim()}”</>}</p><div className="catalogue-sort"><SlidersHorizontal size={16} strokeWidth={1.3} /><label htmlFor="collection-sort">Sort by</label><div className="catalogue-select"><select id="collection-sort" value={sort} onChange={event => updateParam('sort', event.target.value)}>{collectionSortOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select><ChevronDown size={15} strokeWidth={1.4} /></div></div></div>
        {filtered && visible.length > 0 && <button className="catalogue-reset" onClick={reset}>Clear filters<X size={14} /></button>}
        {visible.length > 0 ? <div className="catalogue-grid">{visible.map((product, index) => <CollectionCard key={product.slug} product={product} onOpen={setQuick} priority={index === 0} />)}</div> : <div className="catalogue-empty"><Leaf size={32} strokeWidth={1.1} /><h2>A different little path?</h2><p>No ingredients match your search. Try another name or explore the whole collection.</p><button className="solid-button" onClick={reset}>Show all ingredients</button></div>}
      </div>
    </section>
    <section id="collection-help" className="collection-help section-gutters" aria-labelledby="collection-help-title"><div><p className="eyebrow">A little guidance</p><h2 id="collection-help-title">Choose with curiosity.<br /><em>Begin with care.</em></h2><p>A good ritual starts with knowing what you’re choosing. Open any ingredient guide for benefits, preparation, storage and things to keep in mind.</p><Link className="text-link" to="/contact">Talk to us about your questions</Link></div><Accordion items={[
      { title: 'Where should I begin?', content: 'Start with how you would like to use an ingredient: a tea, something for your pantry, or a supplement to discuss with a practitioner. Filter by category, then open the guide for flavour, preparation, potential benefits and suitability.' },
      { title: 'How much should I take?', content: 'Food preparation and supplement dosage are different. Follow the actual product label for amounts and frequency. We confirm the format and directions on enquiry; do not assume a universal scoop, capsule count or daily dose.' },
      { title: 'What are the prices and pack sizes?', content: 'Open a product page for its current price, pack size and product form. Select Add to cart to visit that page, choose your quantity and add the ingredient to your bag. Confirm final labels and arrangements with us before paying.' },
      { title: 'What about allergies and medication?', content: 'Request the complete ingredient list, allergen and cross-contact information for the actual product. Supplements can interact with medicines. Speak with a pharmacist or clinician if you take medication, have a condition, are pregnant or breastfeeding, or are choosing for a child.' },
      { title: 'How do delivery and enquiries work?', content: 'Checkout shows current courier and collection options and the full total. Submit an order request to receive a reference. We confirm availability, payment and delivery arrangements directly. The contact form sends messages and optional attachments to our private inbox.' },
    ]} /></section>
    <QuickView product={quick} onClose={() => setQuick(null)} />
  </>;
}
