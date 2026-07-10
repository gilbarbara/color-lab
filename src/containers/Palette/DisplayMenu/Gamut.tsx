import { Radio, RadioGroup } from '@heroui/react';

import useApp from '~/hooks/useApp';
import { trackEvent } from '~/utils/analytics';

import type { Gamut } from '~/types';

interface Props {
  onChange?: (value: string) => void;
}

export default function GamutGroup(props: Props) {
  const { onChange } = props;

  const { gamut, setGamut } = useApp('gamut', 'setGamut');

  const handleValueChange = (value: string) => {
    const next = value as Gamut;

    setGamut(next);
    trackEvent('app:gamut', { value: next });
    onChange?.(value);
  };

  return (
    <div className="flex flex-col gap-2 mt-4">
      <RadioGroup
        classNames={{
          base: 'w-full',
          label: 'text-foreground',
        }}
        color="primary"
        label="Color gamut options"
        onValueChange={handleValueChange}
        size="sm"
        value={gamut}
      >
        <Radio className="gap-1" description={<>Wide gamut. Vivid colors.</>} value="p3">
          P3
        </Radio>
        <Radio
          className="gap-1"
          description="Standard gamut. Universal compatibility."
          value="srgb"
        >
          SRGB
        </Radio>
      </RadioGroup>
      <span className="hidden p3-unsupported:block text-xs text-foreground-500">
        We couldn&rsquo;t verify P3 support on your display.
      </span>
    </div>
  );
}
