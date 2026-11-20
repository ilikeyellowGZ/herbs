import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag, X } from 'lucide-react';
import { useCart } from './CartContext';
import { money } from '../data/shopping.mjs';
import { useStore } from './StoreContext';
import CartItems from './CartItems';
import useDialogFocus from './useDialogFocus';

export default function CartDrawer() {
  const { summarise, count, open, setOpen, storageError } = useCart();
  const { settings } = useStore();
  const FREE_DELIVERY = settings.freeDelivery;
  const dialog = useRef<HTMLDialogElement>(null);
  useDialogFocus(dialog);
  useEffect(() => { if (open && !dialog.current?.open) dialog.current?.showModal(); else if (!open) dialog.current?.close(); }, [open]);
  const summary = summarise();
  const close = () => setOpen(false);
  return <dialog className="cart-drawer" id="shopping-bag" ref={dialog} aria-labelledby="cart-title" onClose={close} onClick={event => { if (event.target === dialog.current && event.clientX < dialog.current.getBoundingClientRect().left) close(); }}>
    <div className="dialog-top"><h2 id="cart-title">Your bag <span>({count})</span></h2><button className="icon-button" aria-label="Close shopping bag" onClick={close}><X size={22} strokeWidth={1.3} /></button></div>
    {storageError && <p className="cart-storage-note" role="status">Your bag works for this visit, but this browser could not save it for later.</p>}
    {count ? <><div className="cart-drawer__body"><p className="cart-delivery-note">{summary.subtotal < FREE_DELIVERY ? <>You’re {money(FREE_DELIVERY - summary.subtotal)} away from free courier delivery.</> : 'Your bag qualifies for free courier delivery.'}</p><CartItems onNavigate={close} /></div><div className="cart-drawer__footer"><dl className="shopping-totals"><div><dt>Subtotal</dt><dd>{money(summary.subtotal)}</dd></div><div><dt>Courier delivery</dt><dd>{summary.shipping ? money(summary.shipping) : 'Free'}</dd></div><div className="shopping-total"><dt>Estimated total</dt><dd>{money(summary.total)}</dd></div></dl>{settings.collectionEnabled && <p>Free Gauteng collection is also available at checkout.</p>}<Link to="/checkout" className="solid-button" onClick={close}>Checkout<ArrowRight size={18} strokeWidth={1.3} /></Link><button className="text-link" onClick={close}>Continue exploring</button><p className="shopping-preview">Submit an order request at checkout. No payment is collected.</p></div></> : <div className="cart-empty"><ShoppingBag size={40} strokeWidth={1} /><h3>A little room for nature.</h3><p>Your bag is waiting for your everyday essentials.</p><Link to="/collection" className="solid-button" onClick={close}>Explore the collection<ArrowRight size={18} /></Link></div>}
  </dialog>;
}
