import { extendVariants, Button as HeroUIButton } from '@heroui/react';

const Button = extendVariants(HeroUIButton, {
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: 'px-2 min-w-12 h-8 text-xs gap-1',
    },
  },
});

export default Button;
