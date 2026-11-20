import { COURIER_FEE, FREE_DELIVERY, money } from './shopping.mjs';

export const helpTopics = [
  {
    id: 'orders', title: 'Orders & your bag', icon: 'bag',
    articles: [
      { id: 'place-order', title: 'How do I place an order?', body: 'Choose an ingredient from the collection, add it to your bag and adjust the quantity. Checkout lets you review delivery or collection details and copy an itemised order request. This is a website preview: copying a request does not send an order or take payment.', href: '/collection', link: 'Explore the collection' },
      { id: 'edit-bag', title: 'Can I change what is in my bag?', body: 'Open the shopping bag in the top navigation to change quantities or remove an ingredient. Your bag is saved in this browser so you can return to it later. It will not automatically appear on a different device.', href: '/collection', link: 'Continue browsing' },
      { id: 'order-status', title: 'Where can I check my order status?', body: 'This preview does not submit orders or provide live order tracking. If you have arranged an order directly with Herby Health, use the contact page to prepare an enquiry with your order details. Do not include payment card information.', href: '/contact', link: 'Ask about an order' },
    ],
  },
  {
    id: 'shipping', title: 'Shipping & delivery', icon: 'truck',
    articles: [
      { id: 'delivery-cost', title: 'How much does delivery cost?', body: `The checkout preview shows a proposed South African courier fee of ${money(COURIER_FEE)}, with free delivery from ${money(FREE_DELIVERY)}. These are preview rates. Confirm the final delivery cost and availability with Herby Health before arranging an order.`, href: '/checkout', link: 'Review your bag at checkout' },
      { id: 'collection', title: 'Can I collect in Gauteng?', body: 'Yes, the checkout preview includes free Gauteng collection. The collection location and time need to be arranged with Herby Health. Please confirm the details before travelling.', href: '/contact', link: 'Enquire about collection' },
      { id: 'delivery-times', title: 'When will my delivery arrive?', body: 'Delivery dates are not confirmed by this website preview. Share your town, province and the ingredients you are interested in so delivery availability and timing can be discussed before you order.', href: '/contact', link: 'Ask about delivery' },
    ],
  },
  {
    id: 'payment', title: 'Payment & billing', icon: 'card',
    articles: [
      { id: 'payment-methods', title: 'How do I pay for my order?', body: 'Online payment processing is not connected to this preview. Checkout prepares a copyable order request; it does not charge you. Confirm available payment methods directly with Herby Health before making a payment.', href: '/contact', link: 'Ask about payment' },
      { id: 'prices', title: 'Are the prices final?', body: 'Product prices and formats shown on this site are proposed for the preview. Please confirm stock, final product labels, pricing and delivery arrangements before placing an order.', href: '/collection', link: 'View the ingredients' },
    ],
  },
  {
    id: 'returns', title: 'Returns & bulk enquiries', icon: 'package',
    articles: [
      { id: 'returns', title: 'How do I enquire about a return?', body: 'Prepare a message on the contact page with your order details, the ingredient involved and what happened. You can attach a relevant photograph to your enquiry draft. Confirm the applicable return arrangements directly with Herby Health.', href: '/contact', link: 'Prepare a returns enquiry' },
      { id: 'bulk', title: 'Can I enquire about a bulk order?', body: 'For a bulk, business or collaboration enquiry, tell us which ingredients you are interested in, the quantities you have in mind and your location. Availability and pricing need to be confirmed individually.', href: '/contact', link: 'Discuss a bulk enquiry' },
    ],
  },
  {
    id: 'ingredients', title: 'Our ingredients', icon: 'sprout',
    articles: [
      { id: 'collection', title: 'What is in the collection?', body: 'Explore Hibiscus, Collagen, Moringa, Sea Moss, Bay Leaves, Cinnamon, Chia Seeds and Ashwagandha. Each ingredient has a dedicated page with product information, suggested uses and things to know before choosing.', href: '/collection', link: 'Meet the collection' },
      { id: 'packaging', title: 'Will the packaging match the photographs?', body: 'The photographs show our visual direction and concept packaging. Please confirm the actual product format, contents, pack size and final label before ordering.', href: '/contact', link: 'Ask about a product' },
      { id: 'choose', title: 'Where can I find more product details?', body: 'Select an ingredient in the collection to read its full product page. You can also open the ingredient details from a collection card or prepare an enquiry if you would like help finding the right information.', href: '/collection', link: 'Browse product details' },
    ],
  },
  {
    id: 'rituals', title: 'Everyday rituals', icon: 'cup',
    articles: [
      { id: 'inspiration', title: 'Where can I find ideas for using the ingredients?', body: 'Our Everyday rituals page brings together ideas for a slow-down cup, an unhurried morning and a leaf in the pot. Follow a featured ingredient to its product page for more information about its everyday use.', href: '/rituals', link: 'Find your little ritual' },
      { id: 'instructions', title: 'Where do I find preparation instructions?', body: 'Look for the How to use section on each ingredient page. Confirm the final product label and instructions for the format you order, as concept imagery and preview information may differ from the supplied product.', href: '/collection', link: 'Find an ingredient' },
    ],
  },
  {
    id: 'care', title: 'Product care & storage', icon: 'leaf',
    articles: [
      { id: 'storage', title: 'How should I store my ingredients?', body: 'Follow the storage instructions on the final product label. If you are unsure about the format you have, share the product name and a photograph of its label in your enquiry so the relevant information can be confirmed.', href: '/contact', link: 'Ask about storage' },
      { id: 'label', title: 'Where can I check shelf life and product contents?', body: 'Check the final label for the ingredients, batch details, storage instructions and any date marking. If you are browsing before ordering, enquire about the exact product label and available batch details.', href: '/contact', link: 'Request label information' },
    ],
  },
  {
    id: 'general', title: 'General', icon: 'help',
    articles: [
      { id: 'about', title: 'What is Herby Health?', body: 'Herby Health is a botanical and everyday wellness brand rooted in Gauteng, South Africa. Our collection brings together considered ingredients for your cup, your kitchen and your everyday rituals.', href: '/our-story', link: 'Read our story' },
      { id: 'where', title: 'Where are you based?', body: 'Herby Health is based in Gauteng, South Africa. Please confirm any collection location and appointment directly before visiting.', href: '/contact', link: 'Get in touch' },
    ],
  },
  {
    id: 'support', title: 'Contact & support', icon: 'message',
    articles: [
      { id: 'contact', title: 'How can I get in touch?', body: 'Choose Say hello to open our contact page. Add your name, email, phone number and a message, then prepare a copyable enquiry. The form is a preview and does not send your message automatically.', href: '/contact', link: 'Say hello' },
      { id: 'attachments', title: 'Can I include a photograph in my enquiry?', body: 'The contact form lets you select attachments for your enquiry draft. Files stay in this browser session; they are not uploaded or included when you copy the message text. Share the original files separately when a contact channel has been confirmed.', href: '/contact', link: 'Prepare an enquiry' },
      { id: 'draft', title: 'Will my enquiry draft be saved?', body: 'Your contact draft stays available while you navigate within the current browser session. Returning to Say hello lets you continue editing. A page reload or closing the site can clear the draft, so copy any message you want to keep.', href: '/contact', link: 'Return to your enquiry' },
    ],
  },
];

/** Search all words across topic names, questions and answers. */
export function searchHelp(query) {
  const words = String(query).trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return helpTopics.flatMap(topic => topic.articles
    .filter(article => {
      const text = `${topic.title} ${article.title} ${article.body}`.toLocaleLowerCase();
      return words.every(word => text.includes(word));
    })
    .map(article => ({ topic, article })));
}
