import { useMemoDeepCompare } from '@gilbarbara/hooks';
import type { InputProps, SlotsToClasses } from '@heroui/react';

import useMergeClassNames from '~/hooks/useMergeClassNames';

interface FieldConfig<S extends string> {
  readonly classNames: SlotsToClasses<S>;
  readonly labelPlacement: InputProps['labelPlacement'];
  readonly placeholder: ' ';
  readonly variant: InputProps['variant'];
}

export function useField<S extends string = 'Input'>(
  defaultClassNames: SlotsToClasses<S>,
  customClassNames?: SlotsToClasses<S>,
): FieldConfig<S> {
  const classNames = useMergeClassNames(defaultClassNames, customClassNames);

  return useMemoDeepCompare(
    (): FieldConfig<S> => ({
      labelPlacement: 'outside-top',
      placeholder: ' ',
      variant: 'bordered',
      classNames,
    }),
    [classNames],
  );
}
