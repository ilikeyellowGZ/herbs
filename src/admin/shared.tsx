import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Download, Leaf, RefreshCw, Search, X } from 'lucide-react';
import { api } from '../lib/api';
export function useResource<T>(path: string) {
  const [data, setData] = useState<T | null>(null), [error, setError] = useState(''), [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setData(await api<T>(path)); } catch (e) { setError((e as Error).message); } finally { setLoading(false); }
  }, [path]);
  useEffect(() => { void load(); }, [load]);
  return { data, error, loading, load };
}
export const date = (value: string, time = false) => new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'short', year: 'numeric', ...(time ? { hour: '2-digit', minute: '2-digit' } : {}) }).format(new Date(value));
export const matches = (value: unknown, query: string) => JSON.stringify(value).toLowerCase().includes(query.toLowerCase().trim());
export const label = (value: string) => value.replaceAll('-', ' ').replace(/^./, c => c.toUpperCase());
export function Status({ value }: { value: string }) { return <span className={`admin-status admin-status--${value}`}>{label(value)}</span>; }
export function Empty({ title, children }: { title: string; children: ReactNode }) { return <div className="admin-empty"><Leaf size={32} strokeWidth={1.1} /><h3>{title}</h3><p>{children}</p></div>; }
export function Feedback({ error, loading, retry }: { error: string; loading: boolean; retry: () => void }) {
  if (error) return <div className="admin-error" role="alert"><p>{error}</p><button className="admin-button admin-button--secondary" onClick={retry}>Try again</button></div>;
  return loading ? <p role="status" className="admin-loading">Loading your workspace…</p> : null;
}
export function exportCsv(filename: string, headings: string[], rows: unknown[][]) {
  const cell = (value: unknown) => { const s = String(value ?? ''); return `"${(/^[=+\-@\t\r]/.test(s) ? "'" + s : s).replaceAll('"', '""')}"`; };
  const blob = new Blob(['\uFEFF' + [headings, ...rows].map(row => row.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const href = URL.createObjectURL(blob), link = document.createElement('a'); link.href = href; link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(href), 1000);
}
export function Toolbar({ query, onQuery, placeholder, count, refresh, exporting }: { query: string; onQuery: (value: string) => void; placeholder: string; count: number; refresh: () => void; exporting?: () => void }) {
  return <div className="admin-toolbar"><label className="admin-search"><Search size={18} /><span className="sr-only">{placeholder}</span><input type="search" placeholder={placeholder} value={query} onChange={e => onQuery(e.target.value)} /></label><span className="admin-count">{count} {count === 1 ? 'record' : 'records'}</span><button className="admin-button admin-button--secondary" onClick={refresh} aria-label="Refresh records"><RefreshCw size={16} />Refresh</button>{exporting && <button className="admin-button admin-button--secondary" onClick={exporting}><Download size={16} />Export</button>}</div>;
}
export function Table({ children, name }: { children: ReactNode; name: string }) { return <div className="admin-table-scroll" role="region" aria-label={name} tabIndex={0}><table className="admin-table">{children}</table></div>; }
export function Detail({ title, close, children }: { title: string; close: () => void; children: ReactNode }) {
  return <section className="admin-detail" aria-label={title}><div className="admin-panel-heading"><h2>{title}</h2><button className="admin-icon-button" aria-label="Close details" onClick={close}><X size={20} /></button></div>{children}</section>;
}
