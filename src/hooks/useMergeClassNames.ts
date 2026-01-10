import { useMemo } from 'react';
import { cn, type SlotsToClasses } from '@heroui/react';

/**
 * Merges default and custom classNames objects for UI components
 */
export default function useMergeClassNames<S extends string>(
  defaultClassNames: SlotsToClasses<S>,
  customClassNames?: SlotsToClasses<S>,
): SlotsToClasses<S> {
  return useMemo<SlotsToClasses<S>>(() => {
    if (!customClassNames) {
      return defaultClassNames;
    }

    const result = { ...defaultClassNames };

    (Object.keys(customClassNames) as Array<keyof SlotsToClasses<S>>).forEach(key => {
      const customValue = customClassNames[key];

      if (customValue !== undefined) {
        result[key] = cn(
          defaultClassNames[key],
          customValue,
        ) as SlotsToClasses<S>[keyof SlotsToClasses<S>];
      }
    });

    return result;
  }, [defaultClassNames, customClassNames]);
}
