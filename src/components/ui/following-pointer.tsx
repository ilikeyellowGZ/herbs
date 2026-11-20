// Adapted from Aceternity UI's Following Pointer registry component.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, animate, motion, useMotionValue, type MotionValue } from 'motion/react';
import { cn } from '@/lib/utils';

type FollowerPointerCardProps = {
  children: ReactNode;
  className?: string;
  pointer?: ReactNode;
  title?: ReactNode;
  as?: 'div' | 'footer';
};

export function FollowerPointerCard({
  children,
  className,
  pointer,
  title,
  as: Region = 'div',
}: FollowerPointerCardProps) {
  const region = useRef<HTMLDivElement & HTMLElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [isInside, setIsInside] = useState(false);

  useEffect(() => {
    const element = region.current;
    if (!element) return;
    const enabled = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    const size = parseFloat(getComputedStyle(element).getPropertyValue('--footer-cursor-size')) || 64;
    const radius = size / 2;
    let active = false;
    let movement: { stop(): void }[] = [];

    const stopMovement = () => {
      movement.forEach(animation => animation.stop());
      movement = [];
    };
    const hide = () => {
      active = false;
      stopMovement();
      setIsInside(false);
    };
    const move = (event: PointerEvent) => {
      if (!enabled.matches || event.pointerType !== 'mouse') {
        hide();
        return;
      }
      stopMovement();
      // Keep the logo beside the native pointer and inside the viewport.
      const nextX = Math.max(radius, Math.min(event.clientX + radius + 16, innerWidth - radius));
      const nextY = Math.max(radius, Math.min(event.clientY + radius + 16, innerHeight - radius));
      if (!active) {
        x.set(nextX);
        y.set(nextY);
        active = true;
        setIsInside(true);
      } else {
        movement = [
          animate(x, nextX, { duration: 0.2, ease: 'easeOut' }),
          animate(y, nextY, { duration: 0.2, ease: 'easeOut' }),
        ];
      }
    };

    element.addEventListener('pointermove', move);
    element.addEventListener('pointerleave', hide);
    element.addEventListener('pointercancel', hide);
    enabled.addEventListener('change', hide);
    window.addEventListener('blur', hide);
    window.addEventListener('resize', hide);
    window.addEventListener('scroll', hide, true);
    document.addEventListener('keydown', hide);
    document.addEventListener('visibilitychange', hide);
    return () => {
      stopMovement();
      element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerleave', hide);
      element.removeEventListener('pointercancel', hide);
      enabled.removeEventListener('change', hide);
      window.removeEventListener('blur', hide);
      window.removeEventListener('resize', hide);
      window.removeEventListener('scroll', hide, true);
      document.removeEventListener('keydown', hide);
      document.removeEventListener('visibilitychange', hide);
    };
  }, [x, y]);

  return (
    <Region ref={region} className={cn('relative', className)}>
      <AnimatePresence>
        {isInside && <FollowPointer x={x} y={y}>{pointer ?? title}</FollowPointer>}
      </AnimatePresence>
      {children}
    </Region>
  );
}

export function FollowPointer({ x, y, children }: {
  x: MotionValue<number>;
  y: MotionValue<number>;
  children: ReactNode;
}) {
  return (
    <motion.div
      aria-hidden="true"
      className="following-pointer pointer-events-none fixed left-0 top-0 z-40"
      style={{ x, y }}
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.7 }}
      transition={{ duration: 0.16, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
