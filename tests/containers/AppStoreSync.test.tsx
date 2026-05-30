import { act } from '@testing-library/react';

import { initialState, useAppStore } from '~/stores/appStore';
import { render } from '~/test-utils';

import AppStoreSync from '~/containers/AppStoreSync';

const DATA_ATTRIBUTES = [
  'data-gamut',
  'data-sidebar',
  'data-preview',
  'data-color-options',
  'data-palette-options',
];

describe('AppStoreSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState(initialState);

    for (const attribute of DATA_ATTRIBUTES) {
      document.documentElement.removeAttribute(attribute);
    }
  });

  it('rehydrates the persisted store on mount', () => {
    const rehydrate = vi.spyOn(useAppStore.persist, 'rehydrate').mockResolvedValue(undefined);

    render(<AppStoreSync />);

    expect(rehydrate).toHaveBeenCalledTimes(1);
  });

  it('mirrors gamut changes onto the html element', () => {
    render(<AppStoreSync />);

    act(() => {
      useAppStore.getState().setGamut('srgb');
    });

    expect(document.documentElement.getAttribute('data-gamut')).toBe('srgb');
  });

  it('mirrors sidebar visibility as open/closed', () => {
    render(<AppStoreSync />);

    act(() => {
      useAppStore.getState().toggleSidebar(false);
    });
    expect(document.documentElement.getAttribute('data-sidebar')).toBe('closed');

    act(() => {
      useAppStore.getState().toggleSidebar(true);
    });
    expect(document.documentElement.getAttribute('data-sidebar')).toBe('open');
  });

  it('mirrors preview visibility', () => {
    render(<AppStoreSync />);

    act(() => {
      useAppStore.getState().togglePreview(false);
    });

    expect(document.documentElement.getAttribute('data-preview')).toBe('closed');
  });

  it('mirrors the color and palette option panels', () => {
    render(<AppStoreSync />);

    act(() => {
      useAppStore.getState().toggleColorOptionsPanel();
    });
    expect(document.documentElement.getAttribute('data-color-options')).toBe('open');

    act(() => {
      useAppStore.getState().togglePaletteOptionsPanel();
    });
    expect(document.documentElement.getAttribute('data-palette-options')).toBe('open');
  });

  it('stops syncing after unmount', () => {
    const { unmount } = render(<AppStoreSync />);

    act(() => {
      useAppStore.getState().setGamut('srgb');
    });
    expect(document.documentElement.getAttribute('data-gamut')).toBe('srgb');

    unmount();

    act(() => {
      useAppStore.getState().setGamut('p3');
    });
    expect(document.documentElement.getAttribute('data-gamut')).toBe('srgb');
  });
});
