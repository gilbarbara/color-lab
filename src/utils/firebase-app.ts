import { type FirebaseApp, getApps, initializeApp } from 'firebase/app';

import { firebaseConfig } from '~/config/firebase';

// Initialize lazily, on first use, rather than at module load. The Firebase
// config is only valid in the browser/runtime; eager init at import time runs
// during Next.js static prerendering (e.g. /_not-found) and throws
// `auth/invalid-api-key` when the build-time env is absent.
//
// This module imports only `firebase/app` so the auth and firestore leaves
// (`firebase.ts`, `firebase-db.ts`) stay independent lazy chunks.

let app: FirebaseApp | undefined;

export function getFirebaseApp(): FirebaseApp {
  app ??= getApps()[0] ?? initializeApp(firebaseConfig);

  return app;
}
