import { Permission, Query, Role } from 'appwrite';

import { createPalette, deletePalette, listPalettes, updatePalette } from '~/services/palettes';
import { databases } from '~/utils/appwrite';

vi.mock('~/utils/appwrite', () => ({
  databases: {
    createRow: vi.fn(),
    deleteRow: vi.fn(),
    listRows: vi.fn(),
    updateRow: vi.fn(),
  },
}));

const DATABASE_ID = 'color-lab';
const COLLECTION_ID = 'palettes';

describe('services/palettes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createPalette', () => {
    it('calls databases.createRow with correct parameters', async () => {
      const mockResult = { $id: 'new-id', name: 'My Palette' };

      vi.mocked(databases.createRow).mockResolvedValueOnce(mockResult as any);

      const result = await createPalette('user-1', 'My Palette', '/p/red-ff0000');

      expect(databases.createRow).toHaveBeenCalledWith({
        databaseId: DATABASE_ID,
        data: { userId: 'user-1', name: 'My Palette', url: '/p/red-ff0000', isFavorite: false },
        permissions: [
          Permission.read(Role.user('user-1')),
          Permission.update(Role.user('user-1')),
          Permission.delete(Role.user('user-1')),
        ],
        tableId: COLLECTION_ID,
        rowId: expect.any(String),
      });
      expect(result).toBe(mockResult);
    });
  });

  describe('deletePalette', () => {
    it('calls databases.deleteRow with correct parameters', async () => {
      vi.mocked(databases.deleteRow).mockResolvedValueOnce(undefined as any);

      await deletePalette('palette-1');

      expect(databases.deleteRow).toHaveBeenCalledWith({
        databaseId: DATABASE_ID,
        tableId: COLLECTION_ID,
        rowId: 'palette-1',
      });
    });
  });

  describe('listPalettes', () => {
    it('calls databases.listRows with userId query and orderDesc', async () => {
      const mockResult = { total: 1, rows: [{ $id: 'p1' }] };

      vi.mocked(databases.listRows).mockResolvedValueOnce(mockResult as any);

      const result = await listPalettes('user-1');

      expect(databases.listRows).toHaveBeenCalledWith({
        databaseId: DATABASE_ID,
        tableId: COLLECTION_ID,
        queries: [Query.equal('userId', 'user-1'), Query.orderDesc('$updatedAt')],
      });
      expect(result).toBe(mockResult);
    });
  });

  describe('updatePalette', () => {
    it('calls databases.updateRow with partial data', async () => {
      const mockResult = { $id: 'palette-1', name: 'Updated' };

      vi.mocked(databases.updateRow).mockResolvedValueOnce(mockResult as any);

      const result = await updatePalette('palette-1', { name: 'Updated' });

      expect(databases.updateRow).toHaveBeenCalledWith({
        databaseId: DATABASE_ID,
        tableId: COLLECTION_ID,
        rowId: 'palette-1',
        data: { name: 'Updated' },
      });
      expect(result).toBe(mockResult);
    });

    it('handles isFavorite update', async () => {
      vi.mocked(databases.updateRow).mockResolvedValueOnce({ isFavorite: true } as any);

      await updatePalette('palette-1', { isFavorite: true });

      expect(databases.updateRow).toHaveBeenCalledWith({
        databaseId: DATABASE_ID,
        tableId: COLLECTION_ID,
        rowId: 'palette-1',
        data: { isFavorite: true },
      });
    });
  });
});
