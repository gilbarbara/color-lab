import { fireEvent, render, screen } from '~/test-utils';

import CollapsibleMenu from '~/components/CollapsibleMenu';

function setup() {
  return render(
    <CollapsibleMenu label="More color tools">
      <button type="button">Charts</button>
      <button type="button">Info</button>
      <button type="button">Contrast</button>
    </CollapsibleMenu>,
  );
}

describe('CollapsibleMenu', () => {
  describe('Render', () => {
    it('renders the trigger collapsed with the children always mounted', () => {
      const { container } = setup();

      const trigger = screen.getByRole('button', { name: 'More color tools' });

      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).toHaveClass('xsm:hidden');

      // Children stay in the DOM regardless of toggle state (CSS hides them).
      expect(screen.getByRole('button', { name: 'Charts' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Info' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Contrast' })).toBeInTheDocument();

      expect(container).toMatchSnapshot();
    });

    it('links the trigger to the panel via aria-controls', () => {
      setup();

      const trigger = screen.getByRole('button', { name: 'More color tools' });
      const panel = screen.getByRole('group');

      expect(panel).toHaveAttribute('data-open', 'false');
      expect(trigger.getAttribute('aria-controls')).toBe(panel.id);
    });
  });

  describe('Behavior', () => {
    it('opens and closes on trigger click', () => {
      setup();

      const trigger = screen.getByRole('button', { name: 'More color tools' });

      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('group')).toHaveAttribute('data-open', 'true');

      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(screen.getByRole('group')).toHaveAttribute('data-open', 'false');
    });

    it('closes on Escape', () => {
      setup();

      const trigger = screen.getByRole('button', { name: 'More color tools' });

      fireEvent.click(trigger);
      expect(screen.getByRole('group')).toHaveAttribute('data-open', 'true');

      fireEvent.keyDown(document.body, { key: 'Escape' });
      expect(screen.getByRole('group')).toHaveAttribute('data-open', 'false');
    });

    it('closes on outside pointer down', () => {
      setup();

      const trigger = screen.getByRole('button', { name: 'More color tools' });

      fireEvent.click(trigger);
      expect(screen.getByRole('group')).toHaveAttribute('data-open', 'true');

      fireEvent.pointerDown(document.body);
      expect(screen.getByRole('group')).toHaveAttribute('data-open', 'false');

      // A pointer down inside the menu keeps it open.
      fireEvent.click(trigger);
      fireEvent.pointerDown(screen.getByRole('button', { name: 'Charts' }));
      expect(screen.getByRole('group')).toHaveAttribute('data-open', 'true');
    });
  });
});
