import { memo } from 'react';
import { Tab, Tabs } from '@heroui/react';

interface PreviewToolbarProps {
  onViewChange: (view: PreviewView) => void;
  view: PreviewView;
}

export type PreviewView = 'components' | 'typography';

function PreviewToolbar({ onViewChange, view }: PreviewToolbarProps) {
  return (
    <section className="flex flex-wrap items-center gap-3" data-testid="Preview-Toolbar">
      <Tabs
        aria-label="Preview section"
        classNames={{
          cursor: 'bg-(--color-preview) text-(--color-preview-foreground)',
          tabContent: 'group-data-[selected=true]:text-(--color-preview-foreground)',
        }}
        color="primary"
        onSelectionChange={key => onViewChange(key as PreviewView)}
        selectedKey={view}
        size="sm"
        variant="solid"
      >
        <Tab key="components" title="Components" />
        <Tab key="typography" title="Typography" />
      </Tabs>
    </section>
  );
}

export default memo(PreviewToolbar);
