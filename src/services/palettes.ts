import { ID, Permission, Query, Role } from 'appwrite';

import { COLLECTION_ID, DATABASE_ID } from '~/config/appwrite';
import { databases } from '~/utils/appwrite';
import { updatePaletteIdInUrl } from '~/utils/url';

import type { SavedPalette } from '~/types';

function withIdInUrl(palette: SavedPalette): SavedPalette {
  return { ...palette, url: updatePaletteIdInUrl(palette.url, palette.$id) };
}

export async function createPalette(userId: string, name: string, url: string) {
  const palette = await databases.createRow<SavedPalette>({
    databaseId: DATABASE_ID,
    data: { userId, name, url, isFavorite: false },
    permissions: [
      Permission.read(Role.user(userId)),
      Permission.update(Role.user(userId)),
      Permission.delete(Role.user(userId)),
    ],
    tableId: COLLECTION_ID,
    rowId: ID.unique(),
  });

  return withIdInUrl(palette);
}

export async function deletePalette(id: string) {
  return databases.deleteRow({
    databaseId: DATABASE_ID,
    tableId: COLLECTION_ID,
    rowId: id,
  });
}

export async function getPalette(id: string): Promise<SavedPalette | null> {
  try {
    const palette = await databases.getRow<SavedPalette>({
      databaseId: DATABASE_ID,
      tableId: COLLECTION_ID,
      rowId: id,
    });

    return withIdInUrl(palette);
  } catch {
    return null; // Not found or permission denied
  }
}

export async function listPalettes(userId: string) {
  const result = await databases.listRows<SavedPalette>({
    databaseId: DATABASE_ID,
    tableId: COLLECTION_ID,
    queries: [Query.equal('userId', userId), Query.orderDesc('$updatedAt')],
  });

  return { ...result, rows: result.rows.map(withIdInUrl) };
}

export async function updatePalette(
  id: string,
  data: Partial<Pick<SavedPalette, 'isFavorite' | 'name' | 'url'>>,
) {
  const palette = await databases.updateRow<SavedPalette>({
    databaseId: DATABASE_ID,
    tableId: COLLECTION_ID,
    rowId: id,
    data,
  });

  return withIdInUrl(palette);
}
