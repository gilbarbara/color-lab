import { extendVariants, Badge as HeroUIBadge } from '@heroui/react';

const Badge = extendVariants(HeroUIBadge, {
  defaultVariants: {
    color: 'secondary',
    isDot: 'true',
    size: 'xs',
    showOutline: 'false',
  },
  variants: {
    size: {
      xs: {
        badge: 'w-2.5 h-2.5 min-w-2.5 min-h-2.5',
      },
    },
  },
});

export default Badge;
