import { useSetState } from '@gilbarbara/hooks';
import { Input } from '@heroui/react';
import { type ColorMode } from '@transience/color-picker';
import { convertCSS } from 'colorizr';

import { formatOklch, isValidColorValue } from '~/utils/color';

interface ColorInputProps {
  color: string;
  mode: ColorMode;
  name: string;
  onChange: (value: string) => void;
}

interface ColorInputState {
  editInput: string;
  isEditingInput: boolean;
}

export default function ColorInput(props: ColorInputProps) {
  const { color, mode, name, onChange } = props;
  const [{ editInput, isEditingInput }, setState] = useSetState<ColorInputState>({
    editInput: '',
    isEditingInput: false,
  });

  let display = mode === 'oklch' ? formatOklch(color) : convertCSS(color, 'hex');

  if (isEditingInput) {
    display = editInput;
  }

  const handleFocus = () => {
    setState({ isEditingInput: true, editInput: display });
  };

  const handleBlur = () => {
    setState({ isEditingInput: false });
  };

  const handleChange = (value: string) => {
    const trimmed = value.trim();
    const bareHexPattern = /^(?:[\da-f]{3}){1,2}$/i;

    if (bareHexPattern.test(trimmed)) {
      const prefixed = `#${trimmed}`;

      setState({ editInput: prefixed });

      onChange(prefixed);

      return;
    }

    setState({ editInput: value });

    // Only accept 3/6-char hex (no RGBA) to avoid transparent colors
    if (/^#[\da-f]+$/i.test(trimmed) && trimmed.length !== 4 && trimmed.length !== 7) {
      return;
    }

    if (isValidColorValue(trimmed)) {
      onChange(trimmed);
    }
  };

  return (
    <Input
      aria-label={`Color value for ${name}`}
      classNames={{
        inputWrapper: 'h-8 min-h-8 px-2',
      }}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onValueChange={handleChange}
      type="text"
      value={display}
      variant="bordered"
    />
  );
}
