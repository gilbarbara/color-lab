import { cn } from '@heroui/react';

interface LogoProps {
  className?: string;
  isGray?: boolean;
}

export default function Logo(props: LogoProps) {
  const { className, isGray = true } = props;

  return (
    <span className={cn('inline-flex items-start gap-1', className)}>
      <picture>
        <source media="(min-width: 640px)" srcSet="/brand/logo.svg" />
        <img
          alt="ColorMeUp"
          className={cn('h-8', isGray ? 'grayscale' : '')}
          src="/brand/icon.svg"
        />
      </picture>

      <span className="font-bold text-sm">LAB</span>
    </span>
  );
}
