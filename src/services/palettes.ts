import { ID, Permission, Query, Role } from 'appwrite';

import { COLLECTION_ID, DATABASE_ID } from '~/config/appwrite';
import { databases } from '~/utils/appwrite';

import type { SavedPalette } from '~/types';

export async function createPalette(userId: string, name: string, url: string) {
  return databases.createRow<SavedPalette>({
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
}

export async function deletePalette(id: string) {
  return databases.deleteRow({
    databaseId: DATABASE_ID,
    tableId: COLLECTION_ID,
    rowId: id,
  });
}

export async function listPalettes(userId: string) {
  return databases.listRows<SavedPalette>({
    databaseId: DATABASE_ID,
    tableId: COLLECTION_ID,
    queries: [Query.equal('userId', userId), Query.orderDesc('$updatedAt')],
  });
}

export async function updatePalette(
  id: string,
  data: Partial<Pick<SavedPalette, 'isFavorite' | 'name' | 'url'>>,
) {
  return databases.updateRow<SavedPalette>({
    databaseId: DATABASE_ID,
    tableId: COLLECTION_ID,
    rowId: id,
    data,
  });
}
