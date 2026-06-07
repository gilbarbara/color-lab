import { act, fireEvent, render, screen, waitFor } from '~/test-utils';

import Tooltip from '~/components/Tooltip';

const content = 'Tooltip body';
// Mirrors CLOSE_DELAY in src/components/Tooltip.tsx (the hoverable grace period).
const CLOSE_DELAY = 150;

function setHoverCapable(matches: boolean) {
  vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe('Tooltip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    setHoverCapable(true);
  });

  describe('Render', () => {
    it('renders only the trigger when closed', () => {
      const { container } = render(
        <Tooltip content={content}>
          <button type="button">Trigger</button>
        </Tooltip>,
      );

      expect(screen.getByRole('button', { name: 'Trigger' })).toBeInTheDocument();
      expect(screen.queryByTestId('Tooltip')).not.toBeInTheDocument();
      expect(container).toMatchSnapshot();
    });

    it('renders the panel with role and content when controlled open', () => {
      render(
        <Tooltip content={content} isOpen>
          <button type="button">Trigger</button>
        </Tooltip>,
      );

      const panel = screen.getByTestId('Tooltip');

      expect(panel).toHaveAttribute('role', 'tooltip');
      expect(panel).toHaveTextContent(content);
    });

    it('links trigger to panel via aria-describedby when open', () => {
      render(
        <Tooltip content={content} isOpen>
          <button type="button">Trigger</button>
        </Tooltip>,
      );

      const describedBy = screen.getByRole('button').getAttribute('aria-describedby');

      expect(describedBy).toBeTruthy();
      expect(screen.getByTestId('Tooltip')).toHaveAttribute('id', describedBy);
    });

    it('renders an arrow by default and omits it when showArrow is false', () => {
      const { rerender } = render(
        <Tooltip content={content} isOpen>
          <button type="button">Trigger</button>
        </Tooltip>,
      );

      expect(screen.getByTestId('Tooltip').querySelector('.rotate-45')).toBeInTheDocument();

      rerender(
        <Tooltip content={content} isOpen showArrow={false}>
          <button type="button">Trigger</button>
        </Tooltip>,
      );

      expect(screen.queryByTestId('Tooltip')?.querySelector('.rotate-45')).not.toBeInTheDocument();
    });

    it('applies color and size classes to the panel', () => {
      render(
        <Tooltip color="danger" content={content} isOpen size="lg">
          <button type="button">Trigger</button>
        </Tooltip>,
      );

      const panel = screen.getByTestId('Tooltip');

      expect(panel).toHaveClass('bg-danger');
      expect(panel).toHaveClass('text-medium');
    });

    it('does not render the panel when isDisabled, even if isOpen', () => {
      render(
        <Tooltip content={content} isDisabled isOpen>
          <button type="button">Trigger</button>
        </Tooltip>,
      );

      expect(screen.queryByTestId('Tooltip')).not.toBeInTheDocument();
    });
  });

  describe('Behavior (uncontrolled hover/focus)', () => {
    it('opens on pointer enter and closes on pointer leave', async () => {
      render(
        <Tooltip content={content} delay={0}>
          <button type="button">Trigger</button>
        </Tooltip>,
      );

      const trigger = screen.getByRole('button');

      fireEvent.pointerEnter(trigger, { pointerType: 'mouse' });

      await expect(screen.findByText(content)).resolves.toBeInTheDocument();

      fireEvent.pointerLeave(trigger, { pointerType: 'mouse' });

      await waitFor(() => {
        expect(screen.queryByText(content)).not.toBeInTheDocument();
      });
    });

    it('waits for the delay before opening', async () => {
      render(
        <Tooltip content={content} delay={80}>
          <button type="button">Trigger</button>
        </Tooltip>,
      );

      fireEvent.pointerEnter(screen.getByRole('button'), { pointerType: 'mouse' });

      expect(screen.queryByText(content)).not.toBeInTheDocument();

      await expect(screen.findByText(content)).resolves.toBeInTheDocument();
    });

    it('ignores non-mouse pointers (touch)', async () => {
      render(
        <Tooltip content={content} delay={0}>
          <button type="button">Trigger</button>
        </Tooltip>,
      );

      fireEvent.pointerEnter(screen.getByRole('button'), { pointerType: 'touch' });

      await act(async () => {
        await new Promise(resolve => {
          setTimeout(resolve, 50);
        });
      });

      expect(screen.queryByText(content)).not.toBeInTheDocument();
    });

    it('opens on focus and closes on blur', async () => {
      render(
        <Tooltip content={content}>
          <button type="button">Trigger</button>
        </Tooltip>,
      );

      const trigger = screen.getByRole('button');

      fireEvent.focus(trigger);

      await expect(screen.findByText(content)).resolves.toBeInTheDocument();

      fireEvent.blur(trigger);

      await waitFor(() => {
        expect(screen.queryByText(content)).not.toBeInTheDocument();
      });
    });

    it('preserves the child’s own handlers (chain)', () => {
      const onPointerEnter = vi.fn();
      const onClick = vi.fn();

      render(
        <Tooltip content={content} delay={0}>
          <button onClick={onClick} onPointerEnter={onPointerEnter} type="button">
            Trigger
          </button>
        </Tooltip>,
      );

      const trigger = screen.getByRole('button');

      fireEvent.pointerEnter(trigger, { pointerType: 'mouse' });
      fireEvent.click(trigger);

      expect(onPointerEnter).toHaveBeenCalledTimes(1);
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('does not attach hover handlers when controlled', () => {
      render(
        <Tooltip content={content} delay={0} isOpen={false}>
          <button type="button">Trigger</button>
        </Tooltip>,
      );

      fireEvent.pointerEnter(screen.getByRole('button'), { pointerType: 'mouse' });

      expect(screen.queryByText(content)).not.toBeInTheDocument();
    });

    it('does not open on hover when the device is not hover-capable', async () => {
      setHoverCapable(false);

      render(
        <Tooltip content={content} delay={0}>
          <button type="button">Trigger</button>
        </Tooltip>,
      );

      fireEvent.pointerEnter(screen.getByRole('button'), { pointerType: 'mouse' });

      await act(async () => {
        await new Promise(resolve => {
          setTimeout(resolve, 50);
        });
      });

      expect(screen.queryByText(content)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility (WCAG 1.4.13)', () => {
    it('dismisses an open uncontrolled tooltip on Escape', async () => {
      render(
        <Tooltip content={content} delay={0}>
          <button type="button">Trigger</button>
        </Tooltip>,
      );

      fireEvent.pointerEnter(screen.getByRole('button'), { pointerType: 'mouse' });

      await expect(screen.findByText(content)).resolves.toBeInTheDocument();

      fireEvent.keyDown(document.body, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByText(content)).not.toBeInTheDocument();
      });
    });

    it('does not dismiss a controlled tooltip on Escape', () => {
      render(
        <Tooltip content={content} isOpen>
          <button type="button">Trigger</button>
        </Tooltip>,
      );

      expect(screen.getByText(content)).toBeInTheDocument();

      fireEvent.keyDown(document.body, { key: 'Escape' });

      expect(screen.getByText(content)).toBeInTheDocument();
    });

    it('stays open while the pointer moves from the trigger onto the panel (hoverable)', async () => {
      render(
        <Tooltip content={content} delay={0}>
          <button type="button">Trigger</button>
        </Tooltip>,
      );

      const trigger = screen.getByRole('button');

      fireEvent.pointerEnter(trigger, { pointerType: 'mouse' });

      await expect(screen.findByText(content)).resolves.toBeInTheDocument();

      // Leave the trigger then reach the panel within the grace window.
      fireEvent.pointerLeave(trigger, { pointerType: 'mouse' });
      fireEvent.pointerEnter(screen.getByTestId('Tooltip'), { pointerType: 'mouse' });

      await act(async () => {
        await new Promise(resolve => {
          setTimeout(resolve, CLOSE_DELAY + 100);
        });
      });

      expect(screen.getByText(content)).toBeInTheDocument();
    });

    it('closes after the grace period once the pointer leaves the panel', async () => {
      render(
        <Tooltip content={content} delay={0}>
          <button type="button">Trigger</button>
        </Tooltip>,
      );

      const trigger = screen.getByRole('button');

      fireEvent.pointerEnter(trigger, { pointerType: 'mouse' });

      await expect(screen.findByText(content)).resolves.toBeInTheDocument();

      const panel = screen.getByTestId('Tooltip');

      fireEvent.pointerLeave(trigger, { pointerType: 'mouse' });
      fireEvent.pointerEnter(panel, { pointerType: 'mouse' });
      fireEvent.pointerLeave(panel, { pointerType: 'mouse' });

      await waitFor(() => {
        expect(screen.queryByText(content)).not.toBeInTheDocument();
      });
    });
  });
});
