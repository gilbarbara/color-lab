import { cn } from '@heroui/react';
import { BugIcon } from '@phosphor-icons/react';
import Link from 'next/link';

import Contact from '~/components/Contact';

interface FooterProps {
  className?: string;
  innerClassName?: string;
}

const version = process.env.NEXT_PUBLIC_APP_VERSION;

export default function Footer(props: FooterProps) {
  const { className, innerClassName } = props;

  return (
    <footer
      className={cn(
        'w-full px-4 pb-8 pt-4',
        'border-t border-default-200 text-foreground-600 print:hidden',
        className,
      )}
      data-testid="Footer"
    >
      <div className={cn('grid grid-cols-1 sm:grid-cols-2 gap-8', innerClassName)}>
        <div className="flex flex-col gap-2">
          <Link href="/about">About</Link>
          <Link href="/oklch-vs-hsl">OKLCH vs HSL</Link>
          <Link href="/custom-color-scales">Custom Color Scales</Link>
          {/*<Link href="/color-scale-vs-palette">Color Scale vs Palette</Link>*/}
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </div>
        <div className="flex flex-col gap-2">
          <Contact />
          <a
            className="inline-flex items-center gap-2"
            href="https://github.com/gilbarbara/color-lab/issues"
            rel="noopener noreferrer"
            target="_blank"
          >
            <BugIcon />
            Report a problem
          </a>
          <a
            className="inline-flex items-center gap-2"
            href="https://github.com/gilbarbara/color-lab"
            rel="noopener noreferrer"
            target="_blank"
          >
            <img alt="" className="size-3 block dark:hidden" src="/icons/github.svg" />
            <img alt="" className="size-3 hidden dark:block" src="/icons/github-dark.svg" />
            GitHub
          </a>
          <a
            className="inline-flex items-center gap-2"
            href="https://github.com/gilbarbara/colorizr"
            rel="noopener noreferrer"
            target="_blank"
          >
            colorizr
          </a>
          {version && (
            <span className="text-foreground-500" data-testid="app-version">
              v{version}
            </span>
          )}
        </div>
      </div>
    </footer>
  );
}
