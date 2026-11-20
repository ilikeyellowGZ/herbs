// Adapted from the user-supplied React Bits ScrollExpand (JavaScript + CSS).
// The original clip-path, smoothstep, image zoom and content reveal are retained.
import { useEffect, useRef, type ReactNode } from 'react';
import { useReducedMotion } from 'framer-motion';

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smoothstep = (a: number, b: number, x: number) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

type Props = { src: string; srcSet?: string; sizes?: string; alt?: string; width?: number; height?: number; variant?: 'default' | 'editorial'; title: ReactNode; children?: ReactNode; scrollHint?: string; startWidth?: number; startHeight?: number; startRadius?: number; endRadius?: number; mediaZoom?: number; scrollDistance?: number; holdDistance?: number; smoothing?: number; overlayScrim?: number; className?: string; priority?: boolean };

export default function ScrollExpand({ src, srcSet, sizes = '100vw', alt = '', width = 1672, height = 941, variant = 'default', title, children, scrollHint = 'Scroll to discover', startWidth = 92, startHeight = 76, startRadius = 8, endRadius = 0, mediaZoom = 1.12, scrollDistance = .65, holdDistance = .05, smoothing = .1, overlayScrim = .35, className = '', priority = false }: Props) {
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
    const editorial = variant === 'editorial';
    let initialWidth = 0;
    let initialHeight = 0;
    let fullWidth = 0;
    let fullHeight = 0;
    let viewportWidth = 0;
    let viewportHeight = 0;
    const measure = () => {
      viewportWidth = root.clientWidth;
      viewportHeight = window.innerHeight;
      if (!editorial) return;
      const gutter = parseFloat(getComputedStyle(root).getPropertyValue('--gutter')) || 24;
      initialWidth = Math.min(1200, viewportWidth - gutter * 2);
      initialHeight = initialWidth * height / width;
      fullWidth = Math.max(viewportWidth, viewportHeight * width / height);
      fullHeight = fullWidth * height / width;
      if (mediaRef.current) {
        mediaRef.current.style.width = `${fullWidth}px`;
        mediaRef.current.style.height = `${fullHeight}px`;
      }
    };
    const apply = (p: number) => {
      const e = smoothstep(0, 1, p);
      const ix = Math.max(0, (100 - (startWidth + (100 - startWidth) * e)) / 2);
      const iy = Math.max(0, (100 - (startHeight + (100 - startHeight) * e)) / 2);
      if (editorial) {
        const side = (viewportWidth - initialWidth) / 2 * (1 - e);
        const bottom = Math.max(0, viewportHeight - initialHeight) * (1 - e);
        if (frameRef.current) frameRef.current.style.clipPath = `inset(0px ${side}px ${bottom}px ${side}px)`;
        const initialScale = initialWidth / fullWidth;
        if (mediaRef.current) mediaRef.current.style.transform = `translateX(-50%) scale(${reduced ? 1 : initialScale + (1 - initialScale) * e})`;
      } else {
        if (frameRef.current) frameRef.current.style.clipPath = `inset(${iy}% ${ix}% ${iy}% ${ix}% round ${startRadius + (endRadius - startRadius) * e}px)`;
        if (mediaRef.current) mediaRef.current.style.transform = `scale(${mediaZoom + (1 - mediaZoom) * e})`;
      }
      // Keep heading and controls reachable when reduced motion is enabled.
      const out = reduced ? 0 : smoothstep(.4, .95, p);
      if (titleRef.current) { titleRef.current.style.opacity = `${1 - out}`; titleRef.current.style.transform = `translate3d(0, ${-28 * out}px, 0)`; titleRef.current.inert = out > .98; }
      if (hintRef.current) hintRef.current.style.opacity = `${reduced ? 0 : 1 - smoothstep(0, .15, p)}`;
      if (scrimRef.current) scrimRef.current.style.opacity = `${editorial ? (reduced ? 0 : overlayScrim * smoothstep(.35, 1, p)) : overlayScrim}`;
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
    const resize = () => { measure(); lastTime = 0; update(); };
    measure();
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', update); window.removeEventListener('resize', resize); };
  }, [startWidth, startHeight, startRadius, endRadius, mediaZoom, scrollDistance, smoothing, overlayScrim, reduced, variant, width, height]);

  return <section ref={rootRef} className={`scroll-expand ${className} ${variant === 'editorial' ? 'scroll-expand--editorial' : ''} ${reduced ? 'is-reduced' : ''}`} style={{ '--scroll-track': `${1 + scrollDistance + holdDistance}`, '--media-ratio': `${width} / ${height}` } as React.CSSProperties}>
    <div className="scroll-expand__stage">
      <div ref={frameRef} className="scroll-expand__frame" style={variant === 'editorial' ? undefined : { clipPath: `inset(${(100 - startHeight) / 2}% ${(100 - startWidth) / 2}% round ${startRadius}px)` }}>
        <img ref={mediaRef} className="scroll-expand__media" style={variant === 'editorial' ? undefined : { transform: `scale(${mediaZoom})` }} src={src} srcSet={srcSet} sizes={sizes} alt={alt} width={width} height={height} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} draggable={false} />
        <div ref={scrimRef} className="scroll-expand__scrim" style={{ opacity: variant === 'editorial' ? 0 : overlayScrim }} />
        {children && <div ref={overlayRef} className="scroll-expand__overlay">{children}</div>}
      </div>
      {title && <div ref={titleRef} className="scroll-expand__title">{title}</div>}
      {variant !== 'editorial' && <div ref={hintRef} className="scroll-expand__hint"><span>{className.includes('hero') ? 'Botanicals. Beautifully simple.' : 'Rooted in the everyday.'}</span><span>{scrollHint}<span className="scroll-line" /></span></div>}
    </div>
  </section>;
}
