import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import ResponsiveImage from '../components/ResponsiveImage';
import { BotanicalMark } from '../components/Logo';

export default function Story() {
  return <div className="destination-page"><section id="story" className="story-section section-gutters"><div className="story-photo"><ResponsiveImage name="garden-harvest" sizes="(max-width: 880px) calc(100vw - 48px), 50vw" /><span>From nature, with a little care.</span></div><div className="story-copy"><BotanicalMark /><p className="eyebrow">Rooted in the everyday</p><h1>Good things.<br />Deep <em>roots.</em></h1><p>We’re Herby Health, a botanical and everyday wellness brand based in Gauteng, South Africa.</p><p>We believe there’s something lovely in the ordinary: the first cup of the day, a meal made slowly, an ingredient you come to know by heart.</p><p>Our collection is an invitation to bring a little more of that into your day. Simply, thoughtfully, and in your own time.</p><Link to="/contact" className="text-link">A conversation starts here <ArrowUpRight size={17} strokeWidth={1.2} /></Link></div></section></div>;
}
