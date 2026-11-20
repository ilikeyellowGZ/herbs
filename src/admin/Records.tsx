import { useState } from 'react';
import { money } from '../data/shopping.mjs';
import { useResource, Toolbar, Table, Feedback, matches, Empty, exportCsv, date } from './shared';
import type { Customer, Activity } from './types';

export function Customers() {
  const { data, error, loading, load } = useResource<Customer[]>('/admin/customers');
  const [query, setQuery] = useState(''); const visible = (data || []).filter(c => matches([c.name, c.email, c.phone], query));
  return <><Feedback error={error} loading={loading} retry={load} /><Toolbar query={query} onQuery={setQuery} placeholder="Search customers" count={visible.length} refresh={load} exporting={() => exportCsv('herby-customers.csv', ['Name', 'Email', 'Phone', 'Orders', 'Paid ZAR', 'Enquiries', 'Last contact'], visible.map(c => [c.name, c.email, c.phone, c.orders, c.paid / 100, c.enquiries, c.lastSeen]))} /><section className="admin-panel">{visible.length ? <Table name="Customers"><thead><tr><th>Customer</th><th>Contact</th><th>Orders</th><th>Paid total</th><th>Enquiries</th><th>Last contact</th></tr></thead><tbody>{visible.map(c => <tr key={c.email}><td><strong>{c.name}</strong></td><td><a className="admin-inline-link" href={`mailto:${c.email}`}>{c.email}</a><small>{c.phone}</small></td><td>{c.orders}</td><td>{money(c.paid)}</td><td>{c.enquiries}</td><td>{date(c.lastSeen)}</td></tr>)}</tbody></Table> : !loading && <Empty title="Every connection starts somewhere.">{query ? 'No customers match your search.' : 'Customer contact records are created from submitted orders and enquiries. No customer registration is needed.'}</Empty>}</section><p className="admin-footnote">Contacts are grouped by email address. Details here are private and available only to the owner.</p></>;
}
export function ActivityLog() {
  const { data, error, loading, load } = useResource<Activity[]>('/admin/activity');
  const [query, setQuery] = useState(''); const visible = (data || []).filter(a => matches([a.action, a.actor, a.target], query));
  return <><Feedback error={error} loading={loading} retry={load} /><Toolbar query={query} onQuery={setQuery} placeholder="Search activity" count={visible.length} refresh={load} exporting={() => exportCsv('herby-activity.csv', ['Action', 'Target', 'Actor', 'Date'], visible.map(a => [a.action, a.target, a.actor, a.createdAt]))} /><section className="admin-panel">{visible.length ? <Table name="Workspace activity"><thead><tr><th>Action</th><th>Record</th><th>By</th><th>When</th></tr></thead><tbody>{visible.map(a => <tr key={a.id}><td>{a.action}</td><td>{a.target}</td><td>{a.actor}</td><td>{date(a.createdAt, true)}</td></tr>)}</tbody></Table> : !loading && <Empty title="A clear record of the little things.">Owner sign-ins and changes to orders, ingredients, enquiries and settings appear here.</Empty>}</section><p className="admin-footnote">Latest 100 workspace events. Passwords and session tokens are never included.</p></>;
}
