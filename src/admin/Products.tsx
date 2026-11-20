import { useState, type FormEvent } from 'react';
import { Pencil, Save } from 'lucide-react';
import { api, json } from '../lib/api';
import { money } from '../data/shopping.mjs';
import { useStore } from '../components/StoreContext';
import ResponsiveImage from '../components/ResponsiveImage';
import { useResource, Toolbar, Table, Feedback, Status, Detail, matches, Empty, exportCsv } from './shared';
import type { AdminProduct } from './types';

function Editor({ product, close, saved }: { product: AdminProduct; close: () => void; saved: () => Promise<void> }) {
  const [draft, setDraft] = useState(product), [stock, setStock] = useState(product.stock === null ? '' : String(product.stock)), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const { refresh } = useStore();
  const update = (key: keyof AdminProduct, value: string | number | boolean) => setDraft(p => ({ ...p, [key]: value }));
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try { await api(`/admin/products/${product.slug}`, json('PATCH', { ...draft, stock: stock === '' ? null : Number(stock) })); await saved(); await refresh(); close(); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return <Detail title={`Edit ${product.name}`} close={close}><form onSubmit={submit} className="admin-form"><label>Ingredient name<input required maxLength={120} value={draft.name} onChange={e => update('name', e.target.value)} /></label><label>Category<input required maxLength={100} value={draft.category} onChange={e => update('category', e.target.value)} /></label><label>Description<textarea required rows={4} maxLength={4000} value={draft.description} onChange={e => update('description', e.target.value)} /></label><div className="admin-fields"><label>Price (ZAR)<input type="number" min="0" max="100000" step="0.01" required value={draft.price} onChange={e => update('price', Number(e.target.value))} /></label><label>Pack size<input required maxLength={80} value={draft.packSize} onChange={e => update('packSize', e.target.value)} /></label></div><label>Product form<input required maxLength={160} value={draft.form} onChange={e => update('form', e.target.value)} /></label><label>Units in stock<input type="number" min="0" max="1000000" step="1" placeholder="Untracked" value={stock} onChange={e => setStock(e.target.value)} /><small>Leave blank for untracked stock. Use 0 to mark sold out. New orders reserve tracked units.</small></label><label className="admin-checkbox"><input type="checkbox" checked={draft.active} onChange={e => update('active', e.target.checked)} />Visible in the collection</label>{error && <p className="admin-error" role="alert">{error}</p>}<div className="admin-form-actions"><button className="admin-button" disabled={busy}><Save size={16} />{busy ? 'Saving…' : 'Save ingredient'}</button><button className="admin-button admin-button--secondary" type="button" onClick={close}>Cancel</button></div></form></Detail>;
}
export default function Products() {
  const { data, error, loading, load } = useResource<AdminProduct[]>('/admin/products');
  const [query, setQuery] = useState(''), [selected, setSelected] = useState<AdminProduct | null>(null);
  const visible = (data || []).filter(p => matches([p.name, p.category, p.slug], query));
  return <><Feedback error={error} loading={loading} retry={load} /><Toolbar query={query} onQuery={setQuery} placeholder="Search ingredients" count={visible.length} refresh={load} exporting={() => exportCsv('herby-products.csv', ['Ingredient', 'SKU', 'Price ZAR', 'Stock', 'Visible'], visible.map(p => [p.name, p.slug, p.price, p.stock ?? 'Untracked', p.active]))} /><div className={selected ? 'admin-split' : ''}><section className="admin-panel">{visible.length ? <Table name="Ingredients and stock"><thead><tr><th>Ingredient</th><th>Price</th><th>Stock</th><th>Availability</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{visible.map(p => <tr key={p.slug}><td><div className="admin-product-cell"><div className="admin-product-image"><ResponsiveImage name={`${p.slug}-product`} sizes="48px" alt="" /></div><div><strong>{p.name}</strong><small>{p.packSize} · {p.form}</small></div></div></td><td>{money(Math.round(p.price * 100))}</td><td>{p.stock === null ? <span className="admin-muted">Untracked</span> : `${p.stock} units`}</td><td><Status value={!p.active ? 'hidden' : p.stock === 0 ? 'out-of-stock' : 'active'} /></td><td><button className="admin-icon-button" aria-label={`Edit ${p.name}`} onClick={() => setSelected(p)}><Pencil size={17} /></button></td></tr>)}</tbody></Table> : !loading && <Empty title="No ingredients found.">Try another ingredient name or category.</Empty>}</section>{selected && <Editor key={selected.slug} product={selected} close={() => setSelected(null)} saved={load} />}</div><p className="admin-footnote">The eight ingredient guides and photographs are managed in the site source. Changes here update storefront pricing, descriptions, availability and inventory.</p></>;
}
