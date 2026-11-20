import { useEffect, useRef, type RefObject } from 'react';
import { BotanicalMark } from './Logo';

export default function FooterCursor({ footer }: { footer: RefObject<HTMLElement | null> }) {
  const cursor = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const region = footer.current;
    const element = cursor.current;
    if (!region || !element) return;
    const enabled = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    const lag = getComputedStyle(element).getPropertyValue('--footer-cursor-lag').trim();
    const response = (parseFloat(lag) * (lag.endsWith('ms') ? 1 : 1000)) || 200;
    let frame = 0;
    let active = false;
    let x = 0;
    let y = 0;
    let targetX = 0;
    let targetY = 0;
    let previous = 0;

    const paint = () => { element.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`; };
    const tick = (time: number) => {
      const ease = 1 - Math.exp(-Math.min(time - previous, 64) / response);
      previous = time;
      x += (targetX - x) * ease;
      y += (targetY - y) * ease;
      paint();
      if (Math.hypot(targetX - x, targetY - y) > .1) frame = requestAnimationFrame(tick);
      else frame = 0;
    };
    const hide = () => {
      active = false;
      element.classList.remove('is-visible');
      region.classList.remove('has-footer-cursor');
      cancelAnimationFrame(frame);
      frame = 0;
    };
    const move = (event: PointerEvent) => {
      if (!enabled.matches || event.pointerType !== 'mouse') { hide(); return; }
      targetX = event.clientX;
      targetY = event.clientY;
      if (!active) {
        x = targetX;
        y = targetY;
        paint();
        active = true;
        element.classList.add('is-visible');
        region.classList.add('has-footer-cursor');
      }
      if (!frame) { previous = performance.now(); frame = requestAnimationFrame(tick); }
    };
    region.addEventListener('pointermove', move);
    region.addEventListener('pointerleave', hide);
    region.addEventListener('pointerdown', move);
    enabled.addEventListener('change', hide);
    window.addEventListener('blur', hide);
    window.addEventListener('scroll', hide, { passive: true });
    document.addEventListener('keydown', hide);
    document.addEventListener('visibilitychange', hide);
    return () => {
      hide();
      region.removeEventListener('pointermove', move);
      region.removeEventListener('pointerleave', hide);
      region.removeEventListener('pointerdown', move);
      enabled.removeEventListener('change', hide);
      window.removeEventListener('blur', hide);
      window.removeEventListener('scroll', hide);
      document.removeEventListener('keydown', hide);
      document.removeEventListener('visibilitychange', hide);
    };
  }, [footer]);

  return <span ref={cursor} className="footer-cursor" aria-hidden="true"><BotanicalMark /></span>;
}
