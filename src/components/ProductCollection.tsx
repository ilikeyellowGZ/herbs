import { products } from '../data/catalogue.mjs';
import ProductCard from './ProductCard';

export default function ProductCollection({ headingLevel = 'h2' }: { headingLevel?: 'h1' | 'h2' }) {
  const Heading = headingLevel;
  return <section id="collection" className="collection section-gutters" aria-labelledby="collection-heading">
    <div className="collection-intro"><p className="eyebrow">The collection</p><Heading id="collection-heading">Eight ingredients for<br /><em>everyday rituals.</em></Heading><p>A few good things from nature.<br />For your cup, your kitchen, your own kind of day.</p></div>
    <div className="collection-rule"><span>The everyday essentials</span><span>Good things, simply chosen.</span></div>
    <div className="product-grid">{products.map(product => <div key={product.slug}><ProductCard product={product} /></div>)}</div>
  </section>;
}
