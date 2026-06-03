import * as Sentry from '@sentry/nextjs';
import { FirebaseError } from 'firebase/app';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore/lite';
import type { DocumentSnapshot } from 'firebase/firestore/lite';

import { PALETTES_COLLECTION } from '~/config/firebase';
import { getFirebaseDb } from '~/utils/firebase';
import { decoratePaletteUrl } from '~/utils/url';

import type { GetPaletteResult, SavedPalette } from '~/types';

function documentToSavedPalette(snapshot: DocumentSnapshot): SavedPalette {
  const data = snapshot.data();

  if (!data) {
    throw new Error(`Palette document ${snapshot.id} has no data`);
  }

  return {
    id: snapshot.id,
    createdAt: data.createdAt?.toDate().toISOString(),
    updatedAt: data.updatedAt?.toDate().toISOString(),
    isFavorite: data.isFavorite,
    name: data.name,
    url: data.url,
    userId: data.userId,
  };
}

function palettesRef() {
  return collection(getFirebaseDb(), PALETTES_COLLECTION);
}

// Decorate the structural (stored) url with the record's identity — `id` and
// `name` — at read-time. Both are derived from the authoritative record fields,
// never persisted. `decoratePaletteUrl` keeps the id terminal and drops the name
// when it is the default.
function withDisplayUrl(palette: SavedPalette): SavedPalette {
  const url = decoratePaletteUrl(palette.url, { id: palette.id, name: palette.name });

  return { ...palette, url };
}

export async function createPalette(userId: string, name: string, url: string) {
  const now = new Date().toISOString();

  const documentRef = await addDoc(palettesRef(), {
    userId,
    name,
    url,
    isFavorite: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const palette: SavedPalette = {
    id: documentRef.id,
    createdAt: now,
    updatedAt: now,
    isFavorite: false,
    name,
    url,
    userId,
  };

  return withDisplayUrl(palette);
}

export async function deletePalette(id: string) {
  await deleteDoc(doc(getFirebaseDb(), PALETTES_COLLECTION, id));
}

export async function getPalette(id: string): Promise<GetPaletteResult> {
  try {
    const snapshot = await getDoc(doc(getFirebaseDb(), PALETTES_COLLECTION, id));

    if (!snapshot.exists()) return { kind: 'not-found' };

    return { kind: 'success', palette: withDisplayUrl(documentToSavedPalette(snapshot)) };
  } catch (error) {
    // The read rule (`resource.data.userId == auth.uid`) refuses deleted,
    // non-existent, and other-user docs all as `permission-denied`. It's an
    // expected, common outcome (stale link / shared link), not a failure to
    // capture — but breadcrumb it so a spike (= a bad rules deploy) stays visible.
    if (error instanceof FirebaseError && error.code === 'permission-denied') {
      Sentry.addBreadcrumb({
        category: 'palette-load',
        message: 'getPalette permission-denied',
        level: 'warning',
        data: { id },
      });

      return { kind: 'forbidden' };
    }

    Sentry.captureException(error, {
      tags: { firestore: 'getPalette' },
      extra: { id },
    });

    return { kind: 'error', error };
  }
}

export async function listPalettes(userId: string): Promise<SavedPalette[]> {
  const q = query(palettesRef(), where('userId', '==', userId), orderBy('updatedAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(d => withDisplayUrl(documentToSavedPalette(d)));
}

/**
 * Patch the `url` field only, without touching `updatedAt`.
 * Used to canonicalise legacy palette URLs in Firestore without lying about
 * when the user last modified the palette.
 */
export async function migratePaletteUrl(id: string, url: string): Promise<void> {
  const documentRef = doc(getFirebaseDb(), PALETTES_COLLECTION, id);

  await updateDoc(documentRef, { url });
}

export async function updatePalette(
  id: string,
  data: Partial<Pick<SavedPalette, 'isFavorite' | 'name' | 'url'>>,
) {
  const documentRef = doc(getFirebaseDb(), PALETTES_COLLECTION, id);

  await updateDoc(documentRef, { ...data, updatedAt: serverTimestamp() });

  const snapshot = await getDoc(documentRef);

  return withDisplayUrl(documentToSavedPalette(snapshot));
}
