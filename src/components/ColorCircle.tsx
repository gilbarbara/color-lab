import { type HTMLAttributes } from 'react';
import { cn } from '@heroui/react';

interface ColorCircleProps extends HTMLAttributes<HTMLButtonElement> {
  color: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function ColorCircle(props: ColorCircleProps) {
  const {
    'aria-label': ariaLabel = 'Color Circle',
    className,
    color,
    onClick,
    size = 'md',
    ...rest
  } = props;
  const sizes = {
    sm: 'size-4',
    md: 'size-6',
    lg: 'size-8',
  };

  return (
    <button
      aria-label={ariaLabel}
      className={cn('rounded-full shrink-0', sizes[size], className, {
        'cursor-pointer': onClick,
      })}
      onClick={onClick}
      style={{ backgroundColor: color }}
      type="button"
      {...rest}
    />
  );
}
