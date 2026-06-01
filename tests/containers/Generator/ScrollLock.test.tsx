import { act } from '@testing-library/react';

import { initialState, useAppStore } from '~/stores/appStore';
import { render } from '~/test-utils';

import ScrollLock from '~/containers/Generator/ScrollLock';

const breakpointMock = vi.hoisted(() => ({
  max: vi.fn<(key: string) => boolean>(),
}));

vi.mock('@gilbarbara/hooks', async () => {
  const actual = await vi.importActual<typeof import('@gilbarbara/hooks')>('@gilbarbara/hooks');

  return {
    ...actual,
    useBreakpoint: () => ({ max: breakpointMock.max, min: vi.fn() }),
  };
});

function setDesktop() {
  breakpointMock.max.mockImplementation(() => false);
}

function setMobile() {
  breakpointMock.max.mockImplementation((key: string) => key === 'md');
}

function setScrollY(value: number) {
  Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value });
}

describe('ScrollLock', () => {
  let scrollToSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    breakpointMock.max.mockReset();
    useAppStore.setState(initialState);

    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';

    setScrollY(0);
    scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  });

  it('pins the body when mobile and the bottom bar is open', () => {
    setMobile();
    useAppStore.setState({ showBottomBar: true });

    render(<ScrollLock />);

    expect(document.body.style.position).toBe('fixed');
    expect(document.body.style.top).toBe('0px');
    expect(document.body.style.left).toBe('0px');
    expect(document.body.style.right).toBe('0px');
  });

  it('pins the body at the negated scroll offset', () => {
    setMobile();
    useAppStore.setState({ showBottomBar: true });
    setScrollY(100);

    render(<ScrollLock />);

    expect(document.body.style.top).toBe('-100px');
  });

  it('does not lock on desktop even when the bottom bar is open', () => {
    setDesktop();
    useAppStore.setState({ showBottomBar: true });

    render(<ScrollLock />);

    expect(document.body.style.position).toBe('');
  });

  it('does not lock on mobile when the bottom bar is closed', () => {
    setMobile();
    useAppStore.setState({ showBottomBar: false });

    render(<ScrollLock />);

    expect(document.body.style.position).toBe('');
  });

  it('restores the body and scroll position on unmount', () => {
    setMobile();
    useAppStore.setState({ showBottomBar: true });
    setScrollY(100);

    const { unmount } = render(<ScrollLock />);

    expect(document.body.style.position).toBe('fixed');

    unmount();

    expect(document.body.style.position).toBe('');
    expect(document.body.style.top).toBe('');
    expect(document.body.style.left).toBe('');
    expect(document.body.style.right).toBe('');
    expect(scrollToSpy).toHaveBeenCalledWith(0, 100);
  });

  it('unlocks when the bottom bar closes', () => {
    setMobile();
    useAppStore.setState({ showBottomBar: true });
    setScrollY(100);

    render(<ScrollLock />);

    expect(document.body.style.position).toBe('fixed');

    act(() => {
      useAppStore.setState({ showBottomBar: false });
    });

    expect(document.body.style.position).toBe('');
    expect(scrollToSpy).toHaveBeenCalledWith(0, 100);
  });
});
