import type { Ref } from 'react';
import { forwardRef, useState } from 'react';
import type { InputProps } from '@heroui/react';
import { Input } from '@heroui/react';
import { EyeIcon, EyeSlashIcon } from '@phosphor-icons/react';

import { useField } from './useField';

export const Password = forwardRef((props: InputProps, ref: Ref<HTMLInputElement> | undefined) => {
  const { classNames, ...rest } = props;
  const [isVisible, setIsVisible] = useState(false);
  const commonProps = useField({}, classNames);

  const toggleVisibility = (): void => setIsVisible(!isVisible);

  return (
    <Input
      ref={ref}
      endContent={
        <button
          aria-label="toggle password visibility"
          className="focus:outline-none text-foreground-400"
          onClick={toggleVisibility}
          type="button"
        >
          {isVisible ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
        </button>
      }
      type={isVisible ? 'text' : 'password'}
      {...commonProps}
      {...rest}
    />
  );
});

Password.displayName = 'Password';
