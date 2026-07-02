import { initialState, useAppStore } from '~/stores/appStore';
import { fireEvent, render, screen, waitFor } from '~/test-utils';

import ExportDrawer, { type ExportRenderProps } from '~/containers/ExportDrawer';

const mockTrackEvent = vi.fn();

vi.mock('~/utils/analytics', () => ({
  trackEvent: (...arguments_: unknown[]) => mockTrackEvent(...arguments_),
}));

function Harness() {
  return (
    <ExportDrawer
      title="Export"
      trigger={onOpen => (
        <button onClick={onOpen} type="button">
          Open
        </button>
      )}
    >
      {(props: ExportRenderProps) => (
        <div data-testid="body">
          {props.formatType}:{props.colorFormat}
        </div>
      )}
    </ExportDrawer>
  );
}

async function openDrawer() {
  render(<Harness />);
  fireEvent.click(screen.getByRole('button', { name: 'Open' }));

  await waitFor(() => {
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
}

describe('ExportDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState(initialState);
  });

  it('resets the color format to hex when switching to SVG', async () => {
    useAppStore.setState({ exportFormatType: 'css', exportColorFormat: 'oklch' });

    await openDrawer();

    fireEvent.click(screen.getByRole('tab', { name: 'SVG / Figma' }));

    await waitFor(() => {
      expect(useAppStore.getState().exportFormatType).toBe('svg');
    });
    expect(useAppStore.getState().exportColorFormat).toBe('hex');
    expect(mockTrackEvent).toHaveBeenCalledWith('export:change_format', { value: 'svg' });
  });

  it('hides the color-format tabs for SVG', async () => {
    useAppStore.setState({ exportFormatType: 'svg', exportColorFormat: 'hex' });

    await openDrawer();

    expect(screen.queryByRole('tab', { name: 'OKLCH' })).not.toBeInTheDocument();
  });

  it('keeps the current color format when the new type still supports it', async () => {
    useAppStore.setState({ exportFormatType: 'tailwind4', exportColorFormat: 'oklch' });

    await openDrawer();

    fireEvent.click(screen.getByRole('tab', { name: 'CSS' }));

    await waitFor(() => {
      expect(useAppStore.getState().exportFormatType).toBe('css');
    });
    expect(useAppStore.getState().exportColorFormat).toBe('oklch');
  });

  it('resets rgb-channels to the first available format when unsupported', async () => {
    useAppStore.setState({ exportFormatType: 'css', exportColorFormat: 'rgb-channels' });

    await openDrawer();

    fireEvent.click(screen.getByRole('tab', { name: 'Tailwind 4' }));

    await waitFor(() => {
      expect(useAppStore.getState().exportFormatType).toBe('tailwind4');
    });
    expect(useAppStore.getState().exportColorFormat).toBe('oklch');
  });

  it('updates the color format and tracks the change', async () => {
    useAppStore.setState({ exportFormatType: 'css', exportColorFormat: 'oklch' });

    await openDrawer();

    fireEvent.click(screen.getByRole('tab', { name: 'Hex' }));

    await waitFor(() => {
      expect(useAppStore.getState().exportColorFormat).toBe('hex');
    });
    expect(mockTrackEvent).toHaveBeenCalledWith('export:change_color_format', { value: 'hex' });
  });
});
