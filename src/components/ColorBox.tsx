import { type CSSProperties, type HTMLAttributes, type Ref } from 'react';
import { cn } from '@heroui/react';
import { convertCSS } from 'colorizr';

import { formatOklch } from '~/utils/color';

type ColorBoxButtonProps = ColorBoxBaseProps &
  Omit<HTMLAttributes<HTMLButtonElement>, 'color'> & {
    as?: 'button';
    ref?: Ref<HTMLButtonElement>;
  };

type ColorBoxProps = ColorBoxButtonProps | ColorBoxSpanProps;

type ColorBoxSpanProps = ColorBoxBaseProps &
  Omit<HTMLAttributes<HTMLSpanElement>, 'color'> & {
    as: 'span';
  };

interface ColorBoxBaseProps {
  color: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'full';
}

export default function ColorBox(props: ColorBoxProps) {
  const { as: Component = 'button', className, color, size = 'md', ...rest } = props;

  // Emit both gamut formats as CSS custom properties. The Tailwind classes
  // `bg-(--gamut-bg-oklch)` (default) and `gamut-srgb:bg-(--gamut-bg-hex)`
  // resolve var() at this element where the properties are actually set —
  // a chained `:root { --gamut-bg: var(--gamut-bg-oklch) }` would resolve at
  // :root (where the per-element vars aren't defined) and yield empty.
  const gamutStyle = {
    '--gamut-bg-oklch': formatOklch(color),
    '--gamut-bg-hex': convertCSS(color, 'hex'),
  } as CSSProperties;

  const sizes = {
    xs: 'size-6 rounded-small',
    sm: 'size-8 rounded-small',
    md: 'size-12 rounded-medium',
    lg: 'size-16 rounded-large',
    full: 'w-full rounded-large aspect-square',
  };

  const sharedClassName = cn(
    'shrink-0 bg-(--gamut-bg-oklch) gamut-srgb:bg-(--gamut-bg-hex)',
    sizes[size],
    className,
  );

  if (Component === 'span') {
    const { 'aria-label': ariaLabel = 'Color Box', as: _, ...spanRest } = rest as ColorBoxSpanProps;

    return (
      <span aria-label={ariaLabel} className={sharedClassName} style={gamutStyle} {...spanRest} />
    );
  }

  const {
    'aria-label': ariaLabel = 'Color Box',
    as: _,
    onClick,
    ...buttonRest
  } = rest as ColorBoxButtonProps;

  return (
    <button
      aria-label={ariaLabel}
      className={cn(sharedClassName, { 'cursor-pointer': onClick })}
      data-color={color}
      data-testid="ColorBox"
      onClick={onClick}
      style={gamutStyle}
      type="button"
      {...buttonRest}
    />
  );
}
