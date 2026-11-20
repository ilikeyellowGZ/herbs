// Adapted from the user-supplied React Bits ScrollExpand (JavaScript + CSS).
// The original clip-path, smoothstep, image zoom and content reveal are retained.
import { useEffect, useRef, type ReactNode } from 'react';
import { useReducedMotion } from 'framer-motion';

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smoothstep = (a: number, b: number, x: number) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

type Props = { src: string; srcSet?: string; sizes?: string; alt?: string; title: ReactNode; children?: ReactNode; scrollHint?: string; startWidth?: number; startHeight?: number; startRadius?: number; endRadius?: number; mediaZoom?: number; scrollDistance?: number; holdDistance?: number; smoothing?: number; overlayScrim?: number; className?: string; priority?: boolean };

export default function ScrollExpand({ src, srcSet, sizes = '100vw', alt = '', title, children, scrollHint = 'Scroll to discover', startWidth = 92, startHeight = 76, startRadius = 8, endRadius = 0, mediaZoom = 1.12, scrollDistance = .65, holdDistance = .05, smoothing = .1, overlayScrim = .35, className = '', priority = false }: Props) {
  const rootRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLImageElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let raf = 0;
    let current = 0;
    let target = 0;
    let lastTime = 0;
    const apply = (p: number) => {
      const e = smoothstep(0, 1, p);
      const ix = Math.max(0, (100 - (startWidth + (100 - startWidth) * e)) / 2);
      const iy = Math.max(0, (100 - (startHeight + (100 - startHeight) * e)) / 2);
      if (frameRef.current) frameRef.current.style.clipPath = `inset(${iy}% ${ix}% ${iy}% ${ix}% round ${startRadius + (endRadius - startRadius) * e}px)`;
      if (mediaRef.current) mediaRef.current.style.transform = `scale(${mediaZoom + (1 - mediaZoom) * e})`;
      // Keep heading and controls reachable when reduced motion is enabled.
      const out = reduced ? 0 : smoothstep(.4, .95, p);
      if (titleRef.current) { titleRef.current.style.opacity = `${1 - out}`; titleRef.current.style.transform = `translate3d(0, ${-28 * out}px, 0)`; titleRef.current.inert = out > .98; }
      if (hintRef.current) hintRef.current.style.opacity = `${reduced ? 0 : 1 - smoothstep(0, .15, p)}`;
      if (scrimRef.current) scrimRef.current.style.opacity = `${overlayScrim}`;
      const inn = reduced ? 0 : smoothstep(.65, 1, p);
      if (overlayRef.current) { overlayRef.current.style.opacity = `${inn}`; overlayRef.current.style.transform = `translate3d(0, ${18 * (1 - inn)}px, 0)`; }
    };
    const tick = (now: number) => {
      const delta = lastTime ? Math.min((now - lastTime) / 1000, .05) : 1 / 60;
      lastTime = now;
      current += (target - current) * (smoothing <= 0 ? 1 : 1 - Math.exp(-delta / smoothing));
      if (Math.abs(target - current) < .0004) current = target;
      apply(current);
      raf = current !== target ? requestAnimationFrame(tick) : 0;
    };
    const update = () => {
      target = reduced ? 1 : clamp(-root.getBoundingClientRect().top / (window.innerHeight * Math.max(.01, scrollDistance)));
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const resize = () => { lastTime = 0; update(); };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', update); window.removeEventListener('resize', resize); };
  }, [startWidth, startHeight, startRadius, endRadius, mediaZoom, scrollDistance, smoothing, overlayScrim, reduced]);

  return <section ref={rootRef} className={`scroll-expand ${className} ${reduced ? 'is-reduced' : ''}`} style={{ '--scroll-track': `${1 + scrollDistance + holdDistance}` } as React.CSSProperties}>
    <div className="scroll-expand__stage">
      <div ref={frameRef} className="scroll-expand__frame" style={{ clipPath: `inset(${(100 - startHeight) / 2}% ${(100 - startWidth) / 2}% round ${startRadius}px)` }}>
        <img ref={mediaRef} className="scroll-expand__media" style={{ transform: `scale(${mediaZoom})` }} src={src} srcSet={srcSet} sizes={sizes} alt={alt} width="1672" height="941" loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} draggable={false} />
        <div ref={scrimRef} className="scroll-expand__scrim" style={{ opacity: overlayScrim }} />
        {children && <div ref={overlayRef} className="scroll-expand__overlay">{children}</div>}
      </div>
      <div ref={titleRef} className="scroll-expand__title">{title}</div>
      <div ref={hintRef} className="scroll-expand__hint"><span>{className.includes('hero') ? 'Botanicals. Beautifully simple.' : 'Rooted in the everyday.'}</span><span>{scrollHint}<span className="scroll-line" /></span></div>
    </div>
  </section>;
}
