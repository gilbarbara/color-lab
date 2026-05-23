import {
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useRef,
} from 'react';
import { useSetState } from '@gilbarbara/hooks';
import { Input, type InputProps, Spinner } from '@heroui/react';

interface EditableInputProps extends Omit<InputProps, 'value' | 'onChange' | 'color'> {
  onCommit: (value: string, action: CommitAction) => void | Promise<unknown>;
  spinnerThreshold?: number;
  value: string;
}

interface EditableInputState {
  draft: string;
  isEditing: boolean;
  isPending: boolean;
  showSpinner: boolean;
}

export type CommitAction = 'enter' | 'blur';

const DEFAULT_SPINNER_THRESHOLD = 400;

export default function EditableInput(props: EditableInputProps) {
  const {
    endContent,
    isDisabled,
    onBlur,
    onCommit,
    onFocus,
    onKeyDown,
    spinnerThreshold = DEFAULT_SPINNER_THRESHOLD,
    value,
    ...rest
  } = props;

  const [{ draft, isEditing, isPending, showSpinner }, setState] = useSetState<EditableInputState>({
    draft: value,
    isEditing: false,
    isPending: false,
    showSpinner: false,
  });

  const committingRef = useRef(false);
  const revertedRef = useRef(false);
  const spinnerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (spinnerTimerRef.current) {
        clearTimeout(spinnerTimerRef.current);
      }
    };
  }, []);

  const trackPending = (result: void | Promise<unknown>) => {
    if (!(result instanceof Promise)) {
      setState({ isEditing: false });

      return;
    }

    setState({ isPending: true });
    spinnerTimerRef.current = setTimeout(() => {
      setState({ showSpinner: true });
    }, spinnerThreshold);

    const settle = () => {
      if (spinnerTimerRef.current) {
        clearTimeout(spinnerTimerRef.current);
        spinnerTimerRef.current = null;
      }

      setState({ isEditing: false, isPending: false, showSpinner: false });
    };

    result.then(settle).catch(settle);
  };

  const handleFocus = (event: FocusEvent<HTMLInputElement>) => {
    setState({ isEditing: true, draft: value });
    onFocus?.(event);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setState({ draft: event.target.value });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      if (draft !== value) {
        committingRef.current = true;
        trackPending(onCommit(draft, 'enter'));
      }

      event.currentTarget.blur();
    } else if (event.key === 'Escape') {
      revertedRef.current = true;
      event.currentTarget.blur();
    }

    onKeyDown?.(event);
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    if (committingRef.current) {
      committingRef.current = false;
    } else if (revertedRef.current) {
      revertedRef.current = false;
      setState({ isEditing: false });
    } else if (draft !== value) {
      trackPending(onCommit(draft, 'blur'));
    } else {
      setState({ isEditing: false });
    }

    onBlur?.(event);
  };

  const resolvedEndContent: ReactNode =
    endContent ?? (showSpinner ? <Spinner size="sm" /> : undefined);

  return (
    <Input
      {...rest}
      color={(isEditing || isPending) && draft !== value ? 'warning' : undefined}
      endContent={resolvedEndContent}
      isDisabled={isDisabled || isPending}
      onBlur={handleBlur}
      onChange={handleChange}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      value={isEditing || isPending ? draft : value}
    />
  );
}
