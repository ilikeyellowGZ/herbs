import manifest from '../data/images.json';

type ImageKey = keyof typeof manifest;
export default function ResponsiveImage({ name, mobileName, className = '', sizes = '(max-width: 880px) 50vw, 25vw', priority = false, alt }: { name: string; mobileName?: string; className?: string; sizes?: string; priority?: boolean; alt?: string }) {
  const image = manifest[name as ImageKey];
  const mobile = mobileName ? manifest[mobileName as ImageKey] : undefined;
  if (!image) return null;
  return <picture className={className}>
    {mobile && <source media="(max-width: 640px)" type="image/webp" srcSet={mobile.srcSet} sizes={sizes} />}
    <source type="image/webp" srcSet={image.srcSet} sizes={sizes} />
    <img src={image.fallback} alt={alt ?? image.alt} width={image.width} height={image.height} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} />
  </picture>;
}
