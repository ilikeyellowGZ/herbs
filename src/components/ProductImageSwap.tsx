import ResponsiveImage from './ResponsiveImage';
import type { Product } from './ProductCard';

export default function ProductImageSwap({ product, sizes, priority = false }: { product: Product; sizes?: string; priority?: boolean }) {
  return <span className="product-image-swap">
    <ResponsiveImage name={`${product.slug}-product`} sizes={sizes} priority={priority} />
    <ResponsiveImage name={product.slug} className="product-image-swap__alternate" sizes={sizes} alt="" />
  </span>;
}
