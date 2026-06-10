import { type Firestore, getFirestore } from 'firebase/firestore/lite';

import { getFirebaseApp } from '~/utils/firebase-app';

// Firestore leaf. Imported only from `~/services/palettes`, which is itself
// dynamically imported at its call sites — so Firestore stays off the
// first-load path of the generator.

let dbInstance: Firestore | undefined;

export function getFirebaseDb(): Firestore {
  dbInstance ??= getFirestore(getFirebaseApp());

  return dbInstance;
}
