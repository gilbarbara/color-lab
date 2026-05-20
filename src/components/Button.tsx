import { extendVariants, Button as HeroUIButton } from '@heroui/react';

const Button = extendVariants(HeroUIButton, {
  compoundVariants: [
    {
      isIconOnly: true,
      size: 'xs',
      class: 'px-0 min-w-6 w-6',
    },
    {
      isIconOnly: true,
      size: 'menu',
      class: 'px-0 min-w-8 w-8',
    },
  ],
  defaultVariants: {
    size: 'md',
  },
  variants: {
    isIconOnly: {
      true: '',
      false: '',
    },
    size: {
      xs: 'px-2 min-w-12 h-6 text-tiny gap-1 rounded-small',
      menu: 'px-2 min-w-16 h-8 text-small gap-2 rounded-medium',
    },
  },
});

export default Button;
export type { ButtonProps } from '@heroui/react';
