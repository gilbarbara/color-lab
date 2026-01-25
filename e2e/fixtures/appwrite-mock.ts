import type { Page } from '@playwright/test';

const APPWRITE_API = 'https://nyc.cloud.appwrite.io/v1';
const DATABASE_ID = 'color-lab';
const TABLE_ID = 'palettes';

interface MockPalette {
  $createdAt: string;
  $databaseId: string;
  $id: string;
  $permissions: string[];
  $sequence: number;
  $tableId: string;
  $updatedAt: string;
  isFavorite: boolean;
  name: string;
  url: string;
  userId: string;
}

interface MockSession {
  $id: string;
  provider: string;
  providerAccessToken: string;
  userId: string;
}

interface MockUser {
  $createdAt: string;
  $id: string;
  $updatedAt: string;
  email: string;
  emailVerification: boolean;
  name: string;
  prefs: Record<string, unknown>;
}

export class AppwriteMockState {
  palettes: MockPalette[] = [];
  session: MockSession | null = null;
  user: MockUser | null = null;

  addPalette(data: { name: string; url: string }) {
    const palette: MockPalette = {
      $id: `palette-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      $databaseId: DATABASE_ID,
      $tableId: TABLE_ID,
      $sequence: this.palettes.length + 1,
      $createdAt: new Date().toISOString(),
      $updatedAt: new Date().toISOString(),
      $permissions: [],
      userId: this.user!.$id,
      name: data.name,
      url: data.url,
      isFavorite: false,
    };

    this.palettes.push(palette);

    return palette;
  }

  deletePalette(id: string) {
    this.palettes = this.palettes.filter(p => p.$id !== id);
  }

  clearSession() {
    this.session = null;
  }

  logout() {
    this.session = null;
    this.user = null;
  }

  setAuthenticated() {
    this.user = {
      $id: 'mock-user-123',
      $createdAt: new Date().toISOString(),
      $updatedAt: new Date().toISOString(),
      email: 'test@example.com',
      emailVerification: true,
      name: 'Test User',
      prefs: {},
    };
    this.session = {
      $id: 'mock-session-456',
      userId: this.user.$id,
      provider: 'email',
      providerAccessToken: '',
    };
  }

  updatePalette(id: string, data: Partial<MockPalette>) {
    const palette = this.palettes.find(p => p.$id === id);

    if (palette) {
      Object.assign(palette, data, { $updatedAt: new Date().toISOString() });
    }

    return palette;
  }
}

function extractIdFromPath(url: string, prefix: string): string | null {
  try {
    const match = new URL(url).pathname.match(new RegExp(`${prefix}/([^/?]+)`));

    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

// URL matching helpers
function matchesPath(url: string, path: string): boolean {
  try {
    return new URL(url).pathname === `/v1${path}`;
  } catch {
    return false;
  }
}

function matchesPathPrefix(url: string, prefix: string): boolean {
  try {
    return new URL(url).pathname.startsWith(`/v1${prefix}`);
  } catch {
    return false;
  }
}

const PALETTES_PATH = `/tablesdb/${DATABASE_ID}/tables/${TABLE_ID}/rows`;

export async function setupAppwriteMocks(page: Page, state: AppwriteMockState) {
  await page.route(`${APPWRITE_API}/**`, async route => {
    const url = route.request().url();
    const method = route.request().method();

    // Auth: GET /account
    if (matchesPath(url, '/account') && method === 'GET') {
      if (state.user) {
        return route.fulfill({ json: state.user });
      }

      return route.fulfill({ status: 401, json: { message: 'Unauthorized' } });
    }

    // Auth: POST /account/sessions/email (login)
    if (matchesPath(url, '/account/sessions/email') && method === 'POST') {
      state.setAuthenticated();

      return route.fulfill({ json: state.session });
    }

    // Auth: GET /account/sessions/current
    if (matchesPath(url, '/account/sessions/current') && method === 'GET') {
      if (state.session) {
        return route.fulfill({ json: state.session });
      }

      return route.fulfill({ status: 401, json: { message: 'Unauthorized' } });
    }

    // Auth: DELETE /account/sessions/current (logout)
    if (matchesPath(url, '/account/sessions/current') && method === 'DELETE') {
      state.logout();

      return route.fulfill({ status: 204 });
    }

    // Auth: DELETE /account/sessions (delete all sessions)
    if (matchesPath(url, '/account/sessions') && method === 'DELETE') {
      state.clearSession();

      return route.fulfill({ status: 204 });
    }

    // Palettes: GET (list)
    if (matchesPath(url, PALETTES_PATH) && method === 'GET') {
      return route.fulfill({
        json: { total: state.palettes.length, rows: state.palettes },
      });
    }

    // Palettes: POST (create)
    if (matchesPath(url, PALETTES_PATH) && method === 'POST') {
      const body = route.request().postDataJSON();
      const palette = state.addPalette(body.data);

      return route.fulfill({ json: palette });
    }

    // Palettes: PATCH (update)
    if (matchesPathPrefix(url, PALETTES_PATH) && method === 'PATCH') {
      const id = extractIdFromPath(url, PALETTES_PATH);

      if (id) {
        const body = route.request().postDataJSON();
        const palette = state.updatePalette(id, body.data);

        return route.fulfill({ json: palette });
      }
    }

    // Palettes: DELETE
    if (matchesPathPrefix(url, PALETTES_PATH) && method === 'DELETE') {
      const id = extractIdFromPath(url, PALETTES_PATH);

      if (id) {
        state.deletePalette(id);

        return route.fulfill({ status: 204 });
      }
    }

    // Let other requests through
    return route.continue();
  });
}
