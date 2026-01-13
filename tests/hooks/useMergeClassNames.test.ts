import { renderHook } from '@testing-library/react';

import useMergeClassNames from '~/hooks/useMergeClassNames';

type TestSlots = 'base' | 'label' | 'input';

describe('hooks/useMergeClassNames', () => {
  it('returns defaultClassNames when customClassNames is undefined', () => {
    const defaultClassNames = {
      base: 'bg-white p-4',
      label: 'text-sm font-bold',
      input: 'border rounded',
    };

    const { result } = renderHook(() => useMergeClassNames<TestSlots>(defaultClassNames));

    expect(result.current).toBe(defaultClassNames);
  });

  it('merges classNames when both are provided', () => {
    const defaultClassNames = {
      base: 'bg-white p-4',
      label: 'text-sm font-bold',
    };
    const customClassNames = {
      base: 'bg-black',
      label: 'text-lg',
    };

    const { result } = renderHook(() =>
      useMergeClassNames<TestSlots>(defaultClassNames, customClassNames),
    );

    expect(result.current.base).toBe('p-4 bg-black');
    expect(result.current.label).toBe('font-bold text-lg');
  });

  it('only processes keys present in customClassNames', () => {
    const defaultClassNames = {
      base: 'bg-white p-4',
      label: 'text-sm font-bold',
      input: 'border rounded',
    };
    const customClassNames = {
      base: 'bg-black',
    };

    const { result } = renderHook(() =>
      useMergeClassNames<TestSlots>(defaultClassNames, customClassNames),
    );

    expect(result.current.base).toBe('p-4 bg-black');
    expect(result.current.label).toBe('text-sm font-bold');
    expect(result.current.input).toBe('border rounded');
  });

  it('ignores undefined values in customClassNames', () => {
    const defaultClassNames = {
      base: 'bg-white p-4',
      label: 'text-sm font-bold',
    };
    const customClassNames = {
      base: 'bg-black',
      label: undefined,
    };

    const { result } = renderHook(() =>
      useMergeClassNames<TestSlots>(defaultClassNames, customClassNames),
    );

    expect(result.current.base).toBe('p-4 bg-black');
    expect(result.current.label).toBe('text-sm font-bold');
  });

  it('returns same reference when inputs do not change', () => {
    const defaultClassNames = {
      base: 'bg-white',
    };
    const customClassNames = {
      base: 'p-4',
    };

    const { rerender, result } = renderHook(() =>
      useMergeClassNames<TestSlots>(defaultClassNames, customClassNames),
    );

    const firstResult = result.current;

    rerender();

    expect(result.current).toBe(firstResult);
  });
});
