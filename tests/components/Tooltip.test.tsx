import { act, fireEvent, render, screen, waitFor } from '~/test-utils';

import Tooltip from '~/components/Tooltip';

const content = 'Tooltip body';
// Mirrors CLOSE_DELAY in src/components/Tooltip.tsx (the hoverable grace period).
const CLOSE_DELAY = 150;

// jsdom doesn't model `:focus-visible` accurately and may throw on the selector.
// Globally short-circuit `:focus-visible` matches to a controllable flag; tests
// that need the keyboard-focus path flip it via stubFocusVisible.
const originalMatches = Element.prototype.matches;
let focusVisibleResult = false;
// Scopes the match to a single element, so a test can assert that only the focused
// element is :focus-visible — never an ancestor. Null means "any element".
let focusVisibleElement: Element | null = null;

Element.prototype.matches = function matches(this: Element, selector: string) {
  if (selector === ':focus-visible') {
    return focusVisibleResult && (!focusVisibleElement || this === focusVisibleElement);
  }

  return originalMatches.call(this, selector);
} as typeof originalMatches;

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

function stubFocusVisible(value: boolean, element: Element | null = null) {
  focusVisibleResult = value;
  focusVisibleElement = element;
}

describe('Tooltip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    setHoverCapable(true);
    stubFocusVisible(false);
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

    // A tooltip that restates the trigger's name must not also describe it — screen
    // readers would announce the same words twice (name, then description).
    describe('redundant content', () => {
      it('does not describe when the content restates the aria-label', () => {
        render(
          <Tooltip content="View Charts" isOpen>
            <button aria-label="View Charts for Primary" type="button" />
          </Tooltip>,
        );

        expect(screen.getByRole('button')).not.toHaveAttribute('aria-describedby');
        expect(screen.getByTestId('Tooltip')).toHaveAttribute('aria-hidden', 'true');
      });

      it('does not describe when the content restates the visible text', () => {
        render(
          <Tooltip content="Trigger" isOpen>
            <button type="button">Trigger</button>
          </Tooltip>,
        );

        expect(screen.getByRole('button')).not.toHaveAttribute('aria-describedby');
      });

      it('ignores case and whitespace when comparing', () => {
        render(
          <Tooltip content="  export   SCALE  " isOpen>
            <button aria-label="Export scale for Primary" type="button" />
          </Tooltip>,
        );

        expect(screen.getByRole('button')).not.toHaveAttribute('aria-describedby');
      });

      it('sees through cosmetic markup around the content', () => {
        render(
          <Tooltip content={<span className="font-bold">View Charts</span>} isOpen>
            <button aria-label="View Charts for Primary" type="button" />
          </Tooltip>,
        );

        expect(screen.getByRole('button')).not.toHaveAttribute('aria-describedby');
      });

      it('still describes when the content adds information', () => {
        render(
          <Tooltip
            content={
              <>
                <p>View Charts</p>
                <p>Shift-click to toggle all</p>
              </>
            }
            isOpen
          >
            <button aria-label="View Charts for Primary" type="button" />
          </Tooltip>,
        );

        const panel = screen.getByTestId('Tooltip');

        expect(screen.getByRole('button')).toHaveAttribute('aria-describedby', panel.id);
        expect(panel).not.toHaveAttribute('aria-hidden');
      });

      it('still describes content unrelated to the name', () => {
        render(
          <Tooltip content="#ff0044" isOpen>
            <button aria-label="Copy Primary 500" type="button" />
          </Tooltip>,
        );

        expect(screen.getByRole('button')).toHaveAttribute('aria-describedby');
      });

      // HeroUI's Dropdown/Popover triggers drop a cloned ref (heroui#1265), so call sites
      // wrap them in a positioning div. The name still has to come from the button inside.
      it('reads the name through a wrapper element', () => {
        render(
          <Tooltip content="Color mode" isOpen>
            <div className="max-w-fit">
              <button aria-label="Color mode for Primary: OKLCH" type="button">
                OKLCH
              </button>
            </div>
          </Tooltip>,
        );

        expect(screen.getByRole('button')).not.toHaveAttribute('aria-describedby');
        expect(screen.getByRole('button').parentElement).not.toHaveAttribute('aria-describedby');
        expect(screen.getByTestId('Tooltip')).toHaveAttribute('aria-hidden', 'true');
      });
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

    it('opens on keyboard focus (focus-visible) and closes on blur', async () => {
      stubFocusVisible(true);

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

    it('opens on keyboard focus when the trigger sits inside a wrapper', async () => {
      // Regression: with a wrapper child (heroui#1265) the focus handler lands on the
      // wrapper, which is never :focus-visible — only the button inside it is.
      render(
        <Tooltip content={content}>
          <div className="max-w-fit">
            <button type="button">Trigger</button>
          </div>
        </Tooltip>,
      );

      const trigger = screen.getByRole('button');

      stubFocusVisible(true, trigger);
      fireEvent.focus(trigger);

      await expect(screen.findByText(content)).resolves.toBeInTheDocument();
    });

    it('stays closed on non-focus-visible focus (mouse/programmatic restore)', async () => {
      // Regression: an overlay (e.g. a Select) restoring focus to the trigger on
      // close fires onFocus without :focus-visible — the tooltip must not reopen.
      stubFocusVisible(false);

      render(
        <Tooltip content={content}>
          <button type="button">Trigger</button>
        </Tooltip>,
      );

      fireEvent.focus(screen.getByRole('button'));

      await act(async () => {
        await new Promise(resolve => {
          setTimeout(resolve, 50);
        });
      });

      expect(screen.queryByText(content)).not.toBeInTheDocument();
    });

    it('closes on click (activation)', async () => {
      render(
        <Tooltip content={content} delay={0}>
          <button type="button">Trigger</button>
        </Tooltip>,
      );

      const trigger = screen.getByRole('button');

      fireEvent.pointerEnter(trigger, { pointerType: 'mouse' });

      await expect(screen.findByText(content)).resolves.toBeInTheDocument();

      fireEvent.click(trigger);

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
