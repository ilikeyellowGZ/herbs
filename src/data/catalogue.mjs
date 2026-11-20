import { productGuides } from './product-guides.mjs';

const ingredients = [
  { slug: 'hibiscus', name: 'Hibiscus', latin: 'Hibiscus sabdariffa', category: 'Botanical tea', note: 'Tart. Ruby-red. Quite lovely.', description: 'A deep ruby infusion with a bright, tart edge. Beautiful in your favourite cup, poured over ice, or shared slowly at the end of the day.', ritual: 'Steep the dried petals in freshly boiled water until the colour deepens. Strain, sip, and make it your own with a little honey or a slice of citrus.', character: 'Ruby-red · Floral · Bright', bottle: 'Hibiscus', moment: 'The slow-down cup', detail: 'The dried calyces of the hibiscus flower, known for their rich colour and lively, cranberry-like tartness.' },
  { slug: 'collagen', name: 'Collagen', latin: 'An everyday addition', category: 'Wellness supplement', note: 'A little addition to your routine.', description: 'A quiet addition to the daily routine. Explore our collagen offering and ask us about its source, format and how it might fit into your day.', ritual: 'Ask us about the available product and its preparation instructions before adding it to a drink or meal.', character: 'Simple · Considered · Everyday', bottle: 'Collagen', moment: 'The morning rhythm', detail: 'Enquire for the confirmed source, ingredient list and product information for our collagen offering.' },
  { slug: 'moringa', name: 'Moringa', latin: 'Moringa oleifera', category: 'Leaf & powder', note: 'A greener kind of everyday.', description: 'Earthy, green and full of character. Moringa brings the leaf to the kitchen, from a morning blend to an everyday cooking ritual.', ritual: 'Explore the leaf and powder formats with us. A small amount of moringa powder can bring an earthy note to a smoothie or bowl.', character: 'Green · Earthy · Leafy', bottle: 'Moringa', moment: 'A greener morning', detail: 'The small leaves of the moringa tree, enjoyed in dried leaf and finely milled forms. Ask us which formats are available.' },
  { slug: 'sea-moss', name: 'Sea Moss', latin: 'A gift from the tide', category: 'Ocean botanical', note: 'From the ocean, with possibility.', description: 'Golden branching fronds, shaped by the sea. Get to know our sea moss and the small preparation rituals that make it part of a considered pantry.', ritual: 'Preparation depends on the supplied format. Enquire for the species, source and preparation guidance for the available product.', character: 'Ocean-grown · Textural · Versatile', bottle: 'Sea-Moss', moment: 'A considered pantry', detail: 'Sea moss is a common name for several red seaweeds. Contact us for the exact species and product details.' },
  { slug: 'bay-leaves', name: 'Bay Leaves', latin: 'Laurus nobilis', category: 'Kitchen botanical', note: 'The beginning of something good.', description: 'A familiar leaf with a generous fragrance. Bay brings a soft, herbal depth to pots that simmer slowly and meals that gather people around a table.', ritual: 'Tuck a leaf into a slow-cooked stew, soup or pot of beans. Remove the whole leaf before serving.', character: 'Aromatic · Herbal · Savoury', bottle: 'Bay-Leaves', moment: 'Something on the stove', detail: 'Whole bay leaves with a gently aromatic, savoury character. Ask us about current availability and pack formats.' },
  { slug: 'cinnamon', name: 'Cinnamon', latin: 'Cinnamomum species', category: 'Pantry spice', note: 'A familiar kind of warmth.', description: 'Warm, woody and wonderfully familiar. Cinnamon turns the simplest cup or bowl into something worth pausing for.', ritual: 'Let a cinnamon quill warm gently in a pot of tea, or add a little ground spice to oats, baking or a slow-cooked dish.', character: 'Warm · Woody · Fragrant', bottle: 'Cinnamon', moment: 'Warmth in a cup', detail: 'Curled cinnamon bark with a warm fragrance. Enquire for the available variety, origin and format.' },
  { slug: 'chia-seeds', name: 'Chia Seeds', latin: 'Salvia hispanica', category: 'Pantry staple', note: 'Small seeds. Endless little rituals.', description: 'Tiny, speckled seeds with a gentle flavour. A simple pantry companion for overnight bowls, breakfast jars and everyday baking.', ritual: 'Soak in your preferred milk until the seeds form a soft gel. Stir well, leave to rest, and finish with seasonal fruit.', character: 'Mild · Speckled · Adaptable', bottle: 'Chia-Seeds', moment: 'Breakfast, unhurried', detail: 'Whole chia seeds, known in the kitchen for their ability to absorb liquid and form a soft, spoonable texture.' },
  { slug: 'ashwagandha', name: 'Ashwagandha', latin: 'Withania somnifera', category: 'Root botanical', note: 'Rooted in a slower rhythm.', description: 'An earthy root with a long botanical history. Discover the ingredient, ask your questions, and find out more about our available offering.', ritual: 'Enquire for the confirmed format and product directions. Speak to a qualified practitioner about individual suitability before use.', character: 'Earthy · Rooted · Traditional', bottle: 'Ashwagandha', moment: 'A moment to pause', detail: 'The root of Withania somnifera. Ask us for the complete product information and directions for the available format.' },
];

export const products = ingredients.map(product => ({
  ...product,
  price: null,
  currency: null,
  packSize: null,
  collection: productGuides[product.slug].collection,
  guide: productGuides[product.slug],
}));

export const findProduct = (slug) => products.find(product => product.slug === slug);

export function prepareEnquiry(draft) {
  const name = String(draft.name || '').trim();
  const email = String(draft.email || '').trim();
  const message = String(draft.message || '').trim();
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !message) {
    return { ok: false, text: 'Please add your name, a valid email address and a message.' };
  }
  const ingredient = findProduct(draft.ingredient)?.name || 'General enquiry';
  return { ok: true, text: `Hello Herby Health,\n\n${message}\n\nIngredient: ${ingredient}\nName: ${name}\nEmail: ${email}` };
}
