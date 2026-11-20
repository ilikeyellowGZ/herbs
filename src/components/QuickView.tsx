import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import ResponsiveImage from './ResponsiveImage';
import { useEnquiry } from './EnquiryContext';
import type { Product } from './ProductCard';
import useDialogFocus from './useDialogFocus';

export default function QuickView({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useDialogFocus(dialog);
  const { enquire } = useEnquiry();
  useEffect(() => { if (product && !dialog.current?.open) dialog.current?.showModal(); else if (!product) dialog.current?.close(); }, [product]);
  return <dialog className="quick-dialog" ref={dialog} aria-labelledby="quick-title" onClose={onClose}>
    {product && <><button className="icon-button quick-close" onClick={() => dialog.current?.close()} aria-label="Close ingredient details"><X strokeWidth={1.2} /></button><ResponsiveImage name={product.slug === 'hibiscus' ? 'hibiscus' : `${product.slug}-product`} sizes="(max-width: 640px) 100vw, 520px" /><div className="quick-content"><p className="eyebrow">{product.category}</p><h2 id="quick-title">{product.name}</h2><p>{product.description}</p><h3>Your everyday ritual</h3><p>{product.ritual}</p><button className="solid-button" onClick={() => { dialog.current?.close(); enquire(product.slug); }}>Enquire about {product.name}</button><Link className="text-link" to={`/products/${product.slug}`} onClick={() => dialog.current?.close()}>Discover the ingredient</Link></div></>}
  </dialog>;
}
