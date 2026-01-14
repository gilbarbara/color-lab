import type { Ref } from 'react';
import { forwardRef } from 'react';
import type { InputProps } from '@heroui/react';
import { Input as HeroUIInput } from '@heroui/react';

import { useField } from './useField';

export const Input = forwardRef((props: InputProps, ref: Ref<HTMLInputElement> | undefined) => {
  const { classNames: customClassNames, ...rest } = props;
  const commonProps = useField({}, customClassNames);

  return <HeroUIInput ref={ref} type="text" {...commonProps} {...rest} />;
});

Input.displayName = 'Input';
