import userEvent from '@testing-library/user-event';

import { CRIMSON } from '~/test-fixtures';
import { act, fireEvent, render, screen, within } from '~/test-utils';
import { getDefaultGlobalOptions } from '~/utils/generator';

import ScaleColorOptions from '~/components/ScaleColorOptions';

import type { GlobalScaleOptions } from '~/types';

vi.mock('~/hooks/useRafCallback', () => ({
  default: (callback: unknown) => callback,
}));

const mockTrackEvent = vi.fn();

vi.mock('~/utils/analytics', () => ({
  trackEvent: (...arguments_: unknown[]) => mockTrackEvent(...arguments_),
  trackPage: vi.fn(),
}));

type Props = Parameters<typeof ScaleColorOptions>[0];

function createDefaultProps(overrides: Partial<Props> = {}): Props {
  const options: GlobalScaleOptions = getDefaultGlobalOptions(CRIMSON);

  return {
    defaultOptions: options,
    options,
    onReset: vi.fn(),
    onUpdate: vi.fn(),
    ...overrides,
  };
}

describe('ScaleColorOptions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Render', () => {
    it('renders default state', () => {
      render(<ScaleColorOptions {...createDefaultProps()} />);

      expect(screen.getByTestId('ScaleColorOptions')).toMatchSnapshot();
    });

    it('renders with title, description, isChromatic and useLightTheme', () => {
      render(
        <ScaleColorOptions
          {...createDefaultProps({
            title: 'Options for Primary',
            description: <p>Per-color overrides</p>,
            isChromatic: true,
            useLightTheme: true,
          })}
        />,
      );

      expect(screen.getByTestId('ScaleColorOptions')).toMatchSnapshot();
    });

    it('renders with non-default options (Reset buttons enabled)', () => {
      const defaults = getDefaultGlobalOptions(CRIMSON);

      render(
        <ScaleColorOptions
          {...createDefaultProps({
            defaultOptions: defaults,
            options: {
              ...defaults,
              chromaCurve: 0.5,
              lightnessCurve: 2.0,
              minLightness: 0.1,
              maxLightness: 0.95,
            },
          })}
        />,
      );

      expect(screen.getByTestId('ScaleColorOptions')).toMatchSnapshot();
    });
  });

  describe('Behavior', () => {
    it('updates lightnessCurve via slider keyboard interaction', async () => {
      const user = userEvent.setup();
      const onUpdate = vi.fn();
      const defaults = getDefaultGlobalOptions(CRIMSON);
      const expected = Number((defaults.lightnessCurve + 0.1).toFixed(1));

      render(<ScaleColorOptions {...createDefaultProps({ onUpdate })} />);

      const group = screen.getByRole('group', { name: 'Lightness Curve' });
      const slider = within(group).getByRole('slider');

      act(() => slider.focus());
      await user.keyboard('{ArrowRight}');

      expect(onUpdate).toHaveBeenLastCalledWith({ lightnessCurve: expected });
      expect(mockTrackEvent).toHaveBeenCalledWith('lightness-curve', { value: expected });
    });

    it('updates chromaCurve via slider keyboard interaction', async () => {
      const user = userEvent.setup();
      const onUpdate = vi.fn();
      const defaults = getDefaultGlobalOptions(CRIMSON);
      const expected = Number((defaults.chromaCurve + 0.1).toFixed(1));

      render(<ScaleColorOptions {...createDefaultProps({ onUpdate })} />);

      const group = screen.getByRole('group', { name: 'Chroma Curve' });
      const slider = within(group).getByRole('slider');

      act(() => slider.focus());
      await user.keyboard('{ArrowRight}');

      expect(onUpdate).toHaveBeenLastCalledWith({ chromaCurve: expected });
      expect(mockTrackEvent).toHaveBeenCalledWith('chroma-curve', { value: expected });
    });

    it('updates lightness range via second-handle keyboard interaction', async () => {
      const user = userEvent.setup();
      const onUpdate = vi.fn();
      const defaults = getDefaultGlobalOptions(CRIMSON);
      const expectedMax = Number((defaults.maxLightness - 0.01).toFixed(2));

      render(<ScaleColorOptions {...createDefaultProps({ onUpdate })} />);

      const group = screen.getByRole('group', { name: 'Lightness Range' });
      const sliders = within(group).getAllByRole('slider');

      act(() => sliders[1].focus());
      await user.keyboard('{ArrowLeft}');

      expect(onUpdate).toHaveBeenLastCalledWith({
        minLightness: defaults.minLightness,
        maxLightness: expectedMax,
      });
      expect(mockTrackEvent).toHaveBeenCalledWith('lightness-range', {
        min: defaults.minLightness,
        max: expectedMax,
      });
    });

    it('calls onReset when Reset button is clicked', () => {
      const onReset = vi.fn();

      render(<ScaleColorOptions {...createDefaultProps({ onReset })} />);

      fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

      expect(onReset).toHaveBeenCalledOnce();
    });

    it('per-slider Reset button calls onUpdate with default value', () => {
      const onUpdate = vi.fn();
      const defaults = getDefaultGlobalOptions(CRIMSON);

      render(
        <ScaleColorOptions
          {...createDefaultProps({
            defaultOptions: defaults,
            options: { ...defaults, lightnessCurve: 2.0 },
            onUpdate,
          })}
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Reset Lightness Curve to default' }));

      expect(onUpdate).toHaveBeenCalledWith({ lightnessCurve: defaults.lightnessCurve });
    });

    it('per-slider Reset button is disabled when value matches default', () => {
      render(<ScaleColorOptions {...createDefaultProps()} />);

      expect(
        screen.getByRole('button', { name: 'Reset Lightness Curve to default' }),
      ).toBeDisabled();
    });

    it('Chroma Curve Reset button calls onUpdate with default value', () => {
      const onUpdate = vi.fn();
      const defaults = getDefaultGlobalOptions(CRIMSON);

      render(
        <ScaleColorOptions
          {...createDefaultProps({
            defaultOptions: defaults,
            options: { ...defaults, chromaCurve: 0.5 },
            onUpdate,
          })}
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Reset Chroma Curve to default' }));

      expect(onUpdate).toHaveBeenCalledWith({ chromaCurve: defaults.chromaCurve });
    });

    it('Lightness Range Reset button calls onUpdate with default values', () => {
      const onUpdate = vi.fn();
      const defaults = getDefaultGlobalOptions(CRIMSON);

      render(
        <ScaleColorOptions
          {...createDefaultProps({
            defaultOptions: defaults,
            options: { ...defaults, minLightness: 0.1, maxLightness: 0.9 },
            onUpdate,
          })}
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Reset Lightness Range to default' }));

      expect(onUpdate).toHaveBeenCalledWith({
        minLightness: defaults.minLightness,
        maxLightness: defaults.maxLightness,
      });
    });
  });
});
