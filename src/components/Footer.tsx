import { Link } from 'react-router';
import { cn } from '@heroui/react';

import useTheme from '~/hooks/useTheme';

import Contact from '~/components/Contact';

interface FooterProps {
  hideBorder?: boolean;
}

export default function Footer({ hideBorder = false }: FooterProps) {
  const { isDarkMode } = useTheme();

  return (
    <footer
      className={cn(
        'w-full flex items-center justify-center gap-2 flex-wrap p-4 text-foreground-500',
        {
          'border-t border-default': !hideBorder,
        },
      )}
      data-testid="Footer"
    >
      <Contact />
      <span className="text-foreground-500">·</span>
      <Link to="/about">About</Link>
      <span className="text-foreground-500">·</span>
      <Link to="/privacy">Privacy</Link>
      <span className="text-foreground-500">·</span>
      <Link to="/terms">Terms</Link>
      <span className="text-foreground-500">·</span>
      <a
        className="inline-flex items-center gap-2"
        href="https://github.com/gilbarbara/color-lab"
        rel="noopener noreferrer"
        target="_blank"
      >
        <img
          alt="GitHub"
          className="size-3"
          src={isDarkMode ? '/icons/github-dark.svg' : '/icons/github.svg'}
        />
        GitHub
      </a>
    </footer>
  );
}
