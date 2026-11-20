import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Load the editorial motion engine as the collection approaches the viewport.
// The visible hero uses the lightweight, supplied ScrollExpand independently.
export function initialiseReveals(root: HTMLElement) {
  const context = gsap.context(() => {
    gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach(element => {
      gsap.from(element, { opacity: 0, y: 24, duration: .8, ease: 'power2.out', scrollTrigger: { trigger: element, start: 'top 93%', once: true } });
    });
  }, root);
  return () => context.revert();
}
