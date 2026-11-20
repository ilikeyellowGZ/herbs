export const collectionCategories = [
  { value: 'all', label: 'All ingredients' },
  { value: 'tea', label: 'Teas & infusions' },
  { value: 'pantry', label: 'Kitchen & pantry' },
  { value: 'supplements', label: 'Supplements' },
];

export const sortOptions = [
  { value: 'featured', label: 'Featured' },
  { value: 'name-asc', label: 'Name: A–Z' },
  { value: 'name-desc', label: 'Name: Z–A' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
];

export const hasPrice = product => typeof product.price === 'number' && Number.isFinite(product.price) && product.price >= 0 && /^[A-Z]{3}$/.test(product.currency || '');

export function formatPrice(product) {
  if (!hasPrice(product)) return 'Price on enquiry';
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: product.currency }).format(product.price);
}

export function queryProducts(items, { query = '', category = 'all', sort = 'featured' } = {}) {
  const term = query.trim().toLocaleLowerCase('en-ZA');
  const validCategory = collectionCategories.some(item => item.value === category) ? category : 'all';
  const result = items.filter(product => (validCategory === 'all' || product.collection === validCategory) && (!term || [product.name, product.latin, product.category, product.description, product.guide?.summary].join(' ').toLocaleLowerCase('en-ZA').includes(term)));
  if (sort === 'name-asc' || sort === 'name-desc') result.sort((a, b) => a.name.localeCompare(b.name, 'en-ZA') * (sort === 'name-desc' ? -1 : 1));
  if (sort === 'price-asc' || sort === 'price-desc') result.sort((a, b) => {
    if (!hasPrice(a)) return hasPrice(b) ? 1 : 0;
    if (!hasPrice(b)) return -1;
    return (a.price - b.price) * (sort === 'price-desc' ? -1 : 1);
  });
  return result;
}
