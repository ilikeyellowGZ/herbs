import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import ResponsiveImage from './ResponsiveImage';
import { useEnquiry } from './EnquiryContext';
import type { Product } from './ProductCard';
import useDialogFocus from './useDialogFocus';
import ProductCartLink from './ProductCartLink';
import ProductGuide from './ProductGuide';

export default function QuickView({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useDialogFocus(dialog);
  const { enquire } = useEnquiry();
  useEffect(() => { if (product && !dialog.current?.open) dialog.current?.showModal(); else if (!product) dialog.current?.close(); }, [product]);
  return <dialog className="quick-dialog catalogue-dialog" ref={dialog} aria-labelledby="quick-title" onClose={onClose}>
    {product && <><div className="quick-visual"><ResponsiveImage name={product.slug === 'hibiscus' ? 'hibiscus' : `${product.slug}-product`} sizes="(max-width: 768px) 90vw, 480px" /><span>{product.character}</span></div><div className="quick-content"><div className="quick-heading"><p className="eyebrow">{product.category}</p><button className="icon-button" onClick={() => dialog.current?.close()} aria-label="Close ingredient details"><X strokeWidth={1.2} /></button></div><h2 id="quick-title">{product.name}</h2><p>{product.description}</p><ProductCartLink product={product} onNavigate={() => dialog.current?.close()} /><p className="serving-note">{product.serving}</p><button className="text-link" onClick={() => { dialog.current?.close(); enquire(product.slug); }}>Enquire about {product.name}</button><ProductGuide product={product} /><Link className="text-link" to={`/products/${product.slug}`} onClick={() => dialog.current?.close()}>View full product page</Link></div></>}
  </dialog>;
}
