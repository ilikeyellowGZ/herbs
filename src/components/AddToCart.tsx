import { useEffect, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useCart } from './CartContext';
import QuantityControl from './QuantityControl';
import { MAX_QUANTITY } from '../data/shopping.mjs';
import type { Product } from './ProductCard';
import { useStore } from './StoreContext';

export default function AddToCart({ product, chooseQuantity = false }: { product: Product; chooseQuantity?: boolean }) {
  const { cart, ready, add } = useCart();
  const { connected, loading, products } = useStore();
  const unavailable = products.find(p => p.slug === product.slug)?.available === false;
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  useEffect(() => { if (!added) return; const timer = setTimeout(() => setAdded(false), 2000); return () => clearTimeout(timer); }, [added]);
  const remaining = MAX_QUANTITY - (cart.find(item => item.slug === product.slug)?.quantity || 0);
  const selected = Math.max(1, Math.min(quantity, remaining));
  return <div className="add-to-cart">
    {chooseQuantity && <QuantityControl value={selected} onChange={setQuantity} name={product.name} max={Math.max(1, remaining)} />}
    <button type="button" className="solid-button" disabled={!ready || !connected || unavailable || remaining === 0} aria-label={`Add ${product.name} to bag`} onClick={() => { add(product.slug, chooseQuantity ? selected : 1); setAdded(true); }}><span aria-live="polite">{loading ? 'Checking availability' : !connected ? 'Shop temporarily unavailable' : unavailable ? 'Out of stock' : remaining === 0 ? 'Maximum in bag' : added ? 'Added to bag' : 'Add to bag'}</span><ShoppingBag size={18} strokeWidth={1.3} /></button>
    {remaining === 0 && <span className="add-limit">Maximum {MAX_QUANTITY} per ingredient.</span>}
  </div>;
}
