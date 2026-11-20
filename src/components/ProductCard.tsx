import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import ProductImageSwap from './ProductImageSwap';
import ProductPrice from './ProductPrice';
import AddToCart from './AddToCart';
import type { products } from '../data/catalogue.mjs';

export type Product = typeof products[number];
export default function ProductCard({ product, onOpen }: { product: Product; onOpen?: (product: Product) => void }) {
  const content = <>
    <div className="product-card__image"><ProductImageSwap product={product} /><span className="product-card__explore">Explore ingredient <ArrowUpRight size={18} strokeWidth={1.3} /></span></div>
    <div className="product-card__caption"><p className="eyebrow">{product.category}</p><div className="product-card__name"><h3>{product.name}</h3><ArrowUpRight size={21} strokeWidth={1.1} /></div><p className="product-note">{product.note}</p></div>
  </>;
  const linkedContent = onOpen
    ? <button type="button" className="product-card" data-ingredient={product.slug} aria-haspopup="dialog" onClick={() => onOpen(product)}>{content}</button>
    : <Link to={`/products/${product.slug}`} className="product-card">{content}</Link>;
  return <article className="shop-product-card">{linkedContent}<div className="shop-product-card__purchase"><ProductPrice product={product} /><AddToCart product={product} /></div></article>;
}
