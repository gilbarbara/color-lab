// Pure auth-error message mapping. Deliberately Firebase-free so consumers
// (e.g. AuthProvider) can import it statically without pulling the Firebase SDK
// onto the first-load path. Firebase auth errors carry a string `code`.

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/user-not-found': 'Incorrect email or password.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/missing-password': 'Please enter your password.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
  'auth/popup-blocked': 'Your browser blocked the sign-in popup. Allow popups and try again.',
  'auth/cancelled-popup-request': 'Sign-in was cancelled.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled.',
  'auth/requires-recent-login': 'Please sign in again to continue.',
  'auth/invalid-action-code': 'This link is invalid or has already been used.',
  'auth/expired-action-code': 'This link has expired. Request a new one.',
};

/**
 * Maps a Firebase auth error to a user-friendly message. Raw Firebase error
 * strings (e.g. "Firebase: Error (auth/invalid-credential).") must never reach
 * the UI, so a Firebase error with an unmapped code resolves to `fallback`.
 * Non-Firebase errors fall back to their own message.
 */
export function getAuthErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (error && typeof error === 'object' && 'code' in error) {
    return AUTH_ERROR_MESSAGES[(error as { code: string }).code] ?? fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
