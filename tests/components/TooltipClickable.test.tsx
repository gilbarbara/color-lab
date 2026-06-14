import { act, fireEvent, render, screen, waitFor } from '~/test-utils';

import TooltipClickable from '~/components/TooltipClickable';

const tooltipContent = 'Pins the base color to a specific step.';

const isTrackedListener = ([type]: unknown[]) =>
  type === 'keydown' || type === 'pointerdown' || type === 'focusin';

// jsdom doesn't model `:focus-visible` accurately and may throw on the
// selector. Globally short-circuit `:focus-visible` matches to a controllable
// flag; tests that need the keyboard-focus path flip it via stubFocusVisible.
const originalMatches = Element.prototype.matches;
let focusVisibleResult = false;

Element.prototype.matches = function matches(this: Element, selector: string) {
  if (selector === ':focus-visible') {
    return focusVisibleResult;
  }

  return originalMatches.call(this, selector);
} as typeof originalMatches;

function stubFocusVisible(value: boolean) {
  const previous = focusVisibleResult;

  focusVisibleResult = value;

  return () => {
    focusVisibleResult = previous;
  };
}

describe('TooltipClickable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    focusVisibleResult = false;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Render', () => {
    it('renders with default InfoIcon', () => {
      const { container } = render(<TooltipClickable content={tooltipContent} />);

      expect(container).toMatchSnapshot();
    });

    it('renders default aria-label "More information"', () => {
      render(<TooltipClickable content={tooltipContent} />);

      expect(screen.getByRole('button', { name: 'More information' })).toBeInTheDocument();
    });

    it('renders with custom aria-label overriding default', () => {
      render(<TooltipClickable aria-label="info" content={tooltipContent} />);

      expect(screen.getByRole('button', { name: 'info' })).toBeInTheDocument();
    });

    it('renders custom children', () => {
      render(
        <TooltipClickable content={tooltipContent}>
          <span data-testid="custom-trigger">!</span>
        </TooltipClickable>,
      );

      expect(screen.getByTestId('custom-trigger')).toBeInTheDocument();
    });

    it('renders aria-expanded="false" when closed', () => {
      render(<TooltipClickable content={tooltipContent} />);

      expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
    });

    it('renders aria-expanded="true" when open', async () => {
      render(<TooltipClickable content={tooltipContent} />);

      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
      });
    });
  });

  describe('Behavior', () => {
    it('toggles open and closed on click', async () => {
      render(<TooltipClickable content={tooltipContent} />);

      const button = screen.getByRole('button');

      fireEvent.click(button);

      await expect(screen.findByText(tooltipContent)).resolves.toBeInTheDocument();

      fireEvent.click(button);

      await waitFor(() => {
        expect(button).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('stops click propagation to parent', () => {
      const onParentClick = vi.fn();

      render(
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div onClick={onParentClick}>
          <TooltipClickable content={tooltipContent} />
        </div>,
      );

      fireEvent.click(screen.getByRole('button'));

      expect(onParentClick).not.toHaveBeenCalled();
    });

    it('opens after delay on hover and closes on mouseleave', async () => {
      render(<TooltipClickable content={tooltipContent} delay={50} />);

      const button = screen.getByRole('button');

      fireEvent.mouseEnter(button);

      await expect(screen.findByText(tooltipContent)).resolves.toBeInTheDocument();

      fireEvent.mouseLeave(button);

      await waitFor(() => {
        expect(button).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('does not open when mouseleave fires before delay', async () => {
      render(<TooltipClickable content={tooltipContent} delay={200} />);

      const button = screen.getByRole('button');

      fireEvent.mouseEnter(button);
      fireEvent.mouseLeave(button);

      await act(async () => {
        await new Promise(resolve => {
          setTimeout(resolve, 350);
        });
      });

      expect(screen.queryByText(tooltipContent)).not.toBeInTheDocument();
    });

    it('click-pinned tooltip survives mouseleave', async () => {
      render(<TooltipClickable content={tooltipContent} />);

      const button = screen.getByRole('button');

      fireEvent.click(button);
      await screen.findByText(tooltipContent);

      fireEvent.mouseLeave(button);

      // Give close path a chance to run.
      await act(async () => {
        await new Promise(resolve => {
          setTimeout(resolve, 50);
        });
      });

      expect(screen.getByText(tooltipContent)).toBeInTheDocument();
    });

    it('click-pinned tooltip survives blur', async () => {
      render(<TooltipClickable content={tooltipContent} />);

      const button = screen.getByRole('button');

      fireEvent.click(button);
      await screen.findByText(tooltipContent);

      fireEvent.blur(button);

      await act(async () => {
        await new Promise(resolve => {
          setTimeout(resolve, 50);
        });
      });

      expect(screen.getByText(tooltipContent)).toBeInTheDocument();
    });

    it('opens immediately on keyboard focus (focus-visible)', async () => {
      const restore = stubFocusVisible(true);

      try {
        render(<TooltipClickable content={tooltipContent} delay={500} />);

        const button = screen.getByRole('button');

        act(() => {
          button.focus();
        });

        await expect(screen.findByText(tooltipContent)).resolves.toBeInTheDocument();
      } finally {
        restore();
      }
    });

    it('does not open on mouse-driven focus', async () => {
      const restore = stubFocusVisible(false);

      try {
        render(<TooltipClickable content={tooltipContent} />);

        const button = screen.getByRole('button');

        act(() => {
          button.focus();
        });

        await act(async () => {
          await new Promise(resolve => {
            setTimeout(resolve, 50);
          });
        });

        expect(screen.queryByText(tooltipContent)).not.toBeInTheDocument();
      } finally {
        restore();
      }
    });

    it('focus-opened tooltip closes on blur', async () => {
      const restore = stubFocusVisible(true);

      try {
        render(<TooltipClickable content={tooltipContent} />);

        const button = screen.getByRole('button');

        fireEvent.focus(button);
        await screen.findByText(tooltipContent);

        fireEvent.blur(button);

        await waitFor(() => {
          expect(button).toHaveAttribute('aria-expanded', 'false');
        });
      } finally {
        restore();
      }
    });

    it('closes on Escape key', async () => {
      render(<TooltipClickable content={tooltipContent} />);

      const button = screen.getByRole('button');

      fireEvent.click(button);
      await expect(screen.findByText(tooltipContent)).resolves.toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(button).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('closes on pointerdown outside trigger', async () => {
      render(
        <div>
          <button data-testid="outside" type="button">
            outside
          </button>
          <TooltipClickable content={tooltipContent} />
        </div>,
      );

      const trigger = screen.getByRole('button', { name: 'More information' });

      fireEvent.click(trigger);
      await expect(screen.findByText(tooltipContent)).resolves.toBeInTheDocument();

      fireEvent.pointerDown(screen.getByTestId('outside'));

      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('does not close on pointerdown on trigger', async () => {
      render(<TooltipClickable content={tooltipContent} />);

      const button = screen.getByRole('button');

      fireEvent.click(button);
      await expect(screen.findByText(tooltipContent)).resolves.toBeInTheDocument();

      fireEvent.pointerDown(button);

      expect(screen.getByText(tooltipContent)).toBeInTheDocument();
    });

    it('closes when focus moves outside trigger', async () => {
      render(
        <div>
          <button data-testid="next" type="button">
            next
          </button>
          <TooltipClickable content={tooltipContent} />
        </div>,
      );

      const trigger = screen.getByRole('button', { name: 'More information' });

      fireEvent.click(trigger);
      await expect(screen.findByText(tooltipContent)).resolves.toBeInTheDocument();

      const next = screen.getByTestId('next');

      act(() => {
        next.focus();
      });

      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('does not attach document listeners while closed', () => {
      const addSpy = vi.spyOn(document, 'addEventListener');

      render(<TooltipClickable content={tooltipContent} />);

      const tracked = addSpy.mock.calls.filter(isTrackedListener);

      expect(tracked).toHaveLength(0);
    });

    it('attaches three document listeners when opened', async () => {
      const addSpy = vi.spyOn(document, 'addEventListener');

      render(<TooltipClickable content={tooltipContent} />);

      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        const tracked = addSpy.mock.calls.filter(isTrackedListener);
        const types = tracked.map(([type]) => type);

        expect(types).toIncludeAllMembers(['keydown', 'pointerdown', 'focusin']);
      });
    });

    it('removes document listeners when closed', async () => {
      const removeSpy = vi.spyOn(document, 'removeEventListener');

      render(<TooltipClickable content={tooltipContent} />);

      const button = screen.getByRole('button');

      fireEvent.click(button);
      await screen.findByText(tooltipContent);
      fireEvent.click(button);

      await waitFor(() => {
        const tracked = removeSpy.mock.calls.filter(isTrackedListener);
        const types = tracked.map(([type]) => type);

        expect(types).toIncludeAllMembers(['keydown', 'pointerdown', 'focusin']);
      });
    });

    it('removes document listeners on unmount while open', async () => {
      const removeSpy = vi.spyOn(document, 'removeEventListener');

      const { unmount } = render(<TooltipClickable content={tooltipContent} />);

      fireEvent.click(screen.getByRole('button'));
      await screen.findByText(tooltipContent);

      unmount();

      const tracked = removeSpy.mock.calls.filter(isTrackedListener);
      const types = tracked.map(([type]) => type);

      expect(types).toIncludeAllMembers(['keydown', 'pointerdown', 'focusin']);
    });

    it('does not open on hover when isDisabled', async () => {
      render(<TooltipClickable content={tooltipContent} delay={50} isDisabled />);

      fireEvent.mouseEnter(screen.getByRole('button'));

      await act(async () => {
        await new Promise(resolve => {
          setTimeout(resolve, 200);
        });
      });

      expect(screen.queryByText(tooltipContent)).not.toBeInTheDocument();
    });
  });
});
