import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { cartSummary, money } from '../data/shopping.mjs';
import { useCart } from './CartContext';
import ResponsiveImage from './ResponsiveImage';
import QuantityControl from './QuantityControl';

export default function CartItems({ onNavigate }: { onNavigate?: () => void }) {
  const { cart, setQuantity } = useCart();
  return <ul className="cart-items">{cartSummary(cart).items.map(item => <li className="cart-line" key={item.slug}>
    <Link to={`/products/${item.slug}`} onClick={onNavigate} className="cart-line__image" aria-label={`View ${item.product.name}`}><ResponsiveImage name={`${item.slug}-product`} sizes="80px" alt="" /></Link>
    <div className="cart-line__details"><Link to={`/products/${item.slug}`} onClick={onNavigate} className="cart-line__name">{item.product.name}</Link><p>{item.product.packSize} · {item.product.form}</p><p>{money(Math.round(item.product.price * 100))} each</p><QuantityControl value={item.quantity} name={item.product.name} onChange={quantity => setQuantity(item.slug, quantity)} /></div>
    <div className="cart-line__end"><span>{money(item.lineTotal)}</span><button type="button" className="icon-button" aria-label={`Remove ${item.product.name} from bag`} onClick={() => setQuantity(item.slug, 0)}><Trash2 size={17} strokeWidth={1.3} /></button></div>
  </li>)}</ul>;
}
