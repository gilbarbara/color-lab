import { type FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { type Auth, type AuthError, getAuth } from 'firebase/auth';
import { type Firestore, getFirestore } from 'firebase/firestore/lite';

import { firebaseConfig } from '~/config/firebase';

// Initialize lazily, on first use, rather than at module load. The Firebase
// config is only valid in the browser/runtime; eager `getAuth()` at import time
// runs during Next.js static prerendering (e.g. /_not-found) and throws
// `auth/invalid-api-key` when the build-time env is absent, failing the build.

let app: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let dbInstance: Firestore | undefined;

function getApp(): FirebaseApp {
  app ??= getApps()[0] ?? initializeApp(firebaseConfig);

  return app;
}

export function getFirebaseAuth(): Auth {
  authInstance ??= getAuth(getApp());

  return authInstance;
}

export function getFirebaseDb(): Firestore {
  dbInstance ??= getFirestore(getApp());

  return dbInstance;
}

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
    return AUTH_ERROR_MESSAGES[(error as AuthError).code] ?? fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
