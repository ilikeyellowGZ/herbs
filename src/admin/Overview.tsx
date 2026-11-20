import { Link } from 'react-router-dom';
import { CreditCard, Inbox, Package, ShoppingBag } from 'lucide-react';
import { money } from '../data/shopping.mjs';
import { useResource, Feedback, Empty, Status, Table, date } from './shared';
import type { Overview as OverviewData } from './types';

export default function Overview() {
  const { data, error, loading, load } = useResource<OverviewData>('/admin/overview');
  if (!data) return <Feedback error={error} loading={loading} retry={load} />;
  const maximum = Math.max(1, ...data.days.map(day => day.orders));
  return <><Feedback error={error} loading={false} retry={load} /><div className="admin-metrics">{[
    { title: 'Recorded revenue', value: money(data.paidRevenue), note: 'Manually recorded paid orders', Icon: CreditCard },
    { title: 'Total orders', value: data.totalOrders, note: 'All order requests received', Icon: ShoppingBag },
    { title: 'Awaiting confirmation', value: data.pendingOrders, note: 'Orders that need your attention', Icon: Package },
    { title: 'Open enquiries', value: data.openEnquiries, note: 'New and in-progress messages', Icon: Inbox },
  ].map(({ title, value, note, Icon }) => <div className="admin-metric" key={title}><div><span>{title}</span><Icon size={18} strokeWidth={1.4} /></div><strong>{value}</strong><p>{note}</p></div>)}</div>
    <div className="admin-overview-grid"><section className="admin-panel"><div className="admin-panel-heading"><div><h2>A week in the garden.</h2><p>Order requests · last 7 days (UTC)</p></div><button className="admin-button admin-button--secondary" onClick={load}>Refresh</button></div><div className="admin-chart" role="img" aria-label={data.days.map(day => `${day.date}: ${day.orders} orders`).join('; ')}>{data.days.map(day => <div key={day.date} className="admin-chart-column"><span>{day.orders}</span><div className="admin-chart-track"><div style={{ height: `${day.orders / maximum * 100}%` }} /></div><small>{new Intl.DateTimeFormat('en', { weekday: 'short', timeZone: 'UTC' }).format(new Date(day.date))}</small></div>)}</div>{data.totalOrders === 0 && <p className="admin-chart-note">Your first order will start the story here.</p>}</section>
    <section className="admin-panel"><div className="admin-panel-heading"><div><h2>A little attention.</h2><p>Tracked ingredients with 5 or fewer in stock</p></div></div>{data.lowStock.length ? <ul className="admin-stock-list">{data.lowStock.map(p => <li key={p.slug}><Link to="/admin/products">{p.name}</Link><Status value={p.stock === 0 ? 'out-of-stock' : 'low-stock'} /><strong>{p.stock} left</strong></li>)}</ul> : <Empty title="Room to keep growing.">No low-stock alerts. Set stock counts under Products to track your inventory.</Empty>}<Link className="admin-inline-link" to="/admin/products">Manage ingredients</Link></section></div>
    <section className="admin-panel"><div className="admin-panel-heading"><div><h2>Fresh from the collection.</h2><p>The latest order requests</p></div><Link className="admin-button admin-button--secondary" to="/admin/orders">View all orders</Link></div>{data.recentOrders.length ? <Table name="Recent orders"><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Status</th><th>Total</th></tr></thead><tbody>{data.recentOrders.map(order => <tr key={order.id}><td><Link className="admin-inline-link" to={`/admin/orders?order=${order.id}`}>{order.reference}</Link></td><td>{order.details.name}</td><td>{date(order.createdAt)}</td><td><Status value={order.status} /></td><td>{money(order.total)}</td></tr>)}</tbody></Table> : <Empty title="Good things are on their way.">Submitted checkout requests appear here automatically. There are no orders yet.</Empty>}</section>
    <div className="admin-operating-note"><CreditCard size={20} strokeWidth={1.3} /><p><strong>A considered way to sell.</strong> Checkout saves unpaid order requests. Confirm stock, payment arrangements and delivery with your customer. Recording a payment here does not charge or refund a card.</p></div>
  </>;
}
