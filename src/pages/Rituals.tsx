import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

export default function Rituals() {
  return <div className="destination-page"><section id="rituals" className="rituals-section section-gutters">
      <div className="rituals-heading"><p className="eyebrow">There’s no right way to slow down</p><h1>Find your <em>little ritual.</em></h1></div>
      <div className="ritual-grid"><Link to="/products/hibiscus" className="ritual-card"><span className="ritual-time">When the kettle goes on</span><h3>The slow-down cup.</h3><p>Hibiscus, warm water, a little time.<br />Some things need very little else.</p><span className="text-link">Put the kettle on <ArrowUpRight size={17} /></span></Link><Link to="/products/chia-seeds" className="ritual-card"><span className="ritual-time">Before the day begins</span><h3>Morning, unhurried.</h3><p>A bowl left overnight. Something fresh.<br />A small favour for your future self.</p><span className="text-link">Meet chia seeds <ArrowUpRight size={17} /></span></Link><Link to="/products/bay-leaves" className="ritual-card"><span className="ritual-time">Something on the stove</span><h3>A leaf in the pot.</h3><p>Bay, a gentle simmer, the kitchen<br />smelling like someone’s home.</p><span className="text-link">Back to the kitchen <ArrowUpRight size={17} /></span></Link></div>
    </section></div>;
}
