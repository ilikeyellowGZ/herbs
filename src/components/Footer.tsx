import { Link } from 'react-router-dom';
import { BotanicalLogoLink } from './Logo';
import FollowingPointerDemo from './following-pointer-demo';
import SayHello from './SayHello';

export default function Footer() {
  return <FollowingPointerDemo className="site-footer section-gutters">
    <div className="footer-top"><div className="footer-brand"><BotanicalLogoLink className="footer-logo" wind /><p>Small rituals.<br />Deep roots.</p></div><div className="footer-nav"><div><h2>Explore</h2><Link to="/collection">The collection</Link><Link to="/rituals">Everyday rituals</Link><Link to="/our-story">Our story</Link></div><div><h2>Let’s talk</h2><SayHello /><Link to="/faqs">A few answers</Link><span>Gauteng, South Africa</span></div></div><div className="footer-note"><p>A cup. A leaf.<br />A moment for yourself.</p><span>A little closer to nature, every day.</span></div></div>
    <Link className="footer-wordmark" to="/" aria-label="Herby Health home">Herby Health</Link>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} Herby Health</span><span>Botanicals for the everyday.</span><a href="#main">Back to top ↑</a></div>
  </FollowingPointerDemo>;
}
