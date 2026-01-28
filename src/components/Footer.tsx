import { Link } from 'react-router';
import { cn } from '@heroui/react';

import Contact from '~/components/Contact';

interface FooterProps {
  hideBorder?: boolean;
}

export default function Footer({ hideBorder = false }: FooterProps) {
  return (
    <footer
      className={cn('w-full flex items-center justify-center gap-2 flex-wrap p-4', {
        'border-t border-default': !hideBorder,
      })}
      data-uid="Footer"
    >
      <Contact />
      <span className="text-foreground-500">·</span>
      <Link to="/about">About</Link>
      <span className="text-foreground-500">·</span>
      <Link to="/privacy">Privacy</Link>
      <span className="text-foreground-500">·</span>
      <Link to="/terms">Terms</Link>
      <span className="text-foreground-500">·</span>
      <a href="https://x.com/gilbarbara" rel="noopener noreferrer" target="_blank">
        @gilbarbara
      </a>
    </footer>
  );
}
