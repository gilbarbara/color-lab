import { type DOMAttributes, type ReactNode } from 'react';
import { Chip } from '@heroui/react';

interface SliderValueProps extends DOMAttributes<HTMLOutputElement> {
  children?: ReactNode;
  defaultValues: [number] | [number, number];
}

export default function SliderValue(props: SliderValueProps) {
  const { children, defaultValues, ...rest } = props;
  const [defaultPrimary, defaultSecondary] = defaultValues;

  if (typeof children !== 'string') {
    return <output {...rest}>{children}</output>;
  }

  const [primary, secondary] = children.split('–').map(d => parseFloat(d.trim()));

  if (secondary !== undefined) {
    return (
      <output {...rest} className="flex gap-2 text-small">
        <Chip
          as="span"
          className="w-12 max-w-none text-center"
          color={primary === defaultPrimary ? 'default' : 'primary'}
          size="sm"
        >
          {primary}
        </Chip>
        <Chip
          as="span"
          className="w-12 max-w-none text-center"
          color={secondary === defaultSecondary ? 'default' : 'primary'}
          size="sm"
        >
          {secondary}
        </Chip>
      </output>
    );
  }

  return (
    <output {...rest}>
      <Chip
        as="span"
        className="w-12 max-w-none text-center"
        color={primary === defaultPrimary ? 'default' : 'primary'}
        size="sm"
      >
        {primary}
      </Chip>
    </output>
  );
}
