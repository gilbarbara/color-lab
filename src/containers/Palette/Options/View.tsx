import useApp from '~/hooks/useApp';
import { trackEvent } from '~/utils/analytics';

import ToggleGroup from '~/components/ToggleGroup';

import type { GeneratorView } from '~/types';

const VIEWS: Array<{ label: string; value: GeneratorView }> = [
  { label: 'List', value: 'list' },
  { label: 'Grid', value: 'grid' },
  { label: 'Preview', value: 'preview' },
];

export default function PaletteView() {
  const { setView, view } = useApp('view', 'setView');

  const handleChange = (value: GeneratorView): void => {
    trackEvent('palette:view', { value });
    setView(value);
  };

  return <ToggleGroup items={VIEWS} label="View" onChange={handleChange} value={view} />;
}
