import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export default function SayHello({ children = 'Say hello', className, onClick }: { children?: ReactNode; className?: string; onClick?: () => void }) {
  return <Link to="/contact" className={className} onClick={onClick}>{children}</Link>;
}
