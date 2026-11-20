import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Copy, MapPin, ShoppingBag, Truck } from 'lucide-react';
import { useCart } from '../components/CartContext';
import CartItems from '../components/CartItems';
import { cartSummary, money, orderRequest, provinces, validateCheckout } from '../data/shopping.mjs';

type Details = { name: string; email: string; phone: string; address: string; city: string; province: string; postalCode: string; notes: string };
const initialDetails: Details = { name: '', email: '', phone: '', address: '', city: '', province: '', postalCode: '', notes: '' };

export default function Checkout() {
  const { cart, ready, count, storageError } = useCart();
  const [details, setDetails] = useState<Details>(initialDetails);
  const [method, setMethod] = useState<'courier' | 'collection'>('courier');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [review, setReview] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const [showRequest, setShowRequest] = useState(false);
  const reviewHeading = useRef<HTMLHeadingElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const summary = cartSummary(cart, method);
  const request = orderRequest(cart, details, method);

  useEffect(() => { if (review) reviewHeading.current?.focus(); setCopyStatus(''); setShowRequest(false); }, [review]);
  useEffect(() => { setCopyStatus(''); setShowRequest(false); }, [cart, method]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validateCheckout(details, method);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) requestAnimationFrame(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
    else setReview(true);
  }
  async function copy() {
    try { await navigator.clipboard.writeText(request); setCopyStatus('Order request copied. No order or payment has been submitted.'); }
    catch { setShowRequest(true); setCopyStatus('Select and copy the order request below.'); }
  }
  function field(key: keyof Details, label: string, autocomplete: string, type = 'text', maxLength = 100, required = true) {
    return <div className={`checkout-field ${key === 'address' || key === 'name' ? 'checkout-field--wide' : ''}`}>
      <label htmlFor={`checkout-${key}`}>{label}{!required && <span> (optional)</span>}</label>
      <input id={`checkout-${key}`} name={key} type={type} autoComplete={autocomplete} maxLength={maxLength} required={required} value={details[key]} aria-invalid={errors[key] ? true : undefined} aria-describedby={errors[key] ? `error-${key}` : undefined} onChange={event => setDetails(previous => ({ ...previous, [key]: event.target.value }))} />
      {errors[key] && <p className="field-error" id={`error-${key}`}>{errors[key]}</p>}
    </div>;
  }

  if (!ready) return <section className="checkout-page section-gutters"><h1>Checkout</h1><p role="status">Getting your bag ready…</p></section>;
  if (!count) return <section className="checkout-page section-gutters"><div className="cart-empty checkout-empty"><ShoppingBag size={40} strokeWidth={1} /><p className="eyebrow">Your everyday essentials</p><h1>Your bag is still growing.</h1><p>Add a little nature to your day before checking out.</p><Link className="solid-button" to="/collection">Explore the collection<ArrowRight size={18} /></Link></div></section>;

  return <section className="checkout-page section-gutters">
    <Link className="text-link checkout-back" to="/collection"><ArrowLeft size={15} />Continue exploring</Link>
    <div className="checkout-heading"><p className="eyebrow">A few good things, chosen by you</p><h1>Make them part<br />of your <em>everyday.</em></h1><p>Checkout · {count} {count === 1 ? 'item' : 'items'} in your bag</p></div>
    <ol className="checkout-steps" aria-label="Checkout progress"><li aria-current={!review ? 'step' : undefined}><span>{review ? <Check size={16} /> : '1'}</span>Your details</li><li aria-current={review ? 'step' : undefined}><span>2</span>Review your order</li></ol>
    <div className="checkout-preview"><p><strong>Preview checkout</strong> · Review and copy your order request here. Payments and automatic order submission are not connected. Prices, product formats and delivery rates are proposed.</p></div>
    {storageError && <p role="status" className="cart-storage-note">Your browser could not save this bag. Keep this page open while reviewing your request.</p>}
    <div className="checkout-layout"><div className="checkout-main">
      {review ? <div className="checkout-review"><p className="eyebrow">One last look</p><h2 ref={reviewHeading} tabIndex={-1}>Your order, considered.</h2><p>Check the details below, then copy your request to share with Herby Health through an available contact channel.</p><div className="review-details"><h3>Contact</h3><p>{details.name}<br />{details.email}<br />{details.phone}</p><h3>{method === 'courier' ? 'Courier delivery' : 'Gauteng collection'}</h3><p>{method === 'courier' ? <>{details.address}<br />{details.city}, {details.province} {details.postalCode}<br />South Africa</> : 'Free collection by arrangement. Location and timing must be confirmed.'}</p>{details.notes && <><h3>Your note</h3><p>{details.notes}</p></>}</div><button className="text-link" onClick={() => { setReview(false); requestAnimationFrame(() => document.getElementById('checkout-name')?.focus()); }}>Edit contact & delivery details</button><div className="review-actions"><button type="button" className="solid-button" onClick={copy}>Copy order request<Copy size={18} strokeWidth={1.3} /></button><Link className="text-link" to="/contact">Contact Herby Health<ArrowRight size={17} /></Link></div><p className="copy-status" role="status">{copyStatus}</p>{showRequest && <div className="checkout-field"><label htmlFor="order-request">Your order request</label><textarea id="order-request" readOnly value={request} rows={14} onFocus={event => event.currentTarget.select()} /></div>}<p className="shopping-preview">No order or payment has been submitted. Your bag stays available for you to edit.</p></div> :
      <form ref={form} onSubmit={submit} noValidate>
        <fieldset><legend>First, a little about you.</legend><p>All fields are required unless marked optional.</p><div className="checkout-fields">{field('name', 'Full name', 'name')}{field('email', 'Email address', 'email', 'email', 254)}{field('phone', 'Phone number', 'tel', 'tel', 30)}</div></fieldset>
        <fieldset className="delivery-fieldset"><legend>How shall it find you?</legend><div className="delivery-options">
          <label className={`delivery-option ${method === 'courier' ? 'selected' : ''}`}><input type="radio" name="delivery" value="courier" checked={method === 'courier'} onChange={() => { setMethod('courier'); setErrors({}); }} /><Truck size={22} strokeWidth={1.2} /><span><strong>Courier delivery</strong><small>South Africa · R75, free from R650</small></span></label>
          <label className={`delivery-option ${method === 'collection' ? 'selected' : ''}`}><input type="radio" name="delivery" value="collection" checked={method === 'collection'} onChange={() => { setMethod('collection'); setErrors({}); }} /><MapPin size={22} strokeWidth={1.2} /><span><strong>Collect in Gauteng</strong><small>Free · location & time by arrangement</small></span></label>
        </div>{method === 'courier' ? <div className="checkout-fields">{field('address', 'Street address & unit', 'street-address', 'text', 200)}{field('city', 'Town / city', 'address-level2')}<div className="checkout-field"><label htmlFor="checkout-province">Province</label><select id="checkout-province" name="province" autoComplete="address-level1" required value={details.province} aria-invalid={errors.province ? true : undefined} aria-describedby={errors.province ? 'error-province' : undefined} onChange={event => setDetails(previous => ({ ...previous, province: event.target.value }))}><option value="">Select a province</option>{provinces.map(province => <option key={province}>{province}</option>)}</select>{errors.province && <p id="error-province" className="field-error">{errors.province}</p>}</div>{field('postalCode', 'Postal code', 'postal-code', 'text', 4)}<p className="checkout-country">Delivering within South Africa.</p></div> : <p className="collection-note">We’ll need to confirm a collection location and a time that suits you before an order can be accepted.</p>}</fieldset>
        <div className="checkout-field"><label htmlFor="checkout-notes">A note for us <span>(optional)</span></label><textarea id="checkout-notes" name="notes" rows={3} maxLength={500} value={details.notes} placeholder="Anything you’d like us to know?" onChange={event => setDetails(previous => ({ ...previous, notes: event.target.value }))} /></div>
        {Object.keys(errors).length > 0 && <p className="field-error checkout-error" role="alert">Please check the highlighted details before continuing.</p>}
        <button type="submit" className="solid-button checkout-continue">Review order<ArrowRight size={18} strokeWidth={1.3} /></button><p className="shopping-preview">Your contact details stay on this page. They are not saved or sent.</p>
      </form>}
    </div><aside className="checkout-summary" aria-labelledby="order-summary-title"><div className="checkout-summary__heading"><h2 id="order-summary-title">Your good things.</h2><ShoppingBag size={24} strokeWidth={1} /></div><p className="shopping-preview">Adjust quantities or remove an ingredient below.</p><CartItems /><dl className="shopping-totals"><div><dt>Subtotal</dt><dd>{money(summary.subtotal)}</dd></div><div><dt>{method === 'collection' ? 'Gauteng collection' : 'Courier delivery'}</dt><dd>{summary.shipping ? money(summary.shipping) : 'Free'}</dd></div><div className="shopping-total"><dt>Total <small>ZAR</small></dt><dd>{money(summary.total)}</dd></div></dl><p className="shopping-preview">{method === 'courier' ? 'R75 courier delivery, free on product subtotals of R650 or more.' : 'Free collection by arrangement in Gauteng.'} No payment is taken in this preview.</p><Link to="/collection" className="text-link">Add something else<ArrowRight size={16} /></Link></aside></div>
  </section>;
}
