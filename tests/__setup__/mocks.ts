export const mockAddToast = vi.fn<(...arguments_: unknown[]) => void>();

vi.mock('@heroui/react', async importOriginal => {
  const actual = await importOriginal<typeof import('@heroui/react')>();

  return {
    ...actual,
    addToast: (...arguments_: unknown[]) => mockAddToast(...arguments_),
  };
});

export const mockClipboard: { writeText: ReturnType<typeof vi.fn> } = {
  writeText: vi.fn(),
};

Object.assign(navigator, { clipboard: mockClipboard });
