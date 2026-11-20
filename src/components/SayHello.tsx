import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

// Set the confirmed company profile without guessing a business handle.
const instagramUrl = import.meta.env.VITE_INSTAGRAM_URL?.trim();
const hasProfile = !!instagramUrl && /^https:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._]+\/?$/.test(instagramUrl);

export default function SayHello({ children = 'Say hello', className, onClick }: { children?: ReactNode; className?: string; onClick?: () => void }) {
  return hasProfile
    ? <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className={className} onClick={onClick}>{children}</a>
    : <Link to="/contact" className={className} onClick={onClick}>{children}</Link>;
}
