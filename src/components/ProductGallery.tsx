import { useState, type KeyboardEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ResponsiveImage from './ResponsiveImage';
import type { Product } from './ProductCard';

export default function ProductGallery({ product }: { product: Product }) {
  const [selected, setSelected] = useState(0);
  const images = product.images;
  const active = images[selected];
  function move(index: number) { setSelected((index + images.length) % images.length); }
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    let next: number;
    if (event.key === 'ArrowLeft') next = selected - 1;
    else if (event.key === 'ArrowRight') next = selected + 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = images.length - 1;
    else return;
    event.preventDefault();
    move(next);
  }
  return <div className="product-gallery" role="region" aria-label={`${product.name} images`} onKeyDown={onKeyDown}>
    <div className="gallery-main">
      <ResponsiveImage key={active.key} name={active.key} className="gallery-photo" priority={selected === 0} sizes="(max-width: 640px) calc(100vw - 48px), (max-width: 880px) 600px, 48vw" />
      <div className="gallery-navigation">
        <button type="button" onClick={() => move(selected - 1)} aria-label="Previous product image"><ChevronLeft size={20} strokeWidth={1.3} /></button>
        <span className="gallery-counter" aria-hidden="true">{String(selected + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}</span>
        <button type="button" onClick={() => move(selected + 1)} aria-label="Next product image"><ChevronRight size={20} strokeWidth={1.3} /></button>
      </div>
    </div>
    <div className="gallery-thumbnails" role="group" aria-label="Choose a product image">{images.map((image, index) =>
      <button type="button" key={image.key} className={selected === index ? 'selected' : ''} onClick={() => setSelected(index)} aria-label={`View ${image.label.toLowerCase()}`} aria-pressed={selected === index}>
        <ResponsiveImage name={image.key} sizes="(max-width: 640px) 18vw, (max-width: 880px) 112px, 9vw" alt="" />
      </button>
    )}</div>
    <p className="gallery-caption" role="status" aria-live="polite" aria-atomic="true">{active.label}<span className="sr-only">. Image {selected + 1} of {images.length}.</span></p>
  </div>;
}
