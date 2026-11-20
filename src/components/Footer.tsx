import { Link } from 'react-router-dom';
import { BotanicalLogoLink } from './Logo';
import SayHello from './SayHello';
import { useStore } from './StoreContext';
import { socialProfiles, safeSocialUrl } from '../data/socials.mjs';

export default function Footer() {
  const { settings } = useStore();
  const socials = socialProfiles.map(profile => ({ ...profile, url: safeSocialUrl(settings[profile.key], profile.hosts) }));
  return <footer className="site-footer section-gutters">
    <div className="footer-top"><div className="footer-brand"><BotanicalLogoLink className="footer-logo" wind /><p>Small rituals.<br />Deep roots.</p></div><div className="footer-nav"><div><h2>Explore</h2><Link to="/collection">The collection</Link><Link to="/rituals">Everyday rituals</Link><Link to="/our-story">Our story</Link></div><div><h2>Let’s talk</h2><SayHello /><Link to="/get-help">Get help</Link><Link to="/faqs">A few answers</Link>{settings.email && <a href={`mailto:${settings.email}`}>{settings.email}</a>}{settings.phone && <a href={`tel:${settings.phone}`}>{settings.phone}</a>}{settings.address && <span className="contact-address">{settings.address}</span>}</div><div className="footer-socials"><h2>Socials</h2>{socials.map(profile => profile.url ? <a key={profile.key} href={profile.url} target="_blank" rel="noopener noreferrer">{profile.label}<span className="social-link-hint"> (opens in a new tab)</span></a> : <span key={profile.key} title="Profile link not added yet">{profile.label}</span>)}{socials.some(profile => !profile.url) && <p className="footer-social-note">Profile links will be added here.</p>}</div></div><div className="footer-note"><p>A cup. A leaf.<br />A moment for yourself.</p><span>A little closer to nature, every day.</span></div></div>
    <Link className="footer-wordmark" to="/" aria-label="Herby Health home">Herby Health</Link>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} Herby Health</span><span>Botanicals for the everyday.</span><nav className="footer-legal" aria-label="Legal"><Link to="/terms-and-conditions">Terms and conditions</Link><Link to="/privacy-policy">Privacy policy</Link></nav><a href="#main">Back to top ↑</a></div>
  </footer>;
}
