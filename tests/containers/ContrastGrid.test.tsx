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

  describe('Behavior', () => {
    it('switches to WCAG 2 and swaps threshold list', async () => {
      await openGrid();

      fireEvent.click(screen.getByRole('button', { name: 'WCAG 2' }));

      const sidebar = screen.getByTestId('ContrastGrid-Sidebar');

      expect(within(sidebar).getByText('Contrast Ratio')).toBeInTheDocument();
      expect(within(sidebar).getByRole('button', { name: 'AA 4.5+' })).toBeInTheDocument();
      expect(within(sidebar).queryByRole('button', { name: /15\+/ })).not.toBeInTheDocument();
    });

    it('renders every non-identity body cell as a pass when threshold is All', async () => {
      await openGrid();

      const sidebar = screen.getByTestId('ContrastGrid-Sidebar');

      fireEvent.click(within(sidebar).getByRole('button', { name: 'All' }));

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

      fireEvent.click(within(sidebar).getByRole('button', { name: 'Decorative 15+' }));
      const lowPass = within(grid)
        .getAllByTestId('ContrastGrid-Cell')
        .filter(cell => cell.dataset.state === 'pass').length;

      fireEvent.click(within(sidebar).getByRole('button', { name: 'Body pref 90+' }));
      const highPass = within(grid)
        .getAllByTestId('ContrastGrid-Cell')
        .filter(cell => cell.dataset.state === 'pass').length;

      expect(highPass).toBeLessThan(lowPass);
    });

    it('renders contrast values inside passing cells', async () => {
      await openGrid();

      // Switch to WCAG 2 so values are predictable ratios (e.g. "4.5").
      fireEvent.click(screen.getByRole('button', { name: 'WCAG 2' }));

      const sidebar = screen.getByTestId('ContrastGrid-Sidebar');

      fireEvent.click(within(sidebar).getByRole('button', { name: 'All' }));

      const grid = screen.getByTestId('ContrastGrid-Grid');
      const passing = within(grid)
        .getAllByTestId('ContrastGrid-Cell')
        .filter(cell => cell.dataset.state === 'pass');

      // Every pass cell text matches a fixed-1 number like "4.5" or "12.3".
      for (const cell of passing) {
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
