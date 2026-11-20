import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Leaf } from 'lucide-react';
import { useStore } from '../components/StoreContext';
import { money } from '../data/shopping.mjs';
import ProductGallery from '../components/ProductGallery';
import ProductCard from '../components/ProductCard';
import ProductPrice from '../components/ProductPrice';
import ProductGuide from '../components/ProductGuide';
import { useEnquiry } from '../components/EnquiryContext';
import AddToCart from '../components/AddToCart';

export default function ProductPage() {
  const { slug } = useParams();
  const { products, settings } = useStore();
  const product = products.find(p => p.slug === slug && p.active !== false);
  const { enquire } = useEnquiry();
  if (!product) return <section className="not-found section-gutters"><p className="eyebrow">A little off the garden path</p><h1>Let’s find your way back.</h1><Link className="solid-button" to="/collection">Explore the collection</Link></section>;
  const related = products.filter(p => p.slug !== slug && p.active !== false).slice(0, 4);

  return <>
    <section className="product-page section-gutters">
      <div className="breadcrumbs"><Link to="/collection"><ArrowLeft size={14} />The collection</Link><span>/</span><span>{product.name}</span></div>
      <div className="product-layout">
        <ProductGallery key={product.slug} product={product} />
        <div className="product-details"><p className="eyebrow">{product.category}</p><h1>{product.name}</h1><p className="product-latin">{product.latin}</p><p className="product-description">{product.description}</p><div className="product-character"><Leaf size={17} strokeWidth={1.2} /><span>{product.character}</span></div><ProductPrice product={product} /><AddToCart product={product} chooseQuantity /><p className="serving-note">{product.serving}</p><button className="text-link product-enquire" onClick={() => enquire(product.slug)}>Enquire about {product.name}<ArrowUpRight size={19} strokeWidth={1.3} /></button><p className="availability-note">Courier {money(settings.courierFee)} · Free from {money(settings.freeDelivery)}{settings.collectionEnabled && ' · Free Gauteng collection'}. We confirm final labels, availability and arrangements before accepting your order.</p><ProductGuide product={product} level={2} /><Link className="text-link product-help" to="/contact">A question before you begin?</Link></div>
      </div>
    </section>
    <section className="product-ritual section-gutters"><div><p className="eyebrow">Make a little room</p><h2>{product.moment}<em>.</em></h2></div><div><p>{product.ritual}</p><p className="eyebrow">At your pace. In your own way.</p></div></section>
    <section className="related-section section-gutters"><div className="related-heading"><div><p className="eyebrow">A few more good things</p><h2>Naturally <em>curious?</em></h2></div><Link className="text-link" to="/collection">The whole collection <ArrowUpRight size={17} /></Link></div><div className="product-grid">{related.map(p => <ProductCard key={p.slug} product={p} />)}</div></section>
  </>;
}

