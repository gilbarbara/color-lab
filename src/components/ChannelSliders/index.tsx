import HSLSliders from './HSLSliders';
import OKLCHSliders from './OKLCHSliders';
import RGBSliders from './RGBSliders';

interface ChannelSlidersProps {
  color: string;
  disableSaturation?: boolean;
  mode: ColorMode;
  onChangeColor: (value: string) => void;
}

export type ColorMode = 'hsl' | 'oklch' | 'rgb';

export default function ChannelSliders(props: ChannelSlidersProps) {
  const { color, disableSaturation = false, mode, onChangeColor } = props;

  return (
    <div className="space-y-3" data-uid="ChannelSliders">
      {mode === 'hsl' && (
        <HSLSliders
          color={color}
          disableSaturation={disableSaturation}
          onChangeColor={onChangeColor}
        />
      )}
      {mode === 'rgb' && <RGBSliders color={color} onChangeColor={onChangeColor} />}
      {mode === 'oklch' && (
        <OKLCHSliders
          color={color}
          disableChroma={disableSaturation}
          onChangeColor={onChangeColor}
        />
      )}
    </div>
  );
}
