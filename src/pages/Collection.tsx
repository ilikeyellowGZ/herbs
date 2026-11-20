import { useState } from 'react';
import { products } from '../data/catalogue.mjs';
import ProductCard, { type Product } from '../components/ProductCard';
import QuickView from '../components/QuickView';

export default function Collection() {
  const [quick, setQuick] = useState<Product | null>(null);
  return <div className="destination-page"><section id="collection" className="collection section-gutters">
      <div className="collection-intro"><p className="eyebrow">The collection</p><h1>Eight ingredients for<br /><em>everyday rituals.</em></h1><p>A few good things from nature.<br />For your cup, your kitchen, your own kind of day.</p></div>
      <div className="collection-rule"><span>The everyday essentials</span><span>Good things, simply chosen.</span></div>
      <div className="product-grid">{products.map(product => <div key={product.slug}><ProductCard product={product} onOpen={setQuick} /></div>)}</div>
    </section><QuickView product={quick} onClose={() => setQuick(null)} /></div>;
}
