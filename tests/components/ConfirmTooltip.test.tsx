import { act, fireEvent, render, screen } from '~/test-utils';

import Button from '~/components/Button';
import ConfirmTooltip from '~/components/ConfirmTooltip';

const onConfirm = vi.fn();

function getTrigger() {
  return screen.getByRole('button', { name: 'Remove Primary color' });
}

// ConfirmTooltip clones its child with `onPress`, so the trigger must be a
// press-aware Button — a raw <button> would silently ignore it.
function setup(props: Partial<Parameters<typeof ConfirmTooltip>[0]> = {}) {
  return render(
    <ConfirmTooltip confirmMessage="Click again to remove" onConfirm={onConfirm} {...props}>
      <Button aria-label="Remove Primary color" isIconOnly />
    </ConfirmTooltip>,
  );
}

describe('ConfirmTooltip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Render', () => {
    it('renders only the trigger at rest', () => {
      setup();

      expect(getTrigger()).toBeInTheDocument();
      expect(screen.queryByTestId('Tooltip')).not.toBeInTheDocument();
    });

    // The tooltip is controlled by `needsConfirm`, so hover can never open it.
    it('stays closed on hover', () => {
      setup();

      fireEvent.pointerEnter(getTrigger(), { pointerType: 'mouse' });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.queryByTestId('Tooltip')).not.toBeInTheDocument();
    });
  });

  describe('Behavior', () => {
    it('shows the confirm message on the first click without confirming', () => {
      setup();

      fireEvent.click(getTrigger());

      expect(screen.getByTestId('Tooltip')).toHaveTextContent('Click again to remove');
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('confirms on the second click', () => {
      setup();

      fireEvent.click(getTrigger());
      fireEvent.click(getTrigger());

      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(screen.queryByTestId('Tooltip')).not.toBeInTheDocument();
    });

    it('resets after the timeout, so a late click re-arms instead of confirming', () => {
      setup({ timeout: 2000 });

      fireEvent.click(getTrigger());

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.queryByTestId('Tooltip')).not.toBeInTheDocument();

      fireEvent.click(getTrigger());

      expect(onConfirm).not.toHaveBeenCalled();
      expect(screen.getByTestId('Tooltip')).toHaveTextContent('Click again to remove');
    });

    it('does nothing when disabled', () => {
      setup({ isDisabled: true });

      fireEvent.click(getTrigger());
      fireEvent.click(getTrigger());

      expect(onConfirm).not.toHaveBeenCalled();
      expect(screen.queryByTestId('Tooltip')).not.toBeInTheDocument();
    });
  });
});
