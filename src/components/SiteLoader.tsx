import { useEffect, useState, useSyncExternalStore } from 'react';
import { BotanicalMark } from './Logo';
import '../loader.css';

const motionQuery = '(prefers-reduced-motion: reduce)';
const subscribeToMotion = (onChange: () => void) => {
  const media = window.matchMedia(motionQuery);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
};
const getReducedMotion = () => window.matchMedia(motionQuery).matches;
const getServerReducedMotion = () => false;

export function LoadingScreen() {
  return <div className="loading-screen" role="status" aria-label="Loading Herby Health">
    <div className="loading-screen__content" aria-hidden="true">
      <BotanicalMark className="loading-screen__mark" />
      <p className="loading-screen__wordmark"><span>Herby</span>{' '}<span>Health</span></p>
      <p className="loading-screen__message">A little nature, on its way</p>
      <div className="loading-screen__dots">
        <span className="loading-screen__dot" /><span className="loading-screen__dot" /><span className="loading-screen__dot" />
      </div>
    </div>
  </div>;
}

// Being inside Suspense makes this signal follow the actual route commit.
export function RouteReady({ onReady }: { onReady: () => void }) {
  useEffect(onReady, [onReady]);
  return null;
}

export default function SiteLoader({ ready }: { ready: boolean }) {
  const [minimumElapsed, setMinimumElapsed] = useState(false);
  const [assetsReady, setAssetsReady] = useState(false);
  const [complete, setComplete] = useState(false);
  const reduced = useSyncExternalStore(subscribeToMotion, getReducedMotion, getServerReducedMotion);
  const leaving = assetsReady && (minimumElapsed || reduced);

  useEffect(() => {
    if (complete) return;
    const minimum = window.setTimeout(() => setMinimumElapsed(true), 1600);
    // A failed asset or route must never leave a blocking overlay behind.
    const maximum = window.setTimeout(() => setAssetsReady(true), 5000);
    return () => {
      window.clearTimeout(minimum);
      window.clearTimeout(maximum);
    };
  }, [complete]);

  useEffect(() => {
    if (!ready || complete) return;
    let cancelled = false;
    const cleanups: (() => void)[] = [];
    const images = Array.from(document.querySelectorAll<HTMLImageElement>('main img:not([loading="lazy"])'));
    const imagePromises = images.map(image => new Promise<void>(resolve => {
      if (image.complete) { resolve(); return; }
      const settled = () => resolve();
      image.addEventListener('load', settled, { once: true });
      image.addEventListener('error', settled, { once: true });
      cleanups.push(() => {
        image.removeEventListener('load', settled);
        image.removeEventListener('error', settled);
      });
    }));
    void Promise.allSettled([document.fonts.ready, ...imagePromises]).then(() => {
      if (!cancelled) setAssetsReady(true);
    });
    return () => {
      cancelled = true;
      cleanups.forEach(cleanup => cleanup());
    };
  }, [ready, complete]);

  useEffect(() => {
    if (complete) return;
    const content = document.getElementById('site-content');
    const previousInert = content?.inert ?? false;
    const previousOverflow = document.body.style.overflow;
    if (content) content.inert = true;
    document.body.style.overflow = 'hidden';
    return () => {
      if (content) content.inert = previousInert;
      document.body.style.overflow = previousOverflow;
    };
  }, [complete]);

  useEffect(() => {
    if (!leaving || complete) return;
    const exit = window.setTimeout(() => setComplete(true), reduced ? 120 : 280);
    return () => window.clearTimeout(exit);
  }, [leaving, reduced, complete]);

  if (complete) return null;
  return <div className={`site-loader${leaving ? ' site-loader--leaving' : ''}`}><LoadingScreen /></div>;
}
