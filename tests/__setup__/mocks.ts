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

beforeEach(() => {
  uuidCounter = 0;
  mockIsP3Supported.mockReturnValue(true);
});

export const mockClipboard: { writeText: ReturnType<typeof vi.fn> } = {
  writeText: vi.fn(),
};

Object.assign(navigator, { clipboard: mockClipboard });
