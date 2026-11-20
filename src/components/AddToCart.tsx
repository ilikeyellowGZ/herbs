import { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useCart } from './CartContext';
import QuantityControl from './QuantityControl';
import { MAX_QUANTITY } from '../data/shopping.mjs';
import type { Product } from './ProductCard';

export default function AddToCart({ product, chooseQuantity = false }: { product: Product; chooseQuantity?: boolean }) {
  const { cart, ready, add } = useCart();
  const [quantity, setQuantity] = useState(1);
  const remaining = MAX_QUANTITY - (cart.find(item => item.slug === product.slug)?.quantity || 0);
  const selected = Math.max(1, Math.min(quantity, remaining));
  return <div className="add-to-cart">
    {chooseQuantity && <QuantityControl value={selected} onChange={setQuantity} name={product.name} max={Math.max(1, remaining)} />}
    <button type="button" className="solid-button" disabled={!ready || remaining === 0} aria-label={`Add ${product.name} to bag`} onClick={() => add(product.slug, chooseQuantity ? selected : 1)}>{remaining === 0 ? 'Maximum in bag' : 'Add to bag'}<ShoppingBag size={18} strokeWidth={1.3} /></button>
    {remaining === 0 && <span className="add-limit">Maximum {MAX_QUANTITY} per ingredient.</span>}
  </div>;
}
