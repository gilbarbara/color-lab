export const mockAddToast = vi.fn<(...arguments_: unknown[]) => void>();

vi.mock('@heroui/react', async importOriginal => {
  const actual = await importOriginal<typeof import('@heroui/react')>();

  return {
    ...actual,
    addToast: (...arguments_: unknown[]) => mockAddToast(...arguments_),
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
});

export const mockClipboard: { writeText: ReturnType<typeof vi.fn> } = {
  writeText: vi.fn(),
};

Object.assign(navigator, { clipboard: mockClipboard });
