import type { Ref } from 'react';
import { forwardRef } from 'react';
import type { TextAreaProps } from '@heroui/react';
import { Textarea as HeroUITextarea } from '@heroui/react';

import { useField } from './useField';

export const Textarea = forwardRef(
  (props: TextAreaProps, ref: Ref<HTMLTextAreaElement> | undefined) => {
    const { classNames, ...rest } = props;
    const commonProps = useField({}, classNames);

    return <HeroUITextarea ref={ref} maxRows={25} {...commonProps} {...rest} />;
  },
);

Textarea.displayName = 'Textarea';
