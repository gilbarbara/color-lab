import { act, fireEvent, render, screen, waitFor } from '~/test-utils';

import EditableInput from '~/components/EditableInput';

describe('EditableInput', () => {
  describe('sync commit', () => {
    it('commits on Enter when changed', () => {
      const onCommit = vi.fn();

      render(<EditableInput onCommit={onCommit} value="Foo" />);

      const input = screen.getByDisplayValue('Foo') as HTMLInputElement;

      act(() => input.focus());
      fireEvent.change(input, { target: { value: 'Bar' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onCommit).toHaveBeenCalledWith('Bar', 'enter');
    });

    it('commits on blur when changed', () => {
      const onCommit = vi.fn();

      render(<EditableInput onCommit={onCommit} value="Foo" />);

      const input = screen.getByDisplayValue('Foo') as HTMLInputElement;

      act(() => input.focus());
      fireEvent.change(input, { target: { value: 'Bar' } });
      fireEvent.blur(input);

      expect(onCommit).toHaveBeenCalledWith('Bar', 'blur');
    });

    it('skips commit when draft equals value', () => {
      const onCommit = vi.fn();

      render(<EditableInput onCommit={onCommit} value="Foo" />);

      const input = screen.getByDisplayValue('Foo') as HTMLInputElement;

      act(() => input.focus());
      fireEvent.blur(input);

      expect(onCommit).not.toHaveBeenCalled();
    });

    it('discards draft on Escape', () => {
      const onCommit = vi.fn();

      render(<EditableInput onCommit={onCommit} value="Foo" />);

      const input = screen.getByDisplayValue('Foo') as HTMLInputElement;

      act(() => input.focus());
      fireEvent.change(input, { target: { value: 'Bar' } });
      // Escape handler blurs the input internally
      fireEvent.keyDown(input, { key: 'Escape' });

      expect(onCommit).not.toHaveBeenCalled();
      expect(screen.getByDisplayValue('Foo')).toBeInTheDocument();
    });
  });

  describe('async commit pending state', () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('keeps draft visible and disables input while Promise pending', async () => {
      let resolveCommit: (value?: unknown) => void = () => {};

      const onCommit = vi.fn(
        () =>
          new Promise(resolve => {
            resolveCommit = resolve;
          }),
      );

      render(<EditableInput onCommit={onCommit} value="Foo" />);

      const input = screen.getByDisplayValue('Foo') as HTMLInputElement;

      act(() => input.focus());
      fireEvent.change(input, { target: { value: 'Bar' } });
      fireEvent.blur(input);

      expect(onCommit).toHaveBeenCalledWith('Bar', 'blur');

      // Draft visible, input disabled while pending
      expect(screen.getByDisplayValue('Bar')).toBeInTheDocument();
      expect(input).toBeDisabled();

      // Spinner hasn't appeared yet (under threshold)
      expect(screen.queryByLabelText(/loading/i)).toBeNull();

      await act(async () => {
        resolveCommit();
        await Promise.resolve();
      });
    });

    it('shows spinner after threshold elapses while still pending', async () => {
      let resolveCommit: (value?: unknown) => void = () => {};

      const onCommit = vi.fn(
        () =>
          new Promise(resolve => {
            resolveCommit = resolve;
          }),
      );

      render(<EditableInput onCommit={onCommit} spinnerThreshold={400} value="Foo" />);

      const input = screen.getByDisplayValue('Foo') as HTMLInputElement;

      act(() => input.focus());
      fireEvent.change(input, { target: { value: 'Bar' } });
      fireEvent.blur(input);

      // Advance past threshold
      act(() => {
        vi.advanceTimersByTime(401);
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/loading/i)).toBeInTheDocument();
      });

      await act(async () => {
        resolveCommit();
        await Promise.resolve();
      });
    });

    it('exits pending and re-enables input on Promise resolve', async () => {
      let resolveCommit: (value?: unknown) => void = () => {};

      const onCommit = vi.fn(
        () =>
          new Promise(resolve => {
            resolveCommit = resolve;
          }),
      );

      const { rerender } = render(<EditableInput onCommit={onCommit} value="Foo" />);

      const input = screen.getByDisplayValue('Foo') as HTMLInputElement;

      act(() => input.focus());
      fireEvent.change(input, { target: { value: 'Bar' } });
      fireEvent.blur(input);

      expect(input).toBeDisabled();

      // Simulate parent updating value after async commit succeeds
      await act(async () => {
        resolveCommit();
        await Promise.resolve();
      });

      rerender(<EditableInput onCommit={onCommit} value="Bar" />);

      await waitFor(() => {
        expect(input).not.toBeDisabled();
      });

      expect(screen.getByDisplayValue('Bar')).toBeInTheDocument();
    });

    it('exits pending on Promise rejection (parent owns error handling)', async () => {
      let rejectCommit: (reason?: unknown) => void = () => {};

      const onCommit = vi.fn(
        () =>
          new Promise((_resolve, reject) => {
            rejectCommit = reject;
          }),
      );

      render(<EditableInput onCommit={onCommit} value="Foo" />);

      const input = screen.getByDisplayValue('Foo') as HTMLInputElement;

      act(() => input.focus());
      fireEvent.change(input, { target: { value: 'Bar' } });
      fireEvent.blur(input);

      expect(input).toBeDisabled();

      await act(async () => {
        rejectCommit(new Error('network'));
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(input).not.toBeDisabled();
      });
    });
  });
});
