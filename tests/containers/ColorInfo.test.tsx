import { convertCSS, scale } from 'colorizr';

import { VIOLET } from '~/test-fixtures';
import { mockClipboard } from '~/test-mocks';
import { fireEvent, render, screen, waitFor, within } from '~/test-utils';
import { trackEvent } from '~/utils/analytics';
import { formatOklch, toOklch } from '~/utils/color';

import ColorInfo from '~/containers/ColorInfo';

import type { ColorEntry, ScaleOptions } from '~/types';

vi.mock('~/utils/analytics');

const scrollIntoViewMock = vi.fn();

Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  configurable: true,
  value: scrollIntoViewMock,
  writable: true,
});

const colorEntry: ColorEntry = {
  id: 'c1',
  name: 'Primary',
  value: toOklch(VIOLET),
};

const options: ScaleOptions = { lock: 500 };

const steps = scale(colorEntry.value, options);

const stepCount = Object.keys(steps).length;

function getBarForStep(step: string): HTMLElement {
  const bar = screen
    .getAllByTestId('ColorInfo-ChromaDistributionChart-Bar')
    .find(el => el.getAttribute('aria-label')?.startsWith(`Step ${step},`));

  if (!bar) {
    throw new Error(`Bar for step ${step} not found`);
  }

  return bar;
}

function getRowForStep(step: string): HTMLElement {
  const row = screen
    .getAllByTestId('ColorInfo-Row')
    .find(el => el.getAttribute('data-step') === step);

  if (!row) {
    throw new Error(`Row for step ${step} not found`);
  }

  return row;
}

async function openColorInfo() {
  render(<ColorInfo colorEntry={colorEntry} options={options} steps={steps} />);

  fireEvent.click(screen.getByRole('button', { name: /color info/i }));

  await waitFor(() => {
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
}

describe('ColorInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Render', () => {
    it('renders trigger only when closed', () => {
      render(<ColorInfo colorEntry={colorEntry} options={options} steps={steps} />);

      expect(screen.getByRole('button', { name: /color info/i })).toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders correctly', async () => {
      await openColorInfo();

      expect(screen.getByTestId('ColorInfo')).toMatchSnapshot();
    });
  });

  describe('Behavior', () => {
    it('selects middle step by default', async () => {
      await openColorInfo();

      expect(getBarForStep('500')).toHaveAttribute('aria-pressed', 'true');

      const definition = screen.getByTestId('ColorInfo-Definition');

      expect(within(definition).getByText('Lightness')).toBeInTheDocument();
      expect(within(definition).getByText('0.702')).toBeInTheDocument();
      expect(within(definition).getByText('0.163')).toBeInTheDocument();
      expect(within(definition).getByText('270°')).toBeInTheDocument();
    });

    it('clicking a chart bar updates selection and definition', async () => {
      await openColorInfo();

      fireEvent.click(getBarForStep('200'));

      expect(getBarForStep('200')).toHaveAttribute('aria-pressed', 'true');
      expect(getBarForStep('500')).toHaveAttribute('aria-pressed', 'false');

      const definition = screen.getByTestId('ColorInfo-Definition');

      expect(within(definition).getByText('0.902')).toBeInTheDocument();
      expect(within(definition).getByText('0.052')).toBeInTheDocument();
    });

    it('clicking a table row updates chart selection', async () => {
      await openColorInfo();

      fireEvent.click(getRowForStep('800'));

      expect(getBarForStep('800')).toHaveAttribute('aria-pressed', 'true');

      const definition = screen.getByTestId('ColorInfo-Definition');

      expect(within(definition).getByText('0.469')).toBeInTheDocument();
    });

    it('exposes each row step as a pressable button', async () => {
      await openColorInfo();

      // The row itself can't be the control (its cells hold their own buttons), so the step cell
      // carries a real button — otherwise a step is unselectable by keyboard and silent to AT.
      const step = screen.getByRole('button', { name: 'Step 800' });

      expect(step).toHaveAttribute('aria-pressed', 'false');

      fireEvent.click(step);

      expect(screen.getByRole('button', { name: 'Step 800' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(getBarForStep('800')).toHaveAttribute('aria-pressed', 'true');
    });

    it('fires a single select event when the step button is clicked', async () => {
      await openColorInfo();

      vi.mocked(trackEvent).mockClear();
      fireEvent.click(screen.getByRole('button', { name: 'Step 800' }));

      // The button's click must not also bubble into the row's own handler.
      expect(trackEvent).toHaveBeenCalledExactlyOnceWith('info:select_step', {
        source: 'table',
        step: '800',
      });
    });

    it('scrolls selected row into view when the table is its own scroller', async () => {
      await openColorInfo();

      // Simulate the lg layout where the table container scrolls internally.
      const container = screen.getByTestId('ColorInfo-Table');

      Object.defineProperty(container, 'scrollHeight', { configurable: true, value: 1000 });
      Object.defineProperty(container, 'clientHeight', { configurable: true, value: 200 });

      scrollIntoViewMock.mockClear();
      fireEvent.click(getBarForStep('950'));

      await waitFor(() => {
        expect(scrollIntoViewMock).toHaveBeenCalledWith({
          behavior: 'smooth',
          block: 'center',
        });
      });
    });

    it('does not scroll when the table is not its own scroller', async () => {
      await openColorInfo();

      // Small-screen stacked layout: the ModalBody scrolls, not the table. jsdom
      // reports scrollHeight === clientHeight (0), so the guard must skip scrolling.
      scrollIntoViewMock.mockClear();
      fireEvent.click(getBarForStep('950'));

      expect(getBarForStep('950')).toHaveAttribute('aria-pressed', 'true');
      expect(scrollIntoViewMock).not.toHaveBeenCalled();
    });

    it('copies OKLCH for the row', async () => {
      await openColorInfo();

      const row = getRowForStep('500');
      const copyButtons = within(row).getAllByRole('button', { name: /copy oklch/i });

      fireEvent.click(copyButtons[0]);

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith(steps[500]);
      });
    });

    it('copies hex for the row', async () => {
      await openColorInfo();

      const row = getRowForStep('500');
      const copyButtons = within(row).getAllByRole('button', { name: /copy hex/i });

      fireEvent.click(copyButtons[0]);

      const expectedHex = convertCSS(steps[500], 'hex');

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith(expectedHex);
      });
    });

    it('does not move the selected step when copying from another row', async () => {
      await openColorInfo();

      fireEvent.click(screen.getByRole('button', { name: 'Step 800' }));
      expect(screen.getByRole('button', { name: 'Step 800' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );

      vi.mocked(trackEvent).mockClear();

      const row = getRowForStep('50');

      fireEvent.click(within(row).getAllByRole('button', { name: /copy oklch/i })[0]);

      // The copy button's click must not bubble into the row's own select handler — copying is not
      // selecting, and a hijacked selection also fires a bogus `info:select_step`.
      // The row copies its *displayed* value, so compare against the same formatter it renders with.
      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith(formatOklch(steps[50]));
      });

      expect(screen.getByRole('button', { name: 'Step 800' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(screen.getByRole('button', { name: 'Step 50' })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
      expect(trackEvent).not.toHaveBeenCalledWith('info:select_step', expect.anything());
    });

    it('renders lock icon only on locked step', async () => {
      await openColorInfo();

      const lockIcons = screen.getAllByTestId('ColorInfo-Row-Lock');

      expect(lockIcons).toHaveLength(1);
      expect(getRowForStep('500')).toContainElement(lockIcons[0]);
    });

    it('renders gamut warning on every row', async () => {
      await openColorInfo();

      const table = screen.getByTestId('ColorInfo-Table');
      const warnings = within(table).getAllByRole('button', { name: /more information/i });

      expect(warnings).toHaveLength(stepCount);
    });

    it('closes on Escape', async () => {
      await openColorInfo();

      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });
});
