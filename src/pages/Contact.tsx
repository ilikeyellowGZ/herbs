import Contact from '../components/Contact';
import ResponsiveImage from '../components/ResponsiveImage';

export default function ContactPage() {
  return <div className="destination-page">
    <div className="contact-hero">
      <ResponsiveImage name="contact-tea" sizes="(max-width: 640px) 180vw, 100vw" priority />
    </div>
    <Contact />
  </div>;
}
