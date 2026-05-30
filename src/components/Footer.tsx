import { cn } from '@heroui/react';
import Link from 'next/link';

import Contact from '~/components/Contact';

interface FooterProps {
  hideBorder?: boolean;
}

export default function Footer({ hideBorder = false }: FooterProps) {
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
      <Link href="/about">About</Link>
      <span className="text-foreground-500">·</span>
      <Link href="/privacy">Privacy</Link>
      <span className="text-foreground-500">·</span>
      <Link href="/terms">Terms</Link>
      <span className="text-foreground-500">·</span>
      <a
        className="inline-flex items-center gap-2"
        href="https://github.com/gilbarbara/color-lab"
        rel="noopener noreferrer"
        target="_blank"
      >
        <img alt="GitHub" className="size-3 block dark:hidden" src="/icons/github.svg" />
        <img alt="GitHub" className="size-3 hidden dark:block" src="/icons/github-dark.svg" />
        GitHub
      </a>
    </footer>
  );
}
