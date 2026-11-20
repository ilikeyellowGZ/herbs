import { formatPrice } from '../data/catalogue-query.mjs';
import type { Product } from './ProductCard';

export default function ProductPrice({ product }: { product: Product }) {
  return <div className="catalogue-price"><p>{formatPrice(product)}</p><span>{product.packSize} · {product.form}</span></div>;
}
