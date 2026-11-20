import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Leaf } from 'lucide-react';
import { findProduct, products } from '../data/catalogue.mjs';
import ResponsiveImage from '../components/ResponsiveImage';
import BottleImage from '../components/BottleImage';
import ProductCard from '../components/ProductCard';
import Accordion from '../components/Accordion';
import { useEnquiry } from '../components/EnquiryContext';

export default function ProductPage() {
  const { slug } = useParams();
  const product = findProduct(slug);
  const [selected, setSelected] = useState(0);
  const { enquire } = useEnquiry();
  if (!product) return <section className="not-found section-gutters"><p className="eyebrow">A little off the garden path</p><h1>Let’s find your way back.</h1><Link className="solid-button" to="/#collection">Explore the collection</Link></section>;
  const images = [{ type: 'bottle', key: product.bottle, label: 'Product concept' }, { type: 'photo', key: product.slug, label: 'The ingredient' }, ...(slug === 'hibiscus' ? [{ type: 'photo', key: 'hibiscus-in-use', label: 'Your everyday ritual' }] : [])];
  const active = images[selected] || images[0];
  const related = products.filter(p => p.slug !== slug).slice(0, 4);

  return <>
    <section className="product-page section-gutters">
      <div className="breadcrumbs"><Link to="/#collection"><ArrowLeft size={14} />The collection</Link><span>/</span><span>{product.name}</span></div>
      <div className="product-layout">
        <div className="product-gallery"><div className={`gallery-main ${active.type === 'bottle' ? 'bottle-image' : ''}`} key={active.key}>
          {active.type === 'bottle' ? <BottleImage product={product} /> : <ResponsiveImage name={active.key} priority sizes="(max-width: 880px) 100vw, 55vw" />}
          <span className="gallery-counter">{String(selected + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}</span>
        </div><div className="gallery-thumbnails" aria-label="Product images">{images.map((image, index) => <button key={image.key} className={selected === index ? 'selected' : ''} onClick={() => setSelected(index)} aria-label={`View ${image.label.toLowerCase()}`} aria-pressed={selected === index}><ResponsiveImage name={image.type === 'bottle' ? `${product.slug}-product` : image.key} sizes="80px" alt="" /></button>)}<span>Good things, seen up close.</span></div></div>
        <div className="product-details"><p className="eyebrow">{product.category}</p><h1>{product.name}</h1><p className="product-latin">{product.latin}</p><p className="product-description">{product.description}</p><div className="product-character"><Leaf size={17} strokeWidth={1.2} /><span>{product.character}</span></div><button className="solid-button product-enquire" onClick={() => enquire(product.slug)}>Enquire about {product.name}<ArrowUpRight size={19} strokeWidth={1.3} /></button><p className="availability-note">A personal conversation, from our collection to your day.</p><Accordion level={2} items={[
          { title: 'The ingredient', content: product.detail },
          { title: 'Your everyday ritual', content: product.ritual },
          { title: 'Availability & product details', content: 'Please enquire for current pricing, available formats, contents and delivery arrangements. The bottle and carton images show concept packaging; final packaging will be confirmed with your enquiry.' },
        ]} /><Link className="text-link product-help" to="/#contact">A question before you begin?</Link></div>
      </div>
    </section>
    <section className="product-ritual section-gutters"><div><p className="eyebrow">Make a little room</p><h2>{product.moment}<em>.</em></h2></div><div><p>{product.ritual}</p><p className="eyebrow">At your pace. In your own way.</p></div></section>
    <section className="related-section section-gutters"><div className="related-heading"><div><p className="eyebrow">A few more good things</p><h2>Naturally <em>curious?</em></h2></div><Link className="text-link" to="/#collection">The whole collection <ArrowUpRight size={17} /></Link></div><div className="product-grid">{related.map(p => <ProductCard key={p.slug} product={p} />)}</div></section>
  </>;
}

