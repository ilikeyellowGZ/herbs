import { useEffect, useState, type FormEvent } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Activity, ExternalLink, Inbox, LayoutDashboard, Leaf, LogOut, Package, Settings as SettingsIcon, ShieldCheck, ShoppingBag, Users } from 'lucide-react';
import { api, json, setSecurityToken } from '../lib/api';
import Overview from './Overview';
import Products from './Products';
import Orders from './Orders';
import InboxPage from './Inbox';
import Settings from './Settings';
import { Customers, ActivityLog } from './Records';
import './admin.css';

type Session = { user: { email: string } | null; csrf: string; configured: boolean };
const navigation = [
  { id: '', label: 'Overview', Icon: LayoutDashboard, title: 'A little room to grow.', description: 'The everyday picture of your business.' },
  { id: 'orders', label: 'Orders', Icon: ShoppingBag, title: 'Good things, on their way.', description: 'Review requests, confirm arrangements and keep every order moving.' },
  { id: 'products', label: 'Products', Icon: Package, title: 'Your everyday essentials.', description: 'Care for your collection, pricing and stock.' },
  { id: 'customers', label: 'Customers', Icon: Users, title: 'People at the heart of it.', description: 'The connections growing around your collection.' },
  { id: 'enquiries', label: 'Enquiries', Icon: Inbox, title: 'A conversation starts here.', description: 'A private home for customer questions and attachments.' },
  { id: 'settings', label: 'Settings', Icon: SettingsIcon, title: 'Grounded in the details.', description: 'Contact information, delivery and the way your store works.' },
  { id: 'activity', label: 'Activity', Icon: Activity, title: 'Every little thing, recorded.', description: 'A clear trail of changes in your workspace.' },
];
function SignIn({ session, signedIn }: { session: Session; signedIn: (session: Session) => void }) {
  const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try { signedIn(await api<Session>('/auth/login', json('POST', { email, password }))); } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return <main className="admin-login" id="main"><div className="admin-login-story"><Link to="/" className="admin-brand">Herby Health<span>Small rituals. Deep roots.</span></Link><div><Leaf size={44} strokeWidth={1} /><h1>A little care.<br /><em>A lot of possibility.</em></h1><p>Your collection, your customers and all the good things growing in between.</p></div><p className="admin-login-caption">The owner workspace</p></div><div className="admin-login-side"><div className="admin-login-form"><ShieldCheck size={28} strokeWidth={1.2} /><p className="eyebrow">Herby Health · Owner access</p><h2>{session.configured ? 'Welcome back.' : 'Put down your roots.'}</h2>{session.configured ? <><p>Sign in to tend to your business.</p><form onSubmit={submit} className="admin-form"><label>Email address<input type="email" autoComplete="username" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} /></label><label>Password<input type="password" autoComplete="current-password" required maxLength={128} value={password} onChange={e => setPassword(e.target.value)} /></label>{error && <p className="admin-error" role="alert">{error}</p>}<button className="admin-button" disabled={busy}>{busy ? 'Signing in…' : 'Sign in to your workspace'}</button></form><p className="admin-footnote">Need to reset access? Run <code>npm run admin:create -- --reset</code> in your server terminal.</p></> : <div className="admin-setup"><p>Create your owner account in the project terminal:</p><code>npm run admin:create</code><p>Choose your email and a password of at least 12 characters, then reload this page to sign in.</p><button className="admin-button" onClick={() => window.location.reload()}>I’ve created my account</button></div>}<Link className="admin-inline-link" to="/">Back to the storefront</Link></div></div></main>;
}
export default function Admin() {
  const [session, setSession] = useState<Session | null>(null), [error, setError] = useState('');
  const location = useLocation(), section = location.pathname.split('/')[2] || '';
  const current = navigation.find(item => item.id === section);
  const accept = (next: Session) => { setSecurityToken(next.csrf); setSession(next); };
  useEffect(() => {
    let active = true;
    void api<Session>('/auth/session').then(next => { if (active) { setSecurityToken(next.csrf); setSession(next); } }).catch(e => { if (active) setError(e.message); });
    const expire = () => { setSecurityToken(''); setSession(previous => previous ? { ...previous, user: null, csrf: '' } : null); };
    window.addEventListener('owner-session-expired', expire);
    return () => { active = false; window.removeEventListener('owner-session-expired', expire); };
  }, []);
  useEffect(() => {
    document.title = `${current?.label || 'Workspace'} — Herby Health`;
    const meta = document.createElement('meta'); meta.name = 'robots'; meta.content = 'noindex,nofollow'; document.head.append(meta);
    return () => meta.remove();
  }, [current]);
  async function logout() { try { await api('/auth/logout', json('POST', {})); accept({ user: null, csrf: '', configured: true }); } catch (e) { setError((e as Error).message); } }
  if (!session) return <main id="main" className="admin-connecting"><Leaf size={32} strokeWidth={1} /><h1>Your owner workspace.</h1>{error ? <><p role="alert">{error}</p><button className="admin-button" onClick={() => window.location.reload()}>Try again</button></> : <p role="status">Opening the garden gate…</p>}<Link to="/">Back to the storefront</Link></main>;
  if (!session.user) return <SignIn session={session} signedIn={accept} />;
  return <div className="admin-shell"><aside className="admin-sidebar"><Link className="admin-brand" to="/admin">Herby Health<span>The owner workspace</span></Link><p className="admin-nav-label">Tend to your business</p><nav aria-label="Dashboard navigation">{navigation.map(({ id, label, Icon }) => <NavLink end={id === ''} key={id} to={`/admin${id ? '/' + id : ''}`}><Icon size={18} strokeWidth={1.4} />{label}</NavLink>)}</nav><div className="admin-sidebar-bottom"><Link to="/" className="admin-store-link"><ExternalLink size={17} />View storefront</Link><div className="admin-owner"><span className="admin-avatar">{session.user.email[0].toUpperCase()}</span><span><strong>Store owner</strong><small>{session.user.email}</small></span><button aria-label="Sign out" onClick={logout}><LogOut size={18} /></button></div></div></aside><main id="main" className="admin-main"><header className="admin-topbar"><span>Workspace <span>/</span> {current?.label || 'Page not found'}</span><Link to="/">View store<ExternalLink size={14} /></Link></header><div className="admin-content"><div className="admin-page-heading"><div><p className="eyebrow">Herby Health · {current?.label || 'Workspace'}</p><h1>{current?.title || 'A different garden path.'}</h1><p>{current?.description || 'Choose a page from the workspace navigation.'}</p></div><span className="admin-owner-label"><ShieldCheck size={16} />Owner workspace</span></div>{error && <p className="admin-error" role="alert">{error}</p>}{section === '' ? <Overview /> : section === 'orders' ? <Orders /> : section === 'products' ? <Products /> : section === 'customers' ? <Customers /> : section === 'enquiries' ? <InboxPage /> : section === 'settings' ? <Settings /> : section === 'activity' ? <ActivityLog /> : <Link className="admin-button" to="/admin">Back to overview</Link>}<footer className="admin-footer"><span>Small rituals. Deep roots.</span><span>Herby Health owner workspace</span></footer></div></main></div>;
}
