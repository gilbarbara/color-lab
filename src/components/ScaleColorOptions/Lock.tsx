import { useMemo } from 'react';
import { cn, Select, SelectItem, type SharedSelection } from '@heroui/react';
import { LockIcon } from '@phosphor-icons/react';
import { getScaleStepKeys } from 'colorizr';

import { trackEvent } from '~/utils/analytics';

import Badge from '~/components/Badge';

import type { GlobalScaleOptions } from '~/types';

import type { ScaleColorSharedProps } from './types';

interface LockProps {
  lock: GlobalScaleOptions['lock'];
  onUpdate: ScaleColorSharedProps['onUpdate'];
  steps: number;
}

export default function Lock(props: LockProps) {
  const { lock, onUpdate, steps } = props;

  const locks = useMemo(() => ['None', ...getScaleStepKeys(steps).map(d => `${d}`)], [steps]);

  const handleChangeLock = ({ currentKey }: SharedSelection) => {
    if (!currentKey || currentKey === 'None') {
      trackEvent('color:lock', { value: 'none' });
      onUpdate({ lock: undefined });

      return;
    }

    trackEvent('color:lock', { value: currentKey });
    onUpdate({ lock: parseInt(currentKey, 10) });
  };

  return (
    <div data-testid="ColorLock">
      <Badge content="" isInvisible={!lock}>
        <Select
          aria-label="Color Lock"
          classNames={{
            trigger: cn('bg-default-200 w-24', {
              'data-[hover=true]:bg-default-400': !!lock,
            }),
          }}
          data-testid="ColorLockOptions"
          name="lock"
          onSelectionChange={handleChangeLock}
          placeholder="Lock"
          selectedKeys={lock ? [lock.toString()] : []}
          size="sm"
          startContent={<LockIcon className="text-lg" />}
        >
          {locks.map(v => (
            <SelectItem key={v}>{v}</SelectItem>
          ))}
        </Select>
      </Badge>
    </div>
  );
}
