const events = {
  'order-received': ['Order received', 'Thank you for your order. Your order details are below.'],
  invoice: ['Your invoice', 'Keep this copy for your records.'],
  'payment-received': ['Payment received', 'We’ve received your payment for this order.'],
  'payment-failed': ['Payment unsuccessful', 'Your payment attempt was unsuccessful. Check your order before trying again.'],
  'payment-pending': ['Payment pending', 'We’re waiting for confirmation of your payment. Please wait before making another payment.'],
  'order-confirmed': ['Order confirmed', 'We’ve confirmed your order. Your delivery or collection details are below.'],
  'order-fulfilled': ['Order fulfilled', 'We’ve marked your order as fulfilled. You can find the order summary below.'],
  'order-cancelled': ['Order cancelled', 'Your order has been cancelled. Any refund update will arrive separately.'],
  'refund-received': ['Refund processed', 'The payment provider has confirmed the refund for this order.'],
  'refund-failed': ['Refund unsuccessful', 'The payment provider reported a failed refund for this order.'],
  'enquiry-received': ['Enquiry received', 'Thank you for writing to us. We’ve received your message.'],
  'enquiry-reply': ['A reply to your enquiry', ''],
  'owner-order': ['New order', 'A new order is ready to review.'],
  'owner-payment': ['Payment record updated', 'Review the payment details for this order.'],
  'owner-enquiry': ['New enquiry', 'A customer has written to the shop.'],
  'owner-alert': ['Order needs attention', 'Review this order in your dashboard.'],
};
export const emailTypes = Object.freeze(Object.keys(events));

const olive = '#45523E', porcelain = '#FCFBF6', garden = '#EFF2E9', rule = '#D6DBCF';
const serif = "Georgia,'Times New Roman',serif", sans = 'Arial,Helvetica,sans-serif';
const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Johannesburg' });
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const multiline = value => escape(value).replace(/\r\n|\r|\n/g, '<br>');
const money = amount => Number.isSafeInteger(amount) ? `R${(amount / 100).toFixed(2)}` : '';
const titleCase = value => String(value || '').replace(/[-_]/g, ' ').replace(/^./, first => first.toUpperCase());
const sectionHeading = title => `<h2 style="margin:0 0 12px;color:${olive};font:normal 25px/1.18 ${serif}">${escape(title)}</h2>`;
const layoutTable = 'role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"';

function validAddress(value, base) {
  if (typeof value !== 'string' || /[\s\\\u0000-\u001f\u007f]/u.test(value)) return;
  const absolute = /^https?:\/\/[^/]/i.test(value);
  if (!absolute && (!base || !/^\/(?!\/)/.test(value))) return;
  try {
    const url = new URL(value, base);
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if (url.username || url.password || !(url.protocol === 'https:' || (url.protocol === 'http:' && local))) return;
    return url;
  } catch { return; }
}

function actionLink(type, actionUrl, origin) {
  const base = validAddress(origin)?.origin;
  const owner = type.startsWith('owner-');
  let destination;
  if (owner && base) {
    const path = type === 'owner-enquiry' ? '/admin/enquiries' : '/admin/orders';
    destination = new URL(path, base);
  } else if (!owner) {
    destination = validAddress(actionUrl, base);
    if (!base || destination?.origin !== base) return;
    if (destination && (destination.hash || [...destination.searchParams.keys()].some(key => /token|secret|password|signature|access.?key/i.test(key)))) return;
  }
  if (!destination) return;
  const label = owner ? 'Open owner dashboard' : type === 'invoice' ? 'View your invoice' : type.startsWith('enquiry-') ? 'View enquiry' : 'View your order';
  return {
    html: `<table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td bgcolor="${olive}" style="mso-padding-alt:14px 24px"><a style="display:inline-block;padding:14px 24px;background:${olive};color:${porcelain};font:600 14px/18px ${sans};text-decoration:none" href="${escape(destination.href)}">${label}</a></td></tr></table>`,
    text: `${label}\n${destination.href}`,
  };
}

function facts(title, entries) {
  const rows = entries.filter(([, value]) => value !== undefined && value !== null && value !== '');
  if (!rows.length) return;
  return {
    html: sectionHeading(title) + `<table ${layoutTable} style="font:14px/1.5 ${sans};color:${olive}">${rows.map(([label, value]) => `<tr><td valign="top" width="40%" style="padding:7px 12px 7px 0;border-top:1px solid ${rule}">${escape(label)}</td><td style="padding:7px 0;border-top:1px solid ${rule}">${multiline(value)}</td></tr>`).join('')}</table>`,
    text: [title, ...rows.map(([label, value]) => `${label}: ${value}`)].join('\n'),
  };
}

function note(title, value) {
  if (typeof value !== 'string' || !value.trim()) return;
  return {
    html: sectionHeading(title) + `<p style="margin:0;padding:16px 20px;border-left:2px solid ${olive};background:${garden};font:16px/1.6 ${sans}">${multiline(value)}</p>`,
    text: `${title}\n${value}`,
  };
}

function itemsBlock(order) {
  const items = order.items || [];
  if (!items.length) return;
  const rows = items.map(item => {
    const description = [item.packSize, item.form].filter(Boolean).join(' · ');
    const quantity = `${item.quantity} × ${money(item.price)}`;
    return {
      html: `<tr><td style="border-top:1px solid ${rule};padding:12px 12px 12px 0"><span style="font:normal 20px/1.25 ${serif}">${escape(item.name)}</span><br>${escape([description, quantity].filter(Boolean).join(' · '))}</td><td align="right" style="border-top:1px solid ${rule};padding:12px 0">${money(item.lineTotal)}</td></tr>`,
      text: `${item.name}${description ? ' · ' + description : ''}\n${quantity} = ${money(item.lineTotal)}`,
    };
  });
  const totals = [['Subtotal', money(order.subtotal)], ['Delivery', money(order.shipping)], ['Total (ZAR)', money(order.total)]];
  const headerStyle = `text-align:left;font:500 12px/1.4 ${sans};padding-bottom:8px`;
  return {
    html: sectionHeading('Order summary') + `<table aria-label="Order summary" width="100%" cellspacing="0" cellpadding="0" style="font:14px/1.5 ${sans};color:${olive}"><thead><tr><th scope="col" style="${headerStyle}">Item</th><th scope="col" style="${headerStyle};text-align:right">Amount</th></tr></thead><tbody>${rows.map(row => row.html).join('')}</tbody><tfoot>${totals.map(([label, value], index) => {
      const style = `padding:8px 0;border-top:1px solid ${rule};${index === 2 ? 'font-size:18px;font-weight:600' : 'font-weight:normal'}`;
      return `<tr><th scope="row" style="${style};text-align:left">${label}</th><td style="${style};text-align:right">${value}</td></tr>`;
    }).join('')}</tfoot></table>`,
    text: ['Order summary', ...rows.map(row => row.text), ...totals.map(([label, value]) => `${label}: ${value}`)].join('\n'),
  };
}

function orderSections(type, order, payment) {
  const details = order.details || {};
  const date = order.createdAt && new Date(order.createdAt);
  const refund = type.startsWith('refund-');
  const entries = [
    ['Order reference', order.reference],
    ['Order date', date && !Number.isNaN(date.getTime()) ? dateFormat.format(date) : ''],
    ['Order status', titleCase(order.status)], ['Payment status', titleCase(order.payment)],
  ];
  const sections = [facts('Order details', entries)];
  if (refund || type.includes('payment')) {
    sections.push(facts(refund ? 'Refund details' : 'Payment details', [
      [refund ? 'Refund amount (ZAR)' : 'Payment amount (ZAR)', money(payment?.amount)],
      ['Transaction reference', payment?.reference],
      ['Transaction status', titleCase(payment?.status)],
    ]));
  }
  if (!refund && !type.includes('payment')) {
    const method = order.method === 'collection' ? 'Gauteng collection' : order.method === 'courier' ? 'Courier delivery' : '';
    const address = order.method === 'courier' ? [details.address, details.city, details.province, details.postalCode].filter(Boolean).join(', ') : '';
    sections.push(itemsBlock(order), facts('Customer & delivery', [
      ['Customer', details.name], ['Email', details.email], ['Phone', details.phone], ['Delivery method', method], ['Address', address],
    ]));
  }
  return sections;
}

export function renderEmail(type, payload = {}, brand = {}) {
  if (!Object.hasOwn(events, type)) throw new Error(`Unknown email template: ${type}`);
  let [heading, introduction] = events[type];
  if (type === 'refund-received' && payload.payment?.source === 'manual') { heading = 'Refund recorded'; introduction = 'Herby Health has recorded a manually verified refund for this order. Please contact us if you need more details.'; }
  const businessName = brand.businessName || 'Herby Health';
  const isEnquiry = type.includes('enquiry');
  const enquiry = payload.enquiry || {}, order = payload.order || {};
  const reference = (isEnquiry ? enquiry.reference : order.reference) || '';
  const identifier = type === 'invoice' && reference ? `INV-${reference}` : reference;
  const subject = [heading, identifier].filter(Boolean).join(' · ').replace(/[\u0000-\u001f\u007f]+/gu, ' ').trim();
  const category = type.startsWith('owner-') ? 'Owner notification' : isEnquiry ? 'Correspondence' : type === 'invoice' ? 'Invoice' : 'Order update';
  let sections;
  if (isEnquiry) {
    sections = type === 'enquiry-reply' ? [note('Our reply', payload.message)] : [
      type === 'owner-enquiry' && note('Message', enquiry.message),
      type === 'owner-enquiry' && facts('Customer details', [['Name', [enquiry.name, enquiry.surname].filter(Boolean).join(' ')], ['Email', enquiry.email], ['Phone', enquiry.phone]]),
    ];
  } else {
    sections = orderSections(type, order, payload.payment);
    if (type === 'owner-alert' || type === 'owner-payment') sections.unshift(note('Owner notice', payload.notice));
  }
  sections = [...sections, actionLink(type, payload.actionUrl, brand.origin)].filter(Boolean);
  const contacts = [brand.email, brand.phone, brand.address].filter(Boolean);
  const intro = introduction ? `<p style="margin:16px 0 0;font:16px/1.6 ${sans}">${introduction}</p>` : '';
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(subject)}</title><style>@media(max-width:520px){.outer{padding:0!important}.gutter{padding-left:20px!important;padding-right:20px!important}.headline{font-size:36px!important}}</style></head>
<body style="margin:0;padding:0;background:${garden};color:${olive};font-family:${sans}">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all">${escape([introduction || heading, identifier].filter(Boolean).join(' · '))}</div>
<table ${layoutTable} bgcolor="${garden}"><tr><td class="outer" align="center" style="padding:32px 12px">
<!--[if mso]><table role="presentation" width="620" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
<table ${layoutTable} bgcolor="${porcelain}" style="max-width:620px;color:${olive};text-align:left;overflow-wrap:anywhere">
<tr><td class="gutter" bgcolor="${olive}" style="padding:20px 40px;color:${porcelain};font:normal 28px/1.16 ${serif}">${escape(businessName)}</td></tr>
<tr><td class="gutter" style="padding:32px 40px 24px;border-bottom:1px solid ${rule}">
<p style="margin:0 0 16px;font:600 12px/1.5 ${sans};letter-spacing:1px;text-transform:uppercase">${category}${identifier ? ' &nbsp;·&nbsp; ' + escape(identifier) : ''}</p>
<h1 class="headline" style="margin:0;color:${olive};font:normal 44px/1.08 ${serif}">${heading}</h1>${intro}</td></tr>
${sections.map(section => `<tr><td class="gutter" style="padding:24px 40px 4px">${section.html}</td></tr>`).join('\n')}
<tr><td class="gutter" style="padding:28px 40px 24px"><table ${layoutTable}><tr><td style="padding-top:16px;border-top:1px solid ${rule};font:normal 20px/1.3 ${serif}">${escape(businessName)}</td></tr>${contacts.length ? `<tr><td style="padding-top:6px;font:13px/1.65 ${sans}">${contacts.map(multiline).join('<br>')}</td></tr>` : ''}</table></td></tr>
</table><!--[if mso]></td></tr></table><![endif]--></td></tr></table></body></html>`;
  const text = [businessName, subject, introduction, ...sections.map(section => section.text), contacts.join('\n')].filter(Boolean).join('\n\n');
  return { subject, html, text };
}

export const emailPreviewBrand = Object.freeze({
  businessName: 'Herby Health',
  email: 'hello@herby.example',
  origin: 'https://herby.example',
});

export function emailPreviewPayload(type) {
  if (!Object.hasOwn(events, type)) throw new Error('Unknown preview type');
  const customer = { name: 'Alex Example', email: 'alex@customer.example', address: '24 Garden Lane', city: 'Pretoria', province: 'Gauteng', postalCode: '0001' };
  const status = { 'order-confirmed': 'confirmed', 'order-fulfilled': 'fulfilled', 'order-cancelled': 'cancelled', 'owner-alert': 'cancelled' }[type] || 'pending';
  const paymentStatus = {
    'payment-received': 'paid', 'invoice': 'paid', 'order-confirmed': 'paid', 'order-fulfilled': 'paid',
    'refund-received': 'refunded', 'refund-failed': 'paid', 'owner-payment': 'paid', 'owner-alert': 'paid',
  }[type] || 'unpaid';
  const transactionStatus = { 'refund-received': 'processed', 'refund-failed': 'failed', 'payment-failed': 'failed', 'payment-pending': 'pending' }[type] || 'success';
  return {
    order: {
      id: 'sample-order', reference: 'HH-SAMPLE-1042', createdAt: '2026-11-21T08:00:00Z', details: customer, method: 'courier', status, payment: paymentStatus,
      items: [
        { name: 'Hibiscus', form: 'Dried flowers', packSize: '50 g', quantity: 2, price: 12500, lineTotal: 25000 },
        { name: 'Moringa', form: 'Leaf powder', packSize: '80 g', quantity: 1, price: 9500, lineTotal: 9500 },
      ],
      subtotal: 34500, shipping: 6500, total: 41000,
    },
    enquiry: {
      id: 'sample-enquiry', reference: 'EN-SAMPLE-1042', name: 'Alex', surname: 'Example', email: customer.email,
      message: 'Could I collect my order in Gauteng? I’m hoping to visit next week.',
    },
    message: 'Hello Alex,\n\nYes, collection is available by arrangement. Which day next week would suit you?',
    notice: type === 'owner-alert' ? 'Payment arrived after this order was cancelled. Review the payment and contact the customer.' : '',
    payment: { amount: 41000, reference: 'SAMPLE-PAYMENT-1042', status: transactionStatus },
  };
}
