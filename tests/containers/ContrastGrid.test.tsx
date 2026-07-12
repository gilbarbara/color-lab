import { scale } from 'colorizr';

import { BLUE } from '~/test-fixtures';
import { fireEvent, render, screen, waitFor, within } from '~/test-utils';
import { toOklch } from '~/utils/color';

import ContrastGrid from '~/containers/ContrastGrid';

import type { ColorEntry } from '~/types';

const colorEntry: ColorEntry = {
  id: 'c1',
  name: 'Primary',
  value: toOklch(BLUE),
};

const steps = scale(colorEntry.value);

const stepCount = Object.keys(steps).length;

async function openGrid() {
  render(<ContrastGrid colorEntry={colorEntry} steps={steps} />);

  fireEvent.click(screen.getByRole('button', { name: /contrast/i }));

  await waitFor(() => {
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
}

describe('ContrastGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Render', () => {
    it('renders trigger only when closed', () => {
      render(<ContrastGrid colorEntry={colorEntry} steps={steps} />);

      expect(screen.getByRole('button', { name: /contrast/i })).toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('render correctly', async () => {
      await openGrid();

      expect(screen.getByTestId('ContrastGrid-Header')).toMatchSnapshot('header');
      expect(screen.getByTestId('ContrastGrid-Sidebar')).toMatchSnapshot('sidebar');
      expect(screen.getByTestId('ContrastGrid-Grid')).toMatchSnapshot('grid');
    });
  });

  describe('Accessibility', () => {
    it('exposes the guideline and threshold lists as radiogroups', async () => {
      await openGrid();

      const sidebar = screen.getByTestId('ContrastGrid-Sidebar');

      expect(within(sidebar).getByRole('radiogroup', { name: 'Guidelines' })).toBeInTheDocument();
      expect(within(sidebar).getByRole('radiogroup', { name: 'APCA Lc' })).toBeInTheDocument();

      // The selected option must be announced, not just tinted.
      expect(within(sidebar).getByRole('radio', { name: 'WCAG 3 · APCA' })).toBeChecked();
      expect(within(sidebar).getByRole('radio', { name: 'WCAG 2' })).not.toBeChecked();
      expect(within(sidebar).getByRole('radio', { name: 'Large min 45+' })).toBeChecked();
    });

    it('moves aria-checked when a threshold is selected', async () => {
      await openGrid();

      const sidebar = screen.getByTestId('ContrastGrid-Sidebar');

      fireEvent.click(within(sidebar).getByRole('radio', { name: 'Body pref 90+' }));

      expect(within(sidebar).getByRole('radio', { name: 'Body pref 90+' })).toBeChecked();
      expect(within(sidebar).getByRole('radio', { name: 'Large min 45+' })).not.toBeChecked();
    });

    it('exposes the grid with row and cell semantics', async () => {
      await openGrid();

      // `table`, not `grid`: no cell is focusable, so the grid widget's two-dimensional navigation
      // contract can't be honored.
      const grid = screen.getByRole('table', { name: /Contrast grid for Primary/ });

      // One header row + one row per step.
      expect(within(grid).getAllByRole('row')).toHaveLength(stepCount + 1);
      expect(within(grid).getAllByRole('rowheader')).toHaveLength(stepCount);
      expect(within(grid).getAllByRole('cell')).toHaveLength(stepCount * stepCount);
    });

    it('names each cell with its pair, score and outcome', async () => {
      await openGrid();

      const grid = screen.getByRole('table', { name: /Contrast grid for Primary/ });
      const cells = within(grid).getAllByRole('cell');

      const identity = cells.filter(cell => cell.dataset.state === 'identity');
      const scored = cells.filter(cell => cell.dataset.state !== 'identity');

      for (const cell of identity) {
        expect(cell).toHaveAccessibleName(/^Text \d+ on background \d+: same color$/);
      }

      for (const cell of scored) {
        expect(cell).toHaveAccessibleName(/^Text \d+ on background \d+: Lc \d+, (pass|fail)$/);
      }
    });

    it('drops the outcome from cell names when the threshold is All', async () => {
      await openGrid();

      const sidebar = screen.getByTestId('ContrastGrid-Sidebar');

      fireEvent.click(within(sidebar).getByRole('radio', { name: 'All' }));

      const grid = screen.getByRole('table', { name: /Contrast grid for Primary/ });
      const scored = within(grid)
        .getAllByRole('cell')
        .filter(cell => cell.dataset.state !== 'identity');

      // `All` grades nothing, so no cell may claim a verdict — an Lc 0 pair announced as "pass"
      // would be a conformance claim the UI never makes.
      for (const cell of scored) {
        expect(cell).toHaveAccessibleName(/^Text \d+ on background \d+: Lc \d+$/);
      }
    });
  });

  describe('Behavior', () => {
    it('switches to WCAG 2 and swaps threshold list', async () => {
      await openGrid();

      fireEvent.click(screen.getByRole('radio', { name: 'WCAG 2' }));

      const sidebar = screen.getByTestId('ContrastGrid-Sidebar');

      expect(within(sidebar).getByText('Contrast Ratio')).toBeInTheDocument();
      expect(within(sidebar).getByRole('radio', { name: 'AA 4.5+' })).toBeInTheDocument();
      expect(within(sidebar).queryByRole('radio', { name: /15\+/ })).not.toBeInTheDocument();
    });

    it('renders every non-identity body cell as a pass when threshold is All', async () => {
      await openGrid();

      const sidebar = screen.getByTestId('ContrastGrid-Sidebar');

      fireEvent.click(within(sidebar).getByRole('radio', { name: 'All' }));

      const grid = screen.getByTestId('ContrastGrid-Grid');
      const cells = within(grid).getAllByTestId('ContrastGrid-Cell');
      const passing = cells.filter(cell => cell.dataset.state === 'pass');
      const identity = cells.filter(cell => cell.dataset.state === 'identity');

      expect(cells).toHaveLength(stepCount * stepCount);
      expect(identity).toHaveLength(stepCount);
      expect(passing).toHaveLength(stepCount * (stepCount - 1));
    });

    it('reduces pass count when threshold raised', async () => {
      await openGrid();

      const sidebar = screen.getByTestId('ContrastGrid-Sidebar');
      const grid = screen.getByTestId('ContrastGrid-Grid');

      fireEvent.click(within(sidebar).getByRole('radio', { name: 'Decorative 15+' }));
      const lowPass = within(grid)
        .getAllByTestId('ContrastGrid-Cell')
        .filter(cell => cell.dataset.state === 'pass').length;

      fireEvent.click(within(sidebar).getByRole('radio', { name: 'Body pref 90+' }));
      const highPass = within(grid)
        .getAllByTestId('ContrastGrid-Cell')
        .filter(cell => cell.dataset.state === 'pass').length;

      expect(highPass).toBeLessThan(lowPass);
    });

    it('renders contrast values inside every scored cell', async () => {
      await openGrid();

      // Switch to WCAG 2 so values are predictable ratios (e.g. "4.5").
      fireEvent.click(screen.getByRole('radio', { name: 'WCAG 2' }));

      const grid = screen.getByTestId('ContrastGrid-Grid');
      const scored = within(grid)
        .getAllByTestId('ContrastGrid-Cell')
        .filter(cell => cell.dataset.state !== 'identity');

      // Failing cells carry their score too — they used to render an empty striped div, which
      // made the failing pairs unreadable to everyone.
      expect(scored.some(cell => cell.dataset.state === 'fail')).toBe(true);

      for (const cell of scored) {
        expect(cell.textContent).toMatch(/^\d+\.\d$/);
      }
    });

    it('closes on Escape', async () => {
      await openGrid();

      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });
});
