
export const helpTopics = [
  {
    id: 'orders', title: 'Orders & your bag', icon: 'bag',
    articles: [
      { id: 'place-order', title: 'How do I place an order?', body: 'Choose an ingredient, add it to your bag and review delivery or collection details at checkout. Select Submit order request to save it with Herby Health. Keep the reference shown afterwards. You can also copy an order request before submitting. Checkout does not take payment.', href: '/collection', link: 'Explore the collection' },
      { id: 'edit-bag', title: 'Can I change what is in my bag?', body: 'Open the shopping bag in the top navigation to change quantities or remove an ingredient. Your bag is saved in this browser so you can return to it later. It will not automatically appear on a different device.', href: '/collection', link: 'Continue browsing' },
      { id: 'order-status', title: 'Where can I check my order status?', body: 'Send an enquiry from the contact page with your order reference to ask about its progress. We confirm payment and delivery arrangements directly. Customer tracking accounts and automatic email updates are not currently available. Do not include payment card information.', href: '/contact', link: 'Ask about an order' },
    ],
  },
  {
    id: 'shipping', title: 'Shipping & delivery', icon: 'truck',
    articles: [
      { id: 'delivery-cost', title: 'How much does delivery cost?', body: 'Checkout shows the current South African courier fee, free-delivery threshold and full total before you submit. Delivery settings can change; the submitted request keeps its recorded totals. Herby Health will confirm timing and delivery arrangements.', href: '/checkout', link: 'Review your bag at checkout' },
      { id: 'collection', title: 'Can I collect in Gauteng?', body: 'Free Gauteng collection is available when offered at checkout. The location and time must be arranged with Herby Health before travelling.', href: '/contact', link: 'Enquire about collection' },
      { id: 'delivery-times', title: 'When will my delivery arrive?', body: 'Herby Health confirms delivery timing directly after reviewing your order request. Include your town and province, and ask about any timing requirements before arranging payment.', href: '/contact', link: 'Ask about delivery' },
    ],
  },
  {
    id: 'payment', title: 'Payment & billing', icon: 'card',
    articles: [
      { id: 'payment-methods', title: 'How do I pay for my order?', body: 'Checkout saves an unpaid order request and does not charge you. Confirm payment arrangements directly with Herby Health using your order reference. Never enter card numbers, passwords or banking credentials in the contact form.', href: '/contact', link: 'Ask about payment' },
      { id: 'prices', title: 'Are the prices final?', body: 'Current product prices and formats are shown on ingredient pages and in your bag. Checkout verifies prices and availability with the store before saving your order request. Please confirm final product labels and payment arrangements before paying.', href: '/collection', link: 'View the ingredients' },
    ],
  },
  {
    id: 'returns', title: 'Returns & bulk enquiries', icon: 'package',
    articles: [
      { id: 'returns', title: 'How do I enquire about a return?', body: 'Send a message on the contact page with your order details, the ingredient involved and what happened. You can attach a relevant photograph to your enquiry draft. Confirm the applicable return arrangements directly with Herby Health.', href: '/contact', link: 'Send a returns enquiry' },
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
      { id: 'contact', title: 'How can I get in touch?', body: 'Choose Say hello, add your first name, surname, email, phone number and message, then select Send message. Your enquiry is saved privately for the Herby Health team and you receive a reference on screen. No automatic email reply is sent.', href: '/contact', link: 'Say hello' },
      { id: 'attachments', title: 'Can I include a photograph in my enquiry?', body: 'Select up to five images, PDFs, Word documents or text files, each 10 MB or smaller. Files upload only when you select Send message and are stored privately with your enquiry. Only the store owner can download them. Please exclude sensitive medical and payment information.', href: '/contact', link: 'Send an enquiry' },
      { id: 'draft', title: 'Will my enquiry draft be saved?', body: 'Your unsent contact draft remains available while you navigate within the current tab. Reloading or closing the site can clear it. Successfully submitted messages and attachments are stored in the private owner inbox.', href: '/contact', link: 'Return to your enquiry' },
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
