import { Link } from 'react-router-dom';
import Accordion from '../components/Accordion';

export default function Faqs() {
  return <div className="destination-page"><section id="faqs" className="faq-section section-gutters"><div><p className="eyebrow">A few things you might be wondering</p><h1>A little <em>clarity.</em></h1><Link to="/contact" className="text-link">Something else on your mind?</Link></div><div><Accordion items={[
      { title: 'Where do I begin?', content: 'Start with what catches your eye. Each ingredient has its own page with a little more about its character and everyday use. If you’d like a hand choosing, say hello.' },
      { title: 'How do I order?', content: 'We’re currently introducing the collection. Use the enquiry form to ask about your chosen ingredient, available formats and current pricing. Online checkout is not connected in this preview.' },
      { title: 'Where are you based?', content: 'Herby Health is based in Gauteng, South Africa. Enquire with your location so we can confirm current delivery or collection arrangements.' },
      { title: 'Can you help me choose an ingredient?', content: 'Of course. Tell us what you’re curious about and we can share product information. For individual supplement suitability, speak to a qualified healthcare practitioner.' },
      { title: 'Will my product look exactly like the photos?', content: 'The images show our visual direction and concept packaging. Please enquire to confirm the actual product format, contents and final packaging before ordering.' },
    ]} /></div></section></div>;
}
