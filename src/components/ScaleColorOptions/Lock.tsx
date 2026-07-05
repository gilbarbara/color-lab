import { useMemo } from 'react';
import { cn, Select, SelectItem, type SharedSelection } from '@heroui/react';
import { LockIcon } from '@phosphor-icons/react';
import { getScaleStepKeys } from 'colorizr';

import { trackEvent } from '~/utils/analytics';

import Badge from '~/components/Badge';

import type { GlobalScaleOptions } from '~/types';

import type { ScaleColorSharedProps } from './types';

interface LockProps {
  /** True when the color has its own lock override (not merely the inherited global lock). */
  hasOverride: boolean;
  lock: GlobalScaleOptions['lock'];
  onUpdate: ScaleColorSharedProps['onUpdate'];
  /**
   * Whether to offer "None". Only when there is no global lock to inherit: an explicit
   * per-color "no lock" can't be represented (the override would be `undefined`, which is
   * indistinguishable from "inherit" and doesn't serialize to the URL). With a global lock
   * set, revert by picking the global value instead — it dedupes back to inheriting.
   */
  showNone: boolean;
  steps: number;
}

export default function Lock(props: LockProps) {
  const { hasOverride, lock, onUpdate, showNone, steps } = props;

  const locks = useMemo(
    () => [...(showNone ? ['None'] : []), ...getScaleStepKeys(steps).map(d => `${d}`)],
    [showNone, steps],
  );

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
      <Badge content="" isInvisible={!hasOverride}>
        <Select
          aria-label="Color Lock"
          classNames={{
            trigger: cn('bg-default-200 w-24', {
              'data-[hover=true]:bg-default-400': hasOverride,
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
