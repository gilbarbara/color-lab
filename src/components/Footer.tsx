import { cn } from '@heroui/react';
import Link from 'next/link';

import Contact from '~/components/Contact';

interface FooterProps {
  hideBorder?: boolean;
}

const separator = <span aria-hidden="true">·</span>;

export default function Footer({ hideBorder = false }: FooterProps) {
  return (
    <footer
      className={cn('w-full text-foreground-600', {
        'border-t border-default': !hideBorder,
      })}
      data-testid="Footer"
    >
      <div className="flex flex-col md:flex-row items-center justify-center gap-2 flex-wrap p-4">
        <div className="flex items-center justify-center gap-2">
          <Link href="/about">About</Link>
          {separator}
          <Link href="/oklch-vs-hsl">OKLCH vs HSL</Link>
          {separator}
          <Link href="/privacy">Privacy</Link>
          {separator}
          <Link href="/terms">Terms</Link>
        </div>
        <span aria-hidden="true" className="hidden md:inline">
          ·
        </span>
        <div className="flex items-center justify-center gap-2">
          <Contact />
          {separator}
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
        </div>
      </div>
    </footer>
  );
}
