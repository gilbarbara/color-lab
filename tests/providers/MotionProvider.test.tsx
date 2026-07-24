import { useContext } from 'react';
import { render, screen } from '@testing-library/react';
import { MotionConfigContext } from 'framer-motion';

import MotionProvider from '~/providers/MotionProvider';
import { setReducedMotion } from '~/test-mocks';

// Deliberately asserts the context value rather than driving a real motion.div through it:
// framer + jsdom + `height: 'auto'` measurement is a reliable CI flake, and jsdom runs no
// animations to skip. That the skip actually lands is covered by the e2e suite, which drives
// the preference through Playwright's emulateMedia.
function Probe() {
  const { skipAnimations } = useContext(MotionConfigContext);

  return <span data-testid="skip">{String(skipAnimations)}</span>;
}

describe('providers/MotionProvider', () => {
  it('renders children', () => {
    render(
      <MotionProvider>
        <span>content</span>
      </MotionProvider>,
    );

    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('leaves animations on without the preference', () => {
    render(
      <MotionProvider>
        <Probe />
      </MotionProvider>,
    );

    expect(screen.getByTestId('skip')).toHaveTextContent('false');
  });

  it('skips animations when the preference is set', () => {
    setReducedMotion(true);

    render(
      <MotionProvider>
        <Probe />
      </MotionProvider>,
    );

    expect(screen.getByTestId('skip')).toHaveTextContent('true');
  });
});
