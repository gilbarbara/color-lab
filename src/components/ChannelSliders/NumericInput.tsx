import { type KeyboardEvent, useState } from 'react';

interface NumericInputProps {
  max: number;
  min: number;
  onChange: (value: number) => void;
  step?: number;
  suffix?: string;
  value: string;
}

export default function NumericInput(props: NumericInputProps) {
  const { max, min, onChange, step = 1, suffix, value } = props;
  const [editValue, setEditValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const displayValue = isEditing ? editValue : value;

  const clamp = (n: number) => Math.min(max, Math.max(min, n));

  const commit = (raw: string) => {
    if (raw.endsWith('.') || raw.endsWith(',')) return;

    const parsed = Number.parseFloat(raw.replace(',', '.'));

    if (!Number.isNaN(parsed)) {
      onChange(clamp(parsed));
    }
  };

  const handleFocus = () => {
    setIsEditing(true);
    setEditValue(value);
  };

  const handleChange = (newValue: string) => {
    const filtered = newValue.replace(/[^\d,.]/g, '').replace(',', '.');

    setEditValue(filtered);
    commit(filtered);
  };

  const handleBlur = () => {
    const parsed = Number.parseFloat(editValue.replace(',', '.'));

    if (!Number.isNaN(parsed)) {
      onChange(clamp(parsed));
    }

    setIsEditing(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();

      const current = Number.parseFloat((isEditing ? editValue : value).replace(',', '.')) || 0;
      const increment = event.shiftKey ? step * 10 : step;
      const next = event.key === 'ArrowUp' ? current + increment : current - increment;
      const clamped = clamp(next);

      onChange(clamped);
    }
  };

  return (
    <div className="flex items-center">
      <input
        className="w-11 bg-white/10 text-right text-sm text-foreground-600 outline-none focus:ring-1 focus:ring-foreground-300 rounded px-0.5"
        onBlur={handleBlur}
        onChange={event => handleChange(event.target.value)}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        type="text"
        value={displayValue}
      />
      {suffix && (
        <span
          className="w-2 text-xs text-foreground-500"
          style={suffix === ' ' ? { visibility: 'hidden' } : undefined}
        >
          {suffix === ' ' ? '°' : suffix}
        </span>
      )}
    </div>
  );
}
