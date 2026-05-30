import { useState } from 'react';
import {
  Avatar,
  Checkbox,
  Chip,
  CircularProgress,
  Radio,
  RadioGroup,
  Slider,
  Switch,
} from '@heroui/react';
import { UserIcon } from '@phosphor-icons/react';

import Button from '~/components/Button';

export default function PreviewControls() {
  const [progress, setProgress] = useState(33);

  return (
    <section
      className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4"
      data-testid="Preview-Controls"
    >
      <div className="flex flex-col items-center lg:items-start gap-6">
        <div className="flex flex-wrap items-end gap-2">
          <Button
            className="bg-(--color-preview) text-(--color-preview-foreground)"
            color="primary"
            size="lg"
          >
            Large
          </Button>
          <Button
            className="bg-(--color-preview) text-(--color-preview-foreground)"
            color="primary"
          >
            Medium
          </Button>
          <Button
            className="bg-(--color-preview) text-(--color-preview-foreground)"
            color="primary"
            size="sm"
          >
            Small
          </Button>
          <Button
            className="bg-(--color-preview) text-(--color-preview-foreground)"
            color="primary"
            size="xs"
          >
            XSmall
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            className="border-(--color-preview) text-(--color-preview)"
            color="primary"
            variant="bordered"
          >
            Border
          </Button>
          <Button
            className="bg-(--color-preview)/20 text-(--color-preview-600)"
            color="primary"
            variant="flat"
          >
            Flat
          </Button>
          <Button
            className="text-(--color-preview) data-[hover=true]:bg-(--color-preview)/10"
            color="primary"
            variant="light"
          >
            Light
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-6 xl:items-center">
        <div className="flex flex-wrap items-center justify-center lg:justify-end xl:justify-center gap-6">
          <Switch
            classNames={{
              wrapper:
                'group-data-[selected=true]:bg-(--color-preview) group-data-[selected=true]:text-(--color-preview-foreground)',
            }}
            color="primary"
            defaultSelected
          >
            Switch
          </Switch>
          <Checkbox
            classNames={{
              wrapper:
                'after:bg-(--color-preview) after:text-(--color-preview-foreground) text-(--color-preview-foreground)',
            }}
            color="primary"
            defaultSelected
          >
            Check
          </Checkbox>
          <RadioGroup aria-label="Choice" color="primary" defaultValue="b" orientation="horizontal">
            <Radio
              classNames={{
                control: 'bg-(--color-preview) text-(--color-preview-foreground)',
                wrapper: 'group-data-[selected=true]:border-(--color-preview)',
              }}
              value="a"
            >
              One
            </Radio>
            <Radio
              classNames={{
                control: 'bg-(--color-preview) text-(--color-preview-foreground)',
                wrapper: 'group-data-[selected=true]:border-(--color-preview)',
              }}
              value="b"
            >
              Two
            </Radio>
          </RadioGroup>
        </div>
        <div className="flex flex-wrap items-center justify-center lg:justify-end xl:justify-center gap-3">
          <Avatar
            classNames={{
              base: 'bg-(--color-preview) text-(--color-preview-foreground) ring-(--color-preview)',
            }}
            color="primary"
            fallback={<UserIcon className="text-base" />}
            isBordered
          />
          <Chip
            classNames={{
              base: 'bg-(--color-preview) text-(--color-preview-foreground)',
            }}
            color="primary"
            size="lg"
          >
            Chip
          </Chip>
        </div>
      </div>
      <div className="lg:col-span-2 xl:col-span-1 flex flex-col items-center justify-center gap-6">
        <div className="border-2 border-(--color-preview) w-full max-w-sm p-4 rounded-4xl flex flex-col items-center gap-3">
          <CircularProgress
            aria-label="Progress"
            classNames={{
              svg: 'size-18 drop-shadow-md text-(--color-preview)',
              track: 'stroke-(--color-preview)/40',
              value: 'text-lg font-semibold',
            }}
            color="primary"
            showValueLabel
            size="lg"
            value={progress}
          />
          <Slider
            aria-label="Volume"
            classNames={{
              base: 'w-full',
              track: 'data-[fill-start=true]:border-s-(--color-preview)',
              filler: 'bg-(--color-preview)',
              thumb: 'bg-(--color-preview)',
            }}
            color="primary"
            defaultValue={progress}
            onChange={value => setProgress(value as number)}
            size="lg"
          />
        </div>
      </div>
    </section>
  );
}
