import { type CSSProperties, type ReactNode, useRef } from 'react';
import { Slider, type SliderProps, type SliderValue } from '@heroui/react';

interface GradientSliderProps extends SliderProps {
  endContent?: ReactNode;
  gradient: string;
  onValueChange: (value: number) => void;
}

export default function GradientSlider(props: GradientSliderProps) {
  const { endContent, gradient, onValueChange, step = 0.01, ...rest } = props;

  const rafRef = useRef<number>(0);

  const handleChange = (v: SliderValue) => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      onValueChange(v as number);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1" style={{ '--slider-gradient': gradient } as CSSProperties}>
        <Slider
          classNames={{
            track:
              'bg-transparent border-transparent! border-x-[calc(theme(spacing.5)/2)] bg-[image:var(--slider-gradient)] bg-origin-border bg-clip-border',
            filler: 'bg-transparent',
            startContent: 'w-3 mr-2',
            thumb: 'size-5 after:size-4',
          }}
          color="foreground"
          hideValue
          minValue={0}
          onChange={handleChange}
          step={step}
          {...rest}
        />
      </div>
      {endContent}
    </div>
  );
}
