import type { ReactNode } from 'react';
import { type CheckboxProps, Chip, useCheckbox, VisuallyHidden } from '@heroui/react';
import { CheckIcon, XIcon } from '@phosphor-icons/react';

interface CheckboxToggleProps extends CheckboxProps {
  endContent?: ReactNode;
}

export default function CheckboxToggle(props: CheckboxToggleProps) {
  const { endContent, style, ...rest } = props;

  const { children, getBaseProps, getInputProps, getLabelProps, isSelected } = useCheckbox({
    ...rest,
  });

  let content: ReactNode = isSelected ? 'Enabled' : 'Disabled';

  if (children) {
    content = children;
  }

  return (
    // eslint-disable-next-line jsx-a11y/label-has-associated-control
    <label {...getBaseProps()}>
      <VisuallyHidden>
        <input {...getInputProps()} />
      </VisuallyHidden>
      <Chip
        classNames={{
          base: 'px-2',
          content: 'font-medium text-small',
        }}
        endContent={endContent}
        startContent={isSelected ? <CheckIcon /> : <XIcon />}
        style={style}
        {...getLabelProps()}
      >
        {content}
      </Chip>
    </label>
  );
}
