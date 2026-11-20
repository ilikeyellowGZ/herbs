import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { products as initialProducts } from '../data/catalogue.mjs';
import { api } from '../lib/api';

export type StoreProduct = typeof initialProducts[number] & { active?: boolean; available?: boolean };
export type StoreSettings = { businessName: string; email: string; phone: string; address: string; instagram: string; courierFee: number; freeDelivery: number; collectionEnabled: boolean };
export const defaultSettings: StoreSettings = { businessName: 'Herby Health', email: '', phone: '', address: '', instagram: '', courierFee: 7500, freeDelivery: 65000, collectionEnabled: true };
type PublicCatalogue = { products: Partial<StoreProduct>[]; settings: StoreSettings };
type StoreValue = { products: StoreProduct[]; settings: StoreSettings; connected: boolean; loading: boolean; refresh: () => Promise<void> };
const StoreContext = createContext<StoreValue | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<PublicCatalogue | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    try { const next = await api<PublicCatalogue>('/catalogue'); setData(next); setConnected(true); }
    catch { setConnected(false); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    void refresh();
    const focus = () => { if (!document.hidden) void refresh(); };
    window.addEventListener('focus', focus); document.addEventListener('visibilitychange', focus);
    const timer = setInterval(focus, 60000);
    return () => { window.removeEventListener('focus', focus); document.removeEventListener('visibilitychange', focus); clearInterval(timer); };
  }, [refresh]);
  const products = useMemo(() => initialProducts.map(p => ({ ...p, ...data?.products.find(item => item.slug === p.slug) })), [data]);
  const value = useMemo(() => ({ products, settings: data?.settings || defaultSettings, connected, loading, refresh }), [products, data, connected, loading, refresh]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
export function useStore() { const value = useContext(StoreContext); if (!value) throw new Error('StoreProvider is required'); return value; }
