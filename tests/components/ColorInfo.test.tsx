import { convertCSS, scale } from 'colorizr';

import { mockClipboard } from '~/test-mocks';
import { fireEvent, render, screen, waitFor, within } from '~/test-utils';

import ColorInfo from '~/components/ColorInfo';

import type { ColorEntry, ScaleOptions } from '~/types';

const scrollIntoViewMock = vi.fn();

Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  configurable: true,
  value: scrollIntoViewMock,
  writable: true,
});

const colorEntry: ColorEntry = {
  id: 'c1',
  name: 'Primary',
  value: 'oklch(69.776% 0.17313 276.66)',
};

const options: ScaleOptions = { lock: 500 };

const steps = scale(colorEntry.value, options);

const stepCount = Object.keys(steps).length;

function getBarForStep(step: string): HTMLElement {
  const bar = screen
    .getAllByTestId('ColorInfo-ChromaChart-Bar')
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
      expect(within(definition).getByText('0.698')).toBeInTheDocument();
      expect(within(definition).getByText('0.173')).toBeInTheDocument();
      expect(within(definition).getByText('276.7°')).toBeInTheDocument();
    });

    it('clicking a chart bar updates selection and definition', async () => {
      await openColorInfo();

      fireEvent.click(getBarForStep('200'));

      expect(getBarForStep('200')).toHaveAttribute('aria-pressed', 'true');
      expect(getBarForStep('500')).toHaveAttribute('aria-pressed', 'false');

      const definition = screen.getByTestId('ColorInfo-Definition');

      expect(within(definition).getByText('0.901')).toBeInTheDocument();
      expect(within(definition).getByText('0.053')).toBeInTheDocument();
    });

    it('clicking a table row updates chart selection', async () => {
      await openColorInfo();

      fireEvent.click(getRowForStep('800'));

      expect(getBarForStep('800')).toHaveAttribute('aria-pressed', 'true');

      const definition = screen.getByTestId('ColorInfo-Definition');

      expect(within(definition).getByText('0.466')).toBeInTheDocument();
    });

    it('scrolls selected row into view when selection changes', async () => {
      await openColorInfo();

      scrollIntoViewMock.mockClear();
      fireEvent.click(getBarForStep('950'));

      await waitFor(() => {
        expect(scrollIntoViewMock).toHaveBeenCalledWith({
          behavior: 'smooth',
          block: 'center',
        });
      });
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
