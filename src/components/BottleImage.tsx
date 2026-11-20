import type { Product } from './ProductCard';
import ResponsiveImage from './ResponsiveImage';

export default function BottleImage({ product }: { product: Product }) {
  return <ResponsiveImage name={`${product.slug}-product`} priority sizes="(min-width: 881px) 48vw, (min-width: 640px) 600px, calc(100vw - 40px)" alt={`Herby Health ${product.name} amber bottle, concept packaging`} />;
}
