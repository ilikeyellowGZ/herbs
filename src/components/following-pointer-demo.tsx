import type { ReactNode } from 'react';
import { FollowerPointerCard } from '@/components/ui/following-pointer';
import FooterCursor from './FooterCursor';

// The registry demo adapted to the site's footer and original botanical logo.
export default function FollowingPointerDemo({ children, className }: {
  children: ReactNode;
  className?: string;
}) {
  return <FollowerPointerCard as="footer" className={className} pointer={<FooterCursor />}>
    {children}
  </FollowerPointerCard>;
}
