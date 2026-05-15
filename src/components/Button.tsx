import { extendVariants, Button as HeroUIButton } from '@heroui/react';

const Button = extendVariants(HeroUIButton, {
  compoundVariants: [
    {
      isIconOnly: true,
      size: 'xs',
      class: 'px-0 min-w-6 w-6',
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
    },
  },
});

export default Button;
export type { ButtonProps } from '@heroui/react';
