import { ChartLineIcon } from '@phosphor-icons/react';

import useGenerator from '~/hooks/useGenerator';
import { trackEvent } from '~/utils/analytics';

import Button from '~/components/Button';
import Tooltip from '~/components/Tooltip';

import type { ColorEntry } from '~/types';

interface ColorChartsButtonProps {
  colorEntry: ColorEntry;
}

export default function ColorChartsButton(props: ColorChartsButtonProps) {
  const { colorEntry } = props;
  const { chartColorIds, setAllCharts, toggleChart } = useGenerator(
    'chartColorIds',
    'setAllCharts',
    'toggleChart',
  );
  const showGraphs = chartColorIds.has(colorEntry.id);

  return (
    <Tooltip
      content={
        <div className="space-y-1">
          <p>View Charts</p>
          <p className="text-foreground-600 text-xs">Shift-click to toggle all</p>
        </div>
      }
      placement="bottom"
    >
      <Button
        aria-expanded={showGraphs}
        aria-label={`View Charts for ${colorEntry.name}`}
        isIconOnly
        // Shift-click mirrors this button's next state across every color.
        onPress={event => {
          trackEvent('scale:charts', {
            scope: event.shiftKey ? 'all' : 'single',
            enabled: !showGraphs,
          });

          return event.shiftKey ? setAllCharts(!showGraphs) : toggleChart(colorEntry.id);
        }}
        size="menu"
        variant={showGraphs ? 'solid' : 'flat'}
      >
        <ChartLineIcon className="text-lg" />
      </Button>
    </Tooltip>
  );
}
