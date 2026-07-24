import type { ReactNode } from 'react';

import { REDUCED_MOTION_QUERY } from '~/config/ui';
import type { GeneratorStore, GeneratorStoreApi } from '~/stores/generatorStore';

const navigationMocks = vi.hoisted(() => ({
  pathname: '/',
  searchParams: new URLSearchParams(),
  router: {
    push: vi.fn<(href: string) => void>(),
    replace: vi.fn<(href: string) => void>(),
    back: vi.fn<() => void>(),
    forward: vi.fn<() => void>(),
    refresh: vi.fn<() => void>(),
    prefetch: vi.fn<(href: string) => void>(),
  },
}));

const themeMocks = vi.hoisted(() => ({
  resolvedTheme: 'light' as 'light' | 'dark' | 'system',
  setTheme: vi.fn<(theme: string) => void>(),
}));

// Single shared generator store for all tests. The Next migration replaced the
// global Zustand singleton with a context-scoped factory store (createGeneratorStore)
// read through ~/hooks/useGeneratorStore. There is no module-level singleton to import
// like useAppStore, so tests seed/read state through the `generatorStore` handle
// exported below, while the mocked hook hands components the same instance. The
// provider is reduced to a passthrough so no React context is required in tests.
const generatorStoreHolder = vi.hoisted(() => ({ store: null as GeneratorStoreApi | null }));

vi.mock('~/components/Footer', () => ({
  default: () => null,
}));

vi.mock('~/providers/GeneratorStoreProvider', () => ({
  default: ({ children }: { children: ReactNode }) => children,
}));

vi.mock('~/hooks/useGeneratorStore', async () => {
  const { useStore } = await vi.importActual<typeof import('zustand')>('zustand');
  const actual =
    await vi.importActual<typeof import('~/stores/generatorStore')>('~/stores/generatorStore');

  generatorStoreHolder.store ??= actual.createGeneratorStore();
  const { store } = generatorStoreHolder;

  return {
    default: function useGeneratorStore<T>(selector: (state: GeneratorStore) => T): T {
      return useStore(store, selector);
    },
    useGeneratorStoreApi: () => store,
  };
});

vi.mock('next/navigation', () => ({
  usePathname: () => navigationMocks.pathname,
  useSearchParams: () => navigationMocks.searchParams,
  useRouter: () => navigationMocks.router,
}));

export const mockRouter = navigationMocks.router;

export function setMockRoute(url: string): void {
  const [pathname, search] = url.split('?');

  navigationMocks.pathname = pathname || '/';
  navigationMocks.searchParams = new URLSearchParams(search ?? '');
}

// next-themes' ThemeProvider renders an inline FOUC-prevention <script> into its
// output, which jsdom captures inside the rendered container and pollutes snapshots.
// Replace it with a passthrough and expose the theme as controllable state so tests
// can drive dark mode through the real useTheme hook.
vi.mock('next-themes', () => ({
  ThemeProvider: ({ children }: { children: ReactNode }) => children,
  useTheme: () => ({
    resolvedTheme: themeMocks.resolvedTheme,
    theme: themeMocks.resolvedTheme,
    setTheme: themeMocks.setTheme,
    themes: ['light', 'dark', 'system'],
    systemTheme: 'light',
  }),
}));

export const mockSetTheme = themeMocks.setTheme;

export function setMockTheme(theme: 'light' | 'dark' | 'system'): void {
  themeMocks.resolvedTheme = theme;
}

export const mockAddToast = vi.fn<(...arguments_: unknown[]) => void>();

vi.mock('@heroui/react', async importOriginal => {
  const actual = await importOriginal<typeof import('@heroui/react')>();

  return {
    ...actual,
    addToast: (...arguments_: unknown[]) => mockAddToast(...arguments_),
  };
});

export const mockIsP3Supported = vi.fn<() => boolean>(() => true);

vi.mock('~/utils/gamut', async importOriginal => {
  const actual = await importOriginal<typeof import('~/utils/gamut')>();

  return {
    ...actual,
    isP3Supported: () => mockIsP3Supported(),
    detectInitialGamut: () => (mockIsP3Supported() ? 'p3' : 'srgb'),
  };
});

// `~/utils/gamut` is module-mocked above, so its matchMedia probe never reaches the global
// mock installed in vitest.setup. This helper drives the one query that still does:
// prefersReducedMotion(). Every other query keeps reporting `matches: false`.
export function setReducedMotion(value: boolean): void {
  vi.mocked(window.matchMedia).mockImplementation(
    query =>
      ({
        matches: query === REDUCED_MOTION_QUERY ? value : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as unknown as MediaQueryList,
  );
}

let uuidCounter = 0;
const nextUuid = () => `test-uuid-${++uuidCounter}`;

vi.mock('@gilbarbara/helpers', async importOriginal => {
  const actual = await importOriginal<typeof import('@gilbarbara/helpers')>();

  return { ...actual, uuid: nextUuid };
});

Object.defineProperty(crypto, 'randomUUID', {
  value: nextUuid,
  configurable: true,
  writable: true,
});

// Shared generator store handle for tests. The runtime store is a per-request factory
// (createGeneratorStore) read through ~/hooks/useGeneratorStore, so there is no module-level
// singleton to import like useAppStore. Tests seed/read state through this handle; the
// mocked hook hands components the same instance via generatorStoreHolder. It is created
// lazily (the mocked hook or the beforeEach below populate it) to avoid loading the store
// module — and its @gilbarbara/helpers dependency — before nextUuid is initialized (TDZ).
export function getGeneratorStore(): GeneratorStoreApi {
  if (!generatorStoreHolder.store) {
    throw new Error('generator store not initialized yet — import a generator hook or run a test');
  }

  return generatorStoreHolder.store;
}

beforeEach(async () => {
  uuidCounter = 0;
  mockIsP3Supported.mockReturnValue(true);
  setReducedMotion(false);
  themeMocks.resolvedTheme = 'light';
  themeMocks.setTheme.mockClear();

  // Reset the shared store to a deterministic default before each test (test
  // files seed further in their own beforeEach, which runs after this one).
  // Lazy import: loading fixtures at module top would pull in @gilbarbara/helpers
  // before nextUuid is initialized (TDZ).
  const [{ createTestPalette }, { createGeneratorStore }] = await Promise.all([
    import('~/test-fixtures'),
    import('~/stores/generatorStore'),
  ]);

  generatorStoreHolder.store ??= createGeneratorStore();
  const base = createTestPalette();

  generatorStoreHolder.store.setState({
    ...base,
    activeColorId: base.colors[0].id,
    previewColorId: base.colors[0].id,
  });

  // createTestPalette consumed mocked uuids; reset so each test starts fresh.
  uuidCounter = 0;
});

export const mockClipboard: { writeText: ReturnType<typeof vi.fn> } = {
  writeText: vi.fn(),
};

Object.assign(navigator, { clipboard: mockClipboard });
