import { extendVariants, Switch as HeroUISwitch } from '@heroui/react';

const Switch = extendVariants(HeroUISwitch, {
  defaultVariants: {
    size: 'sm',
  },
  slots: {
    thumb: 'bg-background',
  },
  variants: {
    size: {
      xs: {
        label: 'inline-flex gap-1 text-sm/4',
        thumb: 'size-3 group-data-[selected=true]:ms-4',
        wrapper: 'h-4 w-8 px-0.5',
      },
    },
  },
});

export default Switch;
