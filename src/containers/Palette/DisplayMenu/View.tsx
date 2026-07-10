import useApp from '~/hooks/useApp';
import { trackEvent } from '~/utils/analytics';

import ToggleGroup from '~/components/ToggleGroup';

import type { GeneratorView } from '~/types';

interface Props {
  onChange?: (value: GeneratorView) => void;
}

const VIEWS: Array<{ label: string; value: GeneratorView }> = [
  { label: 'List', value: 'list' },
  { label: 'Grid', value: 'grid' },
  { label: 'Preview', value: 'preview' },
];

export default function PaletteView(props: Props) {
  const { onChange } = props;
  const { setView, view } = useApp('view', 'setView');

  const handleChange = (value: GeneratorView): void => {
    trackEvent('palette:view', { value });
    setView(value);
    onChange?.(value);
  };

  return (
    <ToggleGroup
      className="flex-col items-start"
      items={VIEWS}
      label="View"
      onChange={handleChange}
      size="sm"
      value={view}
    />
  );
}
