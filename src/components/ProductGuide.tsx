import Accordion from './Accordion';
import type { Product } from './ProductCard';

export default function ProductGuide({ product, level = 3 }: { product: Product; level?: 2 | 3 }) {
  const { guide } = product;
  return <div className="ingredient-guide"><Accordion level={level} items={[
    { title: 'Benefits & what to expect', content: <><ul>{guide.benefits.map(benefit => <li key={benefit}>{benefit}</li>)}</ul><p>{guide.evidence}</p></> },
    { title: 'How to use', content: <p>{guide.preparation}</p> },
    { title: 'Suitability & things to know', content: <p>{guide.suitability}</p> },
    { title: 'Storage & freshness', content: <p>{guide.storage}</p> },
    { title: 'Ingredients, pricing & delivery', content: <><p>{product.detail}</p><p>Enquire for the full ingredient list, allergens, available format, pack size, current price and delivery options for your area. Stock, delivery charges and timing are confirmed individually. Images show concept packaging; final contents and packaging will be confirmed.</p></> },
  ]} /><p className="guide-context">General ingredient information. Follow the supplied product label. Ask a qualified clinician about supplements if you take medication, have a medical condition, are pregnant or breastfeeding, or are choosing for a child.</p>{guide.sources.length > 0 && <div className="guide-sources"><span>Further reading</span>{guide.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label}<span className="sr-only"> (opens in a new tab)</span></a>)}</div>}</div>;
}
