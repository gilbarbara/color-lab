import { type CSSProperties } from 'react';
import { Slider, type SliderProps } from '@heroui/react';

interface GradientSliderProps extends SliderProps {
  gradient: string;
  onValueChange: (value: number) => void;
}

export default function GradientSlider(props: GradientSliderProps) {
  const { gradient, onValueChange, step = 0.01, ...rest } = props;

  return (
    <div style={{ '--slider-gradient': gradient } as CSSProperties}>
      <Slider
        classNames={{
          track: 'bg-transparent border-0 bg-[image:var(--slider-gradient)]',
          filler: 'bg-transparent',
          startContent: 'w-3 mr-2',
        }}
        color="foreground"
        hideValue
        minValue={0}
        onChange={v => onValueChange(v as number)}
        step={step}
        {...rest}
      />
    </div>
  );
}
