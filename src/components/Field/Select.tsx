import type { Ref } from 'react';
import { forwardRef } from 'react';
import type { SelectProps } from '@heroui/react';
import { Select as HeroUISelect } from '@heroui/react';

import { useField } from './useField';

export const Select = forwardRef((props: SelectProps, ref: Ref<HTMLSelectElement>) => {
  const { classNames, ...rest } = props;
  const commonsProps = useField({}, classNames);

  return (
    <HeroUISelect
      ref={ref}
      {...commonsProps}
      labelPlacement="outside-top"
      showScrollIndicators
      {...rest}
    />
  );
});

Select.displayName = 'Select';

export { SelectItem } from '@heroui/react';
