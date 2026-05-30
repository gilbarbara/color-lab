import { act, renderHook, waitFor } from '@testing-library/react';

import useTheme from '~/hooks/useTheme';
import { mockSetTheme, setMockTheme } from '~/test-mocks';

describe('hooks/useTheme', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reports mounted after the initial effect runs', async () => {
    const { result } = renderHook(() => useTheme());

    await waitFor(() => {
      expect(result.current.isMounted).toBe(true);
    });
  });

  it('isDarkMode is false while light is resolved', async () => {
    setMockTheme('light');

    const { result } = renderHook(() => useTheme());

    await waitFor(() => {
      expect(result.current.isMounted).toBe(true);
    });
    expect(result.current.isDarkMode).toBe(false);
  });

  it('isDarkMode is true once dark is resolved and mounted', async () => {
    setMockTheme('dark');

    const { result } = renderHook(() => useTheme());

    await waitFor(() => {
      expect(result.current.isDarkMode).toBe(true);
    });
  });

  it('toggleDarkMode switches from light to dark', () => {
    setMockTheme('light');

    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.toggleDarkMode();
    });

    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('toggleDarkMode switches from dark to light', () => {
    setMockTheme('dark');

    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.toggleDarkMode();
    });

    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });
});
