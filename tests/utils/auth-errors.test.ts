import { getAuthErrorMessage } from '~/utils/auth-errors';

describe('utils/auth-errors', () => {
  describe('getAuthErrorMessage', () => {
    it('maps a known Firebase error code to a friendly message', () => {
      const error = Object.assign(new Error('Firebase: Error (auth/invalid-credential).'), {
        code: 'auth/invalid-credential',
      });

      expect(getAuthErrorMessage(error)).toBe('Incorrect email or password.');
    });

    it('maps too-many-requests', () => {
      expect(getAuthErrorMessage({ code: 'auth/too-many-requests' })).toBe(
        'Too many attempts. Please wait a moment and try again.',
      );
    });

    it('never leaks the raw message for an unmapped Firebase code', () => {
      const error = Object.assign(new Error('Firebase: Error (auth/some-new-code).'), {
        code: 'auth/some-new-code',
      });

      expect(getAuthErrorMessage(error, 'Login failed')).toBe('Login failed');
    });

    it('falls back to the message for a non-Firebase Error', () => {
      expect(getAuthErrorMessage(new Error('Invalid credentials'))).toBe('Invalid credentials');
    });

    it('uses the fallback for non-error values', () => {
      expect(getAuthErrorMessage(null, 'Login failed')).toBe('Login failed');
      expect(getAuthErrorMessage('boom', 'Login failed')).toBe('Login failed');
    });

    it('uses the default fallback when none is provided', () => {
      expect(getAuthErrorMessage(undefined)).toBe('Something went wrong. Please try again.');
    });
  });
});
