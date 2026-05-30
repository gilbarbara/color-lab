import * as Sentry from '@sentry/nextjs';
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
import { updatePaletteIdInUrl } from '~/utils/url';

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

function withIdInUrl(palette: SavedPalette): SavedPalette {
  return { ...palette, url: updatePaletteIdInUrl(palette.url, palette.id) };
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

  return withIdInUrl(palette);
}

export async function deletePalette(id: string) {
  await deleteDoc(doc(getFirebaseDb(), PALETTES_COLLECTION, id));
}

export async function getPalette(id: string): Promise<GetPaletteResult> {
  try {
    const snapshot = await getDoc(doc(getFirebaseDb(), PALETTES_COLLECTION, id));

    if (!snapshot.exists()) return { kind: 'not-found' };

    return { kind: 'success', palette: withIdInUrl(documentToSavedPalette(snapshot)) };
  } catch (error) {
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

  return snapshot.docs.map(d => withIdInUrl(documentToSavedPalette(d)));
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

  return withIdInUrl(documentToSavedPalette(snapshot));
}
