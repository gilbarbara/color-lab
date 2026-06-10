import { type Auth, getAuth } from 'firebase/auth';

import { getFirebaseApp } from '~/utils/firebase-app';

// Auth leaf. Imported only via dynamic `import()` on the generator path (see
// AuthProvider), so `firebase/auth` stays off the first-load bundle. The
// `/auth/callback` route imports it statically, which is fine — that route is
// not on the generator's critical path.
//
// Pure error-message mapping lives in `~/utils/auth-errors` (Firebase-free) so
// it can be imported statically without pulling the SDK.

let authInstance: Auth | undefined;

export function getFirebaseAuth(): Auth {
  authInstance ??= getAuth(getFirebaseApp());

  return authInstance;
}
