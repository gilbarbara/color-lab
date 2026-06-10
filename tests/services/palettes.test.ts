import { FirebaseError } from 'firebase/app';

import {
  createPalette,
  deletePalette,
  getPalette,
  listPalettes,
  migratePaletteUrl,
  updatePalette,
} from '~/services/palettes';

const mockAddDocument = vi.fn();
const mockDeleteDocument = vi.fn();
const mockGetDocument = vi.fn();
const mockGetDocuments = vi.fn();
const mockUpdateDocument = vi.fn();

vi.mock('firebase/firestore/lite', () => ({
  addDoc: (...arguments_: unknown[]) => mockAddDocument(...arguments_),
  collection: vi.fn(() => 'palettes-ref'),
  deleteDoc: (...arguments_: unknown[]) => mockDeleteDocument(...arguments_),
  doc: vi.fn((_db, _collection, id) => `doc-ref-${id}`),
  getDoc: (...arguments_: unknown[]) => mockGetDocument(...arguments_),
  getDocs: (...arguments_: unknown[]) => mockGetDocuments(...arguments_),
  getFirestore: vi.fn(),
  orderBy: vi.fn(),
  query: vi.fn(),
  serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
  updateDoc: (...arguments_: unknown[]) => mockUpdateDocument(...arguments_),
  where: vi.fn(),
}));

vi.mock('~/utils/firebase-db', () => ({
  getFirebaseDb: () => ({}),
}));

function mockSnapshot(id: string, data: Record<string, unknown>) {
  const toDate = () => ({
    toISOString: () => '2024-01-01T00:00:00.000Z',
  });

  return {
    id,
    exists: () => true,
    data: () => ({
      ...data,
      createdAt: { toDate },
      updatedAt: { toDate },
    }),
  };
}

describe('services/palettes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createPalette', () => {
    it('calls addDoc and constructs palette locally', async () => {
      mockAddDocument.mockResolvedValueOnce({ id: 'new-id' });

      const result = await createPalette('user-1', 'My Palette', '/p/red-ff0000');

      expect(mockAddDocument).toHaveBeenCalledWith('palettes-ref', {
        userId: 'user-1',
        name: 'My Palette',
        url: '/p/red-ff0000',
        isFavorite: false,
        createdAt: 'SERVER_TIMESTAMP',
        updatedAt: 'SERVER_TIMESTAMP',
      });
      expect(mockGetDocument).not.toHaveBeenCalled();
      expect(result.url).toBe('/p/red-ff0000?name=My+Palette&id=new-id');
      expect(result.name).toBe('My Palette');
      expect(result.userId).toBe('user-1');
      expect(result.isFavorite).toBe(false);
    });
  });

  describe('deletePalette', () => {
    it('calls deleteDoc with correct reference', async () => {
      mockDeleteDocument.mockResolvedValueOnce(undefined);

      await deletePalette('palette-1');

      expect(mockDeleteDocument).toHaveBeenCalledWith('doc-ref-palette-1');
    });
  });

  describe('getPalette', () => {
    it('returns success kind with palette on success', async () => {
      mockGetDocument.mockResolvedValueOnce(
        mockSnapshot('palette-1', {
          name: 'My Palette',
          url: '/p/red-ff0000',
          userId: 'user-1',
          isFavorite: false,
        }),
      );

      const result = await getPalette('palette-1');

      expect(result.kind).toBe('success');

      if (result.kind === 'success') {
        // eslint-disable-next-line vitest/no-conditional-expect
        expect(result.palette.url).toBe('/p/red-ff0000?name=My+Palette&id=palette-1');
      }
    });

    it('returns not-found kind when palette does not exist', async () => {
      mockGetDocument.mockResolvedValueOnce({
        exists: () => false,
        id: 'nonexistent',
        data: () => null,
      });

      const result = await getPalette('nonexistent');

      expect(result).toEqual({ kind: 'not-found' });
    });

    it('returns error kind when Firestore throws', async () => {
      const networkError = new Error('Network unavailable');

      mockGetDocument.mockRejectedValueOnce(networkError);

      const result = await getPalette('palette-1');

      expect(result.kind).toBe('error');

      if (result.kind === 'error') {
        // eslint-disable-next-line vitest/no-conditional-expect
        expect(result.error).toBe(networkError);
      }
    });

    it('returns forbidden kind on permission-denied (deleted / not-owned palette)', async () => {
      // The read rule denies deleted/non-owned docs as `permission-denied`. That's
      // a refused read, not proof the doc is gone, so it maps to `forbidden` — never
      // a fabricated `not-found` — and stays distinct from a transient `error`.
      mockGetDocument.mockRejectedValueOnce(
        new FirebaseError('permission-denied', 'Missing or insufficient permissions.'),
      );

      const result = await getPalette('deleted-palette');

      expect(result).toEqual({ kind: 'forbidden' });
    });
  });

  describe('listPalettes', () => {
    it('returns palettes with IDs in URLs', async () => {
      mockGetDocuments.mockResolvedValueOnce({
        docs: [
          mockSnapshot('p1', {
            name: 'Palette 1',
            url: '/p/red-ff0000',
            userId: 'user-1',
            isFavorite: false,
          }),
        ],
      });

      const result = await listPalettes('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].url).toBe('/p/red-ff0000?name=Palette+1&id=p1');
    });
  });

  describe('updatePalette', () => {
    it('calls updateDoc with data and serverTimestamp', async () => {
      mockUpdateDocument.mockResolvedValueOnce(undefined);
      mockGetDocument.mockResolvedValueOnce(
        mockSnapshot('palette-1', {
          name: 'Updated',
          url: '/p/red-ff0000',
          userId: 'user-1',
          isFavorite: false,
        }),
      );

      const result = await updatePalette('palette-1', { name: 'Updated' });

      expect(mockUpdateDocument).toHaveBeenCalledWith('doc-ref-palette-1', {
        name: 'Updated',
        updatedAt: 'SERVER_TIMESTAMP',
      });
      expect(result.url).toBe('/p/red-ff0000?name=Updated&id=palette-1');
    });

    it('handles isFavorite update', async () => {
      mockUpdateDocument.mockResolvedValueOnce(undefined);
      mockGetDocument.mockResolvedValueOnce(
        mockSnapshot('palette-1', {
          name: 'My Palette',
          url: '/p/red-ff0000',
          userId: 'user-1',
          isFavorite: true,
        }),
      );

      await updatePalette('palette-1', { isFavorite: true });

      expect(mockUpdateDocument).toHaveBeenCalledWith('doc-ref-palette-1', {
        isFavorite: true,
        updatedAt: 'SERVER_TIMESTAMP',
      });
    });
  });

  describe('migratePaletteUrl', () => {
    it('patches only the url field, no updatedAt', async () => {
      mockUpdateDocument.mockResolvedValueOnce(undefined);

      await migratePaletteUrl('palette-1', '/p/Primary-63.27_0.254_19.9');

      expect(mockUpdateDocument).toHaveBeenCalledWith('doc-ref-palette-1', {
        url: '/p/Primary-63.27_0.254_19.9',
      });
      expect(mockGetDocument).not.toHaveBeenCalled();
    });
  });
});
