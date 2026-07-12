import { memo } from 'react';
import { Button, Card, CardBody, CardHeader } from '@heroui/react';
import { RocketLaunchIcon, VinylRecordIcon } from '@phosphor-icons/react';

const BAR_HEIGHTS = [55, 80, 40, 95, 70, 60];
const BAR_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

function PreviewCards() {
  return (
    <section
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      data-testid="Preview-Cards"
      inert
    >
      <Card className="bg-(--color-preview) text-(--color-preview-foreground)">
        <CardHeader className="flex flex-col items-start gap-3">
          <span className="inline-flex items-center justify-center size-10 rounded-full bg-(--color-preview-foreground)/15">
            <RocketLaunchIcon className="text-xl" weight="fill" />
          </span>
          <h4 className="text-2xl font-semibold leading-tight">Track your expenses</h4>
          <p className="text-sm opacity-80">
            See spending patterns at a glance and stay ahead of your budget.
          </p>
        </CardHeader>
        <CardBody>
          <Button className="self-start bg-(--color-preview-200) text-(--color-preview-900)">
            Get started
          </Button>
        </CardBody>
      </Card>

      <Card className="bg-surface-alt">
        <CardHeader className="flex items-center justify-between">
          <div className="flex flex-col">
            <p className="text-sm text-foreground-500">Expenses</p>
            <p className="text-2xl font-semibold">$12,543</p>
          </div>
        </CardHeader>
        <CardBody className="gap-2">
          <div className="flex items-end justify-between h-24 gap-2">
            {BAR_HEIGHTS.map((h, index) => (
              <span
                key={BAR_LABELS[index]}
                className="flex-1 rounded-sm bg-(--color-preview)"
                style={{ height: `${h}%`, opacity: h / 100 }}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-foreground-500">
            {BAR_LABELS.map(label => (
              <span key={label} className="flex-1 text-center">
                {label}
              </span>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card className="bg-(--color-preview-50) md:max-lg:col-span-full mx-auto w-full md:max-lg:max-w-lg">
        <CardBody className="items-center justify-center">
          <VinylRecordIcon className="text-(--color-preview)" size={128} weight="fill" />
          <p className="mt-2 mb-3 text-2xl text-center font-bold text-(--color-preview-900)">
            New album is out
          </p>
          <Button
            className="bg-(--color-preview) text-(--color-preview-foreground)"
            color="primary"
          >
            Buy Now
          </Button>
        </CardBody>
      </Card>
    </section>
  );
}

export default memo(PreviewCards);
