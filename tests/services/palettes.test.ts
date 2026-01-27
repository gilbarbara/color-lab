import { Permission, Query, Role } from 'appwrite';

import {
  createPalette,
  deletePalette,
  getPalette,
  listPalettes,
  updatePalette,
} from '~/services/palettes';
import { databases } from '~/utils/appwrite';

vi.mock('~/utils/appwrite', () => ({
  databases: {
    createRow: vi.fn(),
    deleteRow: vi.fn(),
    getRow: vi.fn(),
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
      const mockResult = { $id: 'new-id', name: 'My Palette', url: '/p/red-ff0000' };

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
      // Result includes ID in URL via withIdInUrl
      expect(result.url).toBe('/p/red-ff0000?id=new-id');
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

  describe('getPalette', () => {
    it('returns palette with ID in URL on success', async () => {
      const mockResult = { $id: 'palette-1', name: 'My Palette', url: '/p/red-ff0000' };

      vi.mocked(databases.getRow).mockResolvedValueOnce(mockResult as any);

      const result = await getPalette('palette-1');

      expect(databases.getRow).toHaveBeenCalledWith({
        databaseId: DATABASE_ID,
        tableId: COLLECTION_ID,
        rowId: 'palette-1',
      });
      expect(result?.url).toBe('/p/red-ff0000?id=palette-1');
    });

    it('returns null when palette not found', async () => {
      vi.mocked(databases.getRow).mockRejectedValueOnce(new Error('Not found'));

      const result = await getPalette('nonexistent');

      expect(result).toBe(null);
    });
  });

  describe('listPalettes', () => {
    it('calls databases.listRows with userId query and orderDesc', async () => {
      const mockResult = { total: 1, rows: [{ $id: 'p1', url: '/p/red-ff0000' }] };

      vi.mocked(databases.listRows).mockResolvedValueOnce(mockResult as any);

      const result = await listPalettes('user-1');

      expect(databases.listRows).toHaveBeenCalledWith({
        databaseId: DATABASE_ID,
        tableId: COLLECTION_ID,
        queries: [Query.equal('userId', 'user-1'), Query.orderDesc('$updatedAt')],
      });
      // Result rows include ID in URL via withIdInUrl
      expect(result.rows[0].url).toBe('/p/red-ff0000?id=p1');
    });
  });

  describe('updatePalette', () => {
    it('calls databases.updateRow with partial data', async () => {
      const mockResult = { $id: 'palette-1', name: 'Updated', url: '/p/red-ff0000' };

      vi.mocked(databases.updateRow).mockResolvedValueOnce(mockResult as any);

      const result = await updatePalette('palette-1', { name: 'Updated' });

      expect(databases.updateRow).toHaveBeenCalledWith({
        databaseId: DATABASE_ID,
        tableId: COLLECTION_ID,
        rowId: 'palette-1',
        data: { name: 'Updated' },
      });
      // Result includes ID in URL via withIdInUrl
      expect(result.url).toBe('/p/red-ff0000?id=palette-1');
    });

    it('handles isFavorite update', async () => {
      const mockResult = { $id: 'palette-1', isFavorite: true, url: '/p/red-ff0000' };

      vi.mocked(databases.updateRow).mockResolvedValueOnce(mockResult as any);

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
