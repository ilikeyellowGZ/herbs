import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import type { Product } from './ProductCard';

export default function ProductCartLink({ product, onNavigate }: { product: Product; onNavigate?: () => void }) {
  return <div className="add-to-cart"><Link className="solid-button" to={`/products/${product.slug}`} aria-label={`Add ${product.name} to cart`} onClick={onNavigate}><span>Add to cart</span><ShoppingBag size={18} strokeWidth={1.3} /></Link></div>;
}
