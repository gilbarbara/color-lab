import { Tab, Tabs } from '@heroui/react';

import ChromaChart from './ChromaChart';
import HueChart from './HueChart';
import LightnessChart from './LightnessChart';
import type { ColorChartsProps } from './types';

/**
 * Tabbed scale charts (Chroma default, Lightness, Hue). The tab bar doubles as
 * the chart title. Inactive panels unmount, so only the visible chart computes.
 */
export default function ColorCharts(props: ColorChartsProps) {
  const { colorEntry, options, steps } = props;

  return (
    <div className="bg-surface p-2 pl-1 rounded-xl" data-testid="ColorCharts">
      <Tabs
        aria-label="Scale chart"
        classNames={{
          base: 'flex justify-end',
          cursor: 'bg-default',
          panel: 'p-0 pt-1',
          tabList: 'p-0 overflow-visible',
        }}
        radius="full"
        size="sm"
      >
        <Tab key="chroma" title="Chroma">
          <ChromaChart colorEntry={colorEntry} options={options} steps={steps} />
        </Tab>
        <Tab key="lightness" title="Lightness">
          <LightnessChart colorEntry={colorEntry} options={options} steps={steps} />
        </Tab>
        <Tab key="hue" title="Hue">
          <HueChart colorEntry={colorEntry} options={options} steps={steps} />
        </Tab>
      </Tabs>
    </div>
  );
}
