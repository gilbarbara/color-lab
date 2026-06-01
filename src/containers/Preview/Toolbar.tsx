import { memo } from 'react';
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Tab,
  Tabs,
} from '@heroui/react';
import {
  ArrowsClockwiseIcon,
  CalendarBlankIcon,
  CaretDownIcon,
  DownloadSimpleIcon,
} from '@phosphor-icons/react';

function PreviewToolbar() {
  return (
    <section
      className="flex flex-wrap items-center justify-between gap-3"
      data-testid="Preview-Toolbar"
    >
      <Tabs
        aria-label="Section"
        classNames={{
          cursor: 'bg-(--color-preview) text-(--color-preview-foreground)',
          tabContent: 'group-data-[selected=true]:text-(--color-preview-foreground)',
        }}
        color="primary"
        size="sm"
        variant="solid"
      >
        <Tab key="overview" title="Overview" />
        <Tab key="sales" title="Sales" />
        <Tab key="expenses" title="Expenses" />
      </Tabs>
      <div className="flex items-center gap-2">
        <Button aria-label="Refresh" isIconOnly size="sm" variant="flat">
          <ArrowsClockwiseIcon className="text-base" />
        </Button>
        <Dropdown>
          <DropdownTrigger>
            <Button
              endContent={<CaretDownIcon className="text-sm" />}
              size="sm"
              startContent={<CalendarBlankIcon className="text-base" />}
              variant="flat"
            >
              Monthly
            </Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="Period">
            <DropdownItem key="daily">Daily</DropdownItem>
            <DropdownItem key="weekly">Weekly</DropdownItem>
            <DropdownItem key="monthly">Monthly</DropdownItem>
            <DropdownItem key="yearly">Yearly</DropdownItem>
          </DropdownMenu>
        </Dropdown>
        <Button
          className="bg-(--color-preview) text-(--color-preview-foreground)"
          color="primary"
          size="sm"
          startContent={<DownloadSimpleIcon className="text-base" />}
        >
          Download
        </Button>
      </div>
    </section>
  );
}

export default memo(PreviewToolbar);
