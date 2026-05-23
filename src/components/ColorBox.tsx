import { type HTMLAttributes, type Ref } from 'react';
import { cn } from '@heroui/react';
import { convertCSS } from 'colorizr';

import useApp from '~/hooks/useApp';
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
  size?: 'sm' | 'md' | 'lg' | 'full';
}

export default function ColorBox(props: ColorBoxProps) {
  const { as: Component = 'button', className, color, size = 'md', ...rest } = props;

  const { gamut } = useApp('gamut');

  const displayColor = gamut === 'srgb' ? convertCSS(color, 'hex') : formatOklch(color);

  const sizes = {
    sm: 'size-8 rounded-small',
    md: 'size-12 rounded-medium',
    lg: 'size-16 rounded-large',
    full: 'w-full rounded-large aspect-square',
  };

  const sharedClassName = cn('shrink-0', sizes[size], className);

  if (Component === 'span') {
    const { 'aria-label': ariaLabel = 'Color Box', as: _, ...spanRest } = rest as ColorBoxSpanProps;

    return (
      <span
        aria-label={ariaLabel}
        className={sharedClassName}
        style={{ backgroundColor: displayColor }}
        {...spanRest}
      />
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
      style={{ backgroundColor: displayColor }}
      type="button"
      {...buttonRest}
    />
  );
}
