import { type HTMLAttributes, type Ref } from 'react';
import { cn } from '@heroui/react';

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
  size?: 'sm' | 'md' | 'lg';
}

export default function ColorBox(props: ColorBoxProps) {
  const { as: Component = 'button', className, color, size = 'md', ...rest } = props;

  const sizes = {
    sm: 'size-8 rounded-small',
    md: 'size-12 rounded-medium',
    lg: 'size-16 rounded-large',
  };

  const sharedClassName = cn('shrink-0', sizes[size], className);

  if (Component === 'span') {
    const { 'aria-label': ariaLabel = 'Color Box', as: _, ...spanRest } = rest as ColorBoxSpanProps;

    return (
      <span
        aria-label={ariaLabel}
        className={sharedClassName}
        style={{ backgroundColor: color }}
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
      style={{ backgroundColor: color }}
      type="button"
      {...buttonRest}
    />
  );
}
