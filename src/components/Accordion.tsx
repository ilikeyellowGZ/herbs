import { useId, useState } from 'react';
import { Plus } from 'lucide-react';

export type AccordionItem = { title: string; content: React.ReactNode };
export default function Accordion({ items, level = 3 }: { items: AccordionItem[]; level?: 2 | 3 }) {
  const [open, setOpen] = useState<number | null>(null);
  const id = useId();
  const Heading = level === 2 ? 'h2' : 'h3';
  return <div className="accordion">{items.map((item, index) => <div className={`accordion-item ${open === index ? 'is-open' : ''}`} key={item.title}>
    <Heading><button id={`${id}-button-${index}`} aria-expanded={open === index} aria-controls={`${id}-panel-${index}`} onClick={() => setOpen(open === index ? null : index)}>{item.title}<Plus size={18} strokeWidth={1.3} /></button></Heading>
    <div id={`${id}-panel-${index}`} role="region" aria-labelledby={`${id}-button-${index}`} hidden={open !== index}><div className="accordion-content">{item.content}</div></div>
  </div>)}</div>;
}
