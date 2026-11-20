import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { CART_KEY, MAX_QUANTITY, cartSummary, changeQuantity, normaliseCart } from '../data/shopping.mjs';
import { useStore } from './StoreContext';

export type CartEntry = { slug: string; quantity: number };
type CartContextValue = {
  cart: CartEntry[]; ready: boolean; count: number; open: boolean; notice: string; storageError: boolean;
  setOpen: (value: boolean) => void; add: (slug: string, quantity?: number) => void;
  setQuantity: (slug: string, quantity: number) => void;
  clear: () => void;
  summarise: (method?: string) => ReturnType<typeof cartSummary>;
};
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { products, settings } = useStore();
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [storageError, setStorageError] = useState(false);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    try { setCart(normaliseCart(JSON.parse(localStorage.getItem(CART_KEY) || '[]'))); }
    catch { setCart([]); }
    setReady(true);
    const sync = (event: StorageEvent) => {
      if (event.key !== CART_KEY && event.key !== null) return;
      try { setCart(normaliseCart(JSON.parse(event.newValue || '[]'))); } catch { setCart([]); }
    };
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('storage', sync); clearTimeout(noticeTimer.current); };
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); setStorageError(false); }
    catch { setStorageError(true); }
  }, [cart, ready]);
  const add = useCallback((slug: string, quantity = 1) => {
    if (!Number.isSafeInteger(quantity) || quantity < 1) return;
    setCart(previous => changeQuantity(previous, slug, (previous.find(item => item.slug === slug)?.quantity || 0) + quantity));
    setNotice('Added to your bag.');
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(''), 3500);
  }, []);
  const setQuantity = useCallback((slug: string, quantity: number) => setCart(previous => changeQuantity(previous, slug, quantity)), []);
  const clear = useCallback(() => setCart([]), []);
  const summarise = useCallback((method = 'courier') => cartSummary(cart, method, products, settings), [cart, products, settings]);
  const count = useMemo(() => cartSummary(cart).count, [cart]);
  const value = useMemo(() => ({ cart, ready, count, open, notice, storageError, setOpen, add, setQuantity, clear, summarise }), [cart, ready, count, open, notice, storageError, add, setQuantity, clear, summarise]);
  return <CartContext.Provider value={value}>{children}<div className={`cart-notice ${notice ? 'cart-notice--visible' : ''}`} role="status" aria-live="polite">{notice}</div></CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('CartProvider is required');
  return context;
}
