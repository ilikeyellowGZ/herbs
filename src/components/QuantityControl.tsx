import { Minus, Plus } from 'lucide-react';
import { MAX_QUANTITY } from '../data/shopping.mjs';

export default function QuantityControl({ value, onChange, name, max = MAX_QUANTITY }: { value: number; onChange: (value: number) => void; name: string; max?: number }) {
  return <div className="quantity-control" role="group" aria-label={`Quantity for ${name}`}>
    <button type="button" onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label={`Decrease ${name} quantity`}><Minus size={15} strokeWidth={1.4} /></button>
    <span aria-live="polite" aria-atomic="true">{value}</span>
    <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={`Increase ${name} quantity`}><Plus size={15} strokeWidth={1.4} /></button>
  </div>;
}
