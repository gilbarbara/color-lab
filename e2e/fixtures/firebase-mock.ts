/* eslint-disable sonarjs/cognitive-complexity */
import type { Page } from '@playwright/test';

const PROJECT_ID = 'colormeup-485618';
const FIRESTORE_BASE = `projects/${PROJECT_ID}/databases/(default)/documents`;

interface MockPalette {
  createdAt: string;
  id: string;
  isFavorite: boolean;
  name: string;
  updatedAt: string;
  url: string;
  userId: string;
}

interface MockUser {
  displayName: string;
  email: string;
  emailVerified: boolean;
  localId: string;
}

export class FirebaseMockState {
  palettes: MockPalette[] = [];
  user: MockUser | null = null;

  private idToken = 'mock-id-token';
  private refreshToken = 'mock-refresh-token';

  addPalette(data: { id?: string; name: string; url: string }) {
    const palette: MockPalette = {
      id: data.id ?? `palette-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: this.user!.localId,
      name: data.name,
      url: data.url,
      isFavorite: false,
    };

    this.palettes.push(palette);

    return palette;
  }

  deletePalette(id: string) {
    this.palettes = this.palettes.filter(p => p.id !== id);
  }

  logout() {
    this.user = null;
  }

  setAuthenticated() {
    this.user = {
      localId: 'mock-user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      emailVerified: true,
    };
  }

  updatePalette(id: string, data: Partial<MockPalette>) {
    const palette = this.palettes.find(p => p.id === id);

    if (palette) {
      Object.assign(palette, data, { updatedAt: new Date().toISOString() });
    }

    return palette;
  }

  getAuthResponse() {
    return {
      localId: this.user!.localId,
      email: this.user!.email,
      displayName: this.user!.displayName,
      idToken: this.idToken,
      refreshToken: this.refreshToken,
      expiresIn: '3600',
      registered: true,
    };
  }

  getTokenResponse() {
    return {
      access_token: this.idToken,
      expires_in: '3600',
      token_type: 'Bearer',
      refresh_token: this.refreshToken,
      id_token: this.idToken,
      user_id: this.user?.localId ?? '',
      project_id: PROJECT_ID,
    };
  }

  getLookupResponse() {
    if (!this.user) {
      return { users: [] };
    }

    return {
      users: [
        {
          localId: this.user.localId,
          email: this.user.email,
          displayName: this.user.displayName,
          emailVerified: this.user.emailVerified,
          providerUserInfo: [{ providerId: 'password' }],
        },
      ],
    };
  }
}

function extractPaletteIdFromCommit(body: Record<string, unknown>): {
  data: Record<string, unknown> | null;
  id: string | null;
  operation: 'create' | 'update' | 'delete' | null;
} {
  const writes = (body.writes as Array<Record<string, unknown>>) ?? [];

  for (const write of writes) {
    // Delete operation
    if (write.delete) {
      const path = write.delete as string;
      const match = path.match(/palettes\/([^/]+)$/);

      return { id: match?.[1] ?? null, operation: 'delete', data: null };
    }

    // Create or update
    const update = write.update as Record<string, unknown> | undefined;

    if (update) {
      const name = update.name as string | undefined;
      const fields = update.fields as Record<string, Record<string, unknown>> | undefined;

      // Extract ID from document path
      const match = name?.match(/palettes\/([^/]+)$/);
      const id = match?.[1] ?? null;

      // Extract field values
      const data: Record<string, unknown> = {};

      if (fields) {
        for (const [key, value] of Object.entries(fields)) {
          if ('stringValue' in value) data[key] = value.stringValue;
          else if ('booleanValue' in value) data[key] = value.booleanValue;
          else if ('timestampValue' in value) data[key] = value.timestampValue;
        }
      }

      // Determine create vs update: creates have all palette fields, updates are partial
      const isCreate = data.userId !== undefined;

      return {
        id,
        operation: isCreate ? 'create' : 'update',
        data,
      };
    }
  }

  return { id: null, operation: null, data: null };
}

function toFirestoreDocument(palette: MockPalette) {
  return {
    name: `${FIRESTORE_BASE}/palettes/${palette.id}`,
    fields: {
      name: { stringValue: palette.name },
      url: { stringValue: palette.url },
      userId: { stringValue: palette.userId },
      isFavorite: { booleanValue: palette.isFavorite },
      createdAt: { timestampValue: palette.createdAt },
      updatedAt: { timestampValue: palette.updatedAt },
    },
    createTime: palette.createdAt,
    updateTime: palette.updatedAt,
  };
}

export async function setupFirebaseMocks(page: Page, state: FirebaseMockState) {
  // Firebase Auth
  await page.route('https://identitytoolkit.googleapis.com/**', async route => {
    const url = route.request().url();

    // Email/password sign-in
    if (url.includes(':signInWithPassword')) {
      state.setAuthenticated();

      return route.fulfill({ json: state.getAuthResponse() });
    }

    // User lookup (called by onAuthStateChanged internals)
    if (url.includes(':lookup')) {
      return route.fulfill({ json: state.getLookupResponse() });
    }

    // Sign up
    if (url.includes(':signUp')) {
      state.setAuthenticated();

      return route.fulfill({ json: state.getAuthResponse() });
    }

    return route.continue();
  });

  // Token refresh
  await page.route('https://securetoken.googleapis.com/**', async route => {
    if (state.user) {
      return route.fulfill({ json: state.getTokenResponse() });
    }

    return route.fulfill({ status: 400, json: { error: { message: 'TOKEN_EXPIRED' } } });
  });

  // Firestore
  await page.route('https://firestore.googleapis.com/**', async route => {
    const url = route.request().url();
    const method = route.request().method();

    // RunQuery (listPalettes)
    if (url.includes(':runQuery') && method === 'POST') {
      const documents = state.palettes.map(p => ({
        document: toFirestoreDocument(p),
        readTime: new Date().toISOString(),
      }));

      return route.fulfill({
        json: documents.length > 0 ? documents : [{ readTime: new Date().toISOString() }],
      });
    }

    // BatchGet (getPalette)
    if (url.includes(':batchGet') && method === 'POST') {
      const body = route.request().postDataJSON();
      const documents = (body.documents as string[]) ?? [];
      const results = documents.map(documentPath => {
        const id = documentPath.split('/').pop()!;
        const palette = state.palettes.find(p => p.id === id);

        if (palette) {
          return { found: toFirestoreDocument(palette), readTime: new Date().toISOString() };
        }

        return { missing: { name: documentPath }, readTime: new Date().toISOString() };
      });

      return route.fulfill({ json: results });
    }

    // Commit (create, update, delete)
    if (url.includes(':commit') && method === 'POST') {
      const body = route.request().postDataJSON();
      const { data, id, operation } = extractPaletteIdFromCommit(body);

      if (operation === 'create' && data) {
        const palette = state.addPalette({
          id: id ?? undefined,
          name: data.name as string,
          url: data.url as string,
        });

        return route.fulfill({
          json: {
            writeResults: [{ updateTime: palette.updatedAt }],
            commitTime: palette.createdAt,
          },
        });
      }

      if (operation === 'update' && id && data) {
        const updateData: Partial<MockPalette> = {};

        if ('name' in data) updateData.name = data.name as string;
        if ('url' in data) updateData.url = data.url as string;
        if ('isFavorite' in data) updateData.isFavorite = data.isFavorite as boolean;

        const palette = state.updatePalette(id, updateData);

        return route.fulfill({
          json: {
            writeResults: [{ updateTime: palette?.updatedAt ?? new Date().toISOString() }],
            commitTime: new Date().toISOString(),
          },
        });
      }

      if (operation === 'delete' && id) {
        state.deletePalette(id);

        return route.fulfill({
          json: {
            writeResults: [{ updateTime: new Date().toISOString() }],
            commitTime: new Date().toISOString(),
          },
        });
      }

      // Fallback for unrecognized commits
      return route.fulfill({
        json: {
          writeResults: [{ updateTime: new Date().toISOString() }],
          commitTime: new Date().toISOString(),
        },
      });
    }

    return route.continue();
  });
}
