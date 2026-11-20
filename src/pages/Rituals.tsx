import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import ResponsiveImage from '../components/ResponsiveImage';

export default function Rituals() {
  return (
    <div className="destination-page rituals-page">
      <section id="rituals" className="rituals-hero section-gutters" aria-labelledby="rituals-title">
        <div className="rituals-intro">
          <p className="eyebrow">There’s no right way to slow down</p>
          <h1 id="rituals-title">Find your <em>little ritual.</em></h1>
          <p>A cup in your hands. A moment to yourself.<br />Good things begin with the little things.</p>
        </div>
        <figure className="rituals-hero-figure">
          <ResponsiveImage name="rituals-model" className="rituals-hero-image" sizes="(max-width: 640px) calc(150vw - 72px), (min-width: 1488px) 1440px, calc(100vw - 48px)" priority />
          <figcaption className="rituals-hero-caption">
            <span>Hibiscus. Warm light. A little time.</span>
            <Link to="/products/hibiscus" className="text-link">Meet your slow-down cup <ArrowUpRight size={17} aria-hidden="true" /></Link>
          </figcaption>
        </figure>
      </section>

      <section className="rituals-feature section-gutters" aria-labelledby="rituals-feature-title">
        <div className="rituals-feature-inner">
          <ResponsiveImage name="rituals-preparation" className="rituals-preparation-image" sizes="(min-width: 1280px) 560px, (min-width: 768px) 45vw, calc(100vw - 48px)" />
          <div className="rituals-feature-copy">
            <p className="eyebrow">The slow-down cup</p>
            <h2 id="rituals-feature-title">A little pause.<br /><em>A deeper shade of red.</em></h2>
            <p>There’s something about watching hibiscus turn the water ruby. The kettle settles. The petals unfurl. For a moment, there’s nowhere else to be.</p>
            <p>Make it warm, or let it cool over ice. Follow the preparation directions on your pack, then find a favourite spot and make the moment yours.</p>
            <Link to="/products/hibiscus" className="text-link">Make time for hibiscus <ArrowUpRight size={17} aria-hidden="true" /></Link>
          </div>
        </div>
      </section>

      <section className="rituals-section section-gutters" aria-labelledby="everyday-rituals-title">
        <div className="rituals-heading">
          <p className="eyebrow">Small things, every day</p>
          <h2 id="everyday-rituals-title">A place in your <em>everyday.</em></h2>
        </div>
        <div className="ritual-grid">
          <Link to="/products/hibiscus" className="ritual-card">
            <span className="ritual-time">When the kettle goes on</span>
            <h3>The slow-down cup.</h3>
            <p>Hibiscus, warm water, a little time.<br />{' '}Some things need very little else.</p>
            <span className="text-link">Put the kettle on <ArrowUpRight size={17} aria-hidden="true" /></span>
          </Link>
          <Link to="/products/chia-seeds" className="ritual-card">
            <span className="ritual-time">Before the day begins</span>
            <h3>Morning, unhurried.</h3>
            <p>A bowl left overnight. Something fresh.<br />{' '}A small favour for your future self.</p>
            <span className="text-link">Meet chia seeds <ArrowUpRight size={17} aria-hidden="true" /></span>
          </Link>
          <Link to="/products/bay-leaves" className="ritual-card">
            <span className="ritual-time">Something on the stove</span>
            <h3>A leaf in the pot.</h3>
            <p>Bay, a gentle simmer, the kitchen<br />{' '}smelling like someone’s home.</p>
            <span className="text-link">Back to the kitchen <ArrowUpRight size={17} aria-hidden="true" /></span>
          </Link>
        </div>
      </section>
    </div>
  );
}
