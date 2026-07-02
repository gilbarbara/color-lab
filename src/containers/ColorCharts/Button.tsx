import { ChartLineIcon } from '@phosphor-icons/react';

import useGenerator from '~/hooks/useGenerator';
import { trackEvent } from '~/utils/analytics';

import Button from '~/components/Button';
import Tooltip from '~/components/Tooltip';

interface ColorChartsButtonProps {
  id: string;
}

export default function ColorChartsButton(props: ColorChartsButtonProps) {
  const { id } = props;
  const { chartColorIds, setAllCharts, toggleChart } = useGenerator(
    'chartColorIds',
    'setAllCharts',
    'toggleChart',
  );
  const showGraphs = chartColorIds.has(id);

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
        aria-label="View Charts"
        isIconOnly
        // Shift-click mirrors this button's next state across every color.
        onPress={event => {
          trackEvent('charts:toggle', {
            scope: event.shiftKey ? 'all' : 'single',
            enabled: !showGraphs,
          });

          return event.shiftKey ? setAllCharts(!showGraphs) : toggleChart(id);
        }}
        size="menu"
        variant={showGraphs ? 'solid' : 'flat'}
      >
        <ChartLineIcon className="text-lg" />
      </Button>
    </Tooltip>
  );
}
