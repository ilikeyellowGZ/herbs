import { useRef, useSyncExternalStore, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

const MotionLink = motion.create(Link);
const reducedMotionQuery = '(prefers-reduced-motion: reduce)';
const subscribeToMotion = (onChange: () => void) => {
  const media = window.matchMedia(reducedMotionQuery);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
};
const getReducedMotion = () => window.matchMedia(reducedMotionQuery).matches;
const getServerReducedMotion = () => true;

export function BotanicalMark({ className = '', animated = false, wind = false }: { className?: string; animated?: boolean; wind?: boolean }) {
  const root = useRef<SVGSVGElement>(null);
  const revealed = useRef(false);
  const reduced = useSyncExternalStore(subscribeToMotion, getReducedMotion, getServerReducedMotion);

  useGSAP(() => {
    if (!animated || !root.current) return;
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      let introComplete = revealed.current;
      let footerVisible = false;
      let repeatTimer: number | undefined;
      const footer = wind ? root.current?.closest('footer') : null;
      const link = root.current?.closest('a');
      // Separate groups let the breeze bend the plant and flower independently
      // without overwriting the reveal or Framer Motion's hover transforms.
      const breezeTimeline = wind ? gsap.timeline({ paused: true, defaults: { ease: 'sine.inOut' } })
        .to('[data-breeze]', { rotation: -4, svgOrigin: '40 87', duration: .8 }, 0)
        .to('[data-breeze]', { rotation: 3, duration: 1.1 }, .8)
        .to('[data-breeze]', { rotation: -1.5, duration: .8 }, 1.9)
        .to('[data-breeze]', { rotation: 0, duration: .7 }, 2.7)
        .to('[data-flower-wind]', { rotation: -7, svgOrigin: '40 40', duration: .9 }, .1)
        .to('[data-flower-wind]', { rotation: 5, duration: 1 }, 1)
        .to('[data-flower-wind]', { rotation: -2, duration: .8 }, 2)
        .to('[data-flower-wind]', { rotation: 0, duration: .6 }, 2.8) : null;

      const playBreeze = () => {
        if (footerVisible && introComplete && !document.hidden && !breezeTimeline?.isActive()) breezeTimeline?.restart();
      };
      const syncBreeze = () => {
        window.clearInterval(repeatTimer);
        if (footerVisible && !document.hidden) {
          playBreeze();
          repeatTimer = window.setInterval(playBreeze, 10_000);
        } else {
          breezeTimeline?.pause(0);
        }
      };
      const onPointerEnter = (event: PointerEvent) => {
        if (event.pointerType !== 'touch') playBreeze();
      };
      const footerObserver = footer ? new IntersectionObserver(entries => {
        footerVisible = entries.some(entry => entry.isIntersecting);
        syncBreeze();
      }) : null;
      if (footer) {
        footerObserver?.observe(footer);
        footer.addEventListener('pointerenter', onPointerEnter as EventListener);
        footer.addEventListener('focusin', playBreeze);
        link?.addEventListener('pointerenter', onPointerEnter);
        document.addEventListener('visibilitychange', syncBreeze);
      }

      const timeline = !revealed.current ? gsap.timeline({ paused: true, defaults: { ease: 'power2.out' }, onComplete: () => {
        introComplete = true;
        playBreeze();
      } })
        .from('[data-stem]', { scaleY: 0, opacity: 0, svgOrigin: '40 87', duration: .7 }, 0)
        .from('[data-leaf-left]', { scale: .2, rotation: 24, opacity: 0, svgOrigin: '39 72', duration: .65 }, .25)
        .from('[data-leaf-right]', { scale: .2, rotation: -24, opacity: 0, svgOrigin: '40 62', duration: .65 }, .4)
        .from('[data-sprigs]', { scaleY: .15, opacity: 0, svgOrigin: '40 85', duration: .85 }, .2)
        .from('[data-flower]', { scale: .25, rotation: -12, opacity: 0, svgOrigin: '42 40', duration: .9 }, .55) : null;

      const observer = timeline ? new IntersectionObserver(entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        revealed.current = true;
        timeline.play();
        observer?.disconnect();
      }, { threshold: .2 }) : null;
      observer?.observe(root.current!);
      return () => {
        observer?.disconnect();
        footerObserver?.disconnect();
        window.clearInterval(repeatTimer);
        footer?.removeEventListener('pointerenter', onPointerEnter as EventListener);
        footer?.removeEventListener('focusin', playBreeze);
        link?.removeEventListener('pointerenter', onPointerEnter);
        document.removeEventListener('visibilitychange', syncBreeze);
      };
    }, root);
    return () => media.revert();
  }, { scope: root, dependencies: [animated, wind], revertOnUpdate: true });

  const sway = animated && !reduced ? {
    rest: { rotate: 0, scale: 1, transition: { duration: .3 } },
    active: { rotate: [0, -3, 2, -1, 0], scale: 1.025, transition: { duration: 1.2, ease: 'easeInOut' as const } },
  } : {
    rest: { rotate: 0, scale: 1, transition: { duration: 0 } },
    active: { rotate: 0, scale: 1, transition: { duration: 0 } },
  };

  return <svg ref={root} className={className} viewBox="0 0 80 96" fill="none" aria-hidden="true" focusable="false">
    <motion.g variants={sway} style={{ originX: .5, originY: 1, transformBox: 'fill-box' }}>
    <g data-breeze="" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <g data-stem=""><path d="M40 87c-2-16-1-32 0-46" /></g>
      <g data-leaf-left=""><path d="M39 72C28 68 21 61 18 51c12 1 20 8 21 21ZM39 70 24 57" /></g>
      <g data-leaf-right=""><path d="M40 62c11-3 18-9 21-19-11 2-18 8-21 19ZM41 60l14-12" /></g>
      <g data-flower="">
      <g data-flower-wind="">
      <path d="M40 40C22 46 13 37 19 28c3-4 7-4 12-3-9-9-4-20 5-18 5 1 7 6 7 10 5-11 16-12 19-3 2 5-1 10-5 13 13-2 18 8 10 15-5 5-13 2-17-1 4 12-6 18-13 10-3-3-2-7 3-11Z" />
      <path d="m41 34-6-17m7 16 12-15M43 35l16 1M40 36l-14-5m15 7 2 9" opacity=".65" />
      <circle cx="42" cy="35" r="3" />
      </g>
      </g>
      <g data-sprigs="">
      <path d="M21 85c-8-13-11-29-8-42M14 68c-8-3-11-8-10-14 6 2 9 6 10 14Zm0-12c-2-7 0-13 5-16 2 6 0 11-5 16Zm4 24c-8-1-12-4-13-10 7 0 11 4 13 10ZM59 85c8-13 11-27 9-38m-1 20c7-3 10-7 10-13-6 2-9 6-10 13Zm-5 13c8-1 12-4 13-10-7 1-11 4-13 10Z" />
      </g>
    </g>
    </motion.g>
  </svg>;
}

export function BotanicalLogoLink({ className, children, wind = false }: { className: string; children?: ReactNode; wind?: boolean }) {
  return <MotionLink className={className} to="/" aria-label="Herby Health home" initial="rest" animate="rest" whileHover="active" whileFocus="active">
    <BotanicalMark animated wind={wind} />{children}
  </MotionLink>;
}

export default function Logo() {
  return <BotanicalLogoLink className="logo"><span>Herby Health</span></BotanicalLogoLink>;
}
