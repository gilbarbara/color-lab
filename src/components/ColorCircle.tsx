import { type HTMLAttributes } from 'react';
import { cn } from '@heroui/react';

type ColorCircleButtonProps = ColorCircleBaseProps &
  Omit<HTMLAttributes<HTMLButtonElement>, 'color'> & {
    as?: 'button';
  };

type ColorCircleProps = ColorCircleButtonProps | ColorCircleSpanProps;

type ColorCircleSpanProps = ColorCircleBaseProps &
  Omit<HTMLAttributes<HTMLSpanElement>, 'color'> & {
    as: 'span';
  };

interface ColorCircleBaseProps {
  color: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function ColorCircle(props: ColorCircleProps) {
  const { as: Component = 'button', className, color, size = 'md', ...rest } = props;

  const sizes = {
    sm: 'size-4',
    md: 'size-6',
    lg: 'size-8',
  };

  const sharedClassName = cn('rounded-full shrink-0', sizes[size], className);

  if (Component === 'span') {
    const { as: _, ...spanRest } = rest as ColorCircleSpanProps;

    return <span className={sharedClassName} style={{ backgroundColor: color }} {...spanRest} />;
  }

  const {
    'aria-label': ariaLabel = 'Color Circle',
    as: _,
    onClick,
    ...buttonRest
  } = rest as ColorCircleButtonProps;

  return (
    <button
      aria-label={ariaLabel}
      className={cn(sharedClassName, { 'cursor-pointer': onClick })}
      data-color={color}
      data-uid="ColorCircle"
      onClick={onClick}
      style={{ backgroundColor: color }}
      type="button"
      {...buttonRest}
    />
  );
}
