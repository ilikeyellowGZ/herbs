import Accordion from './Accordion';
import type { Product } from './ProductCard';

export default function ProductGuide({ product, level = 3 }: { product: Product; level?: 2 | 3 }) {
  const { guide } = product;
  return <div className="ingredient-guide"><Accordion level={level} items={[
    { title: 'Benefits & what to expect', content: <><ul>{guide.benefits.map(benefit => <li key={benefit}>{benefit}</li>)}</ul><p>{guide.evidence}</p></> },
    { title: 'How to use', content: <><p>{product.serving}</p><p>{guide.preparation}</p></> },
    { title: 'Suitability & things to know', content: <p>{guide.suitability}</p> },
    { title: 'Storage & freshness', content: <p>{guide.storage}</p> },
    { title: 'Ingredients, pricing & delivery', content: <><p>{product.detail}</p><p>The listed pack and price are proposed for this preview. Add to your bag and review quantities and delivery at checkout. Courier is R75, free from R650; Gauteng collection is free by arrangement. Confirm ingredients, allergens, final labels and stock before live ordering. Images show concept packaging.</p></> },
  ]} /><p className="guide-context">General ingredient information. Follow the supplied product label. Ask a qualified clinician about supplements if you take medication, have a medical condition, are pregnant or breastfeeding, or are choosing for a child.</p>{guide.sources.length > 0 && <div className="guide-sources"><span>Further reading</span>{guide.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label}<span className="sr-only"> (opens in a new tab)</span></a>)}</div>}</div>;
}
