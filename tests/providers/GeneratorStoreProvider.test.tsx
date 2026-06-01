import { useContext } from 'react';
import { render } from '@testing-library/react';

import GeneratorStoreProvider, { GeneratorStoreContext } from '~/providers/GeneratorStoreProvider';
import { type GeneratorStoreApi } from '~/stores/generatorStore';
import { createTestPalette } from '~/test-fixtures';
import { setMockRoute } from '~/test-mocks';
import { parsePaletteFromUrl, serializePaletteToUrl } from '~/utils/url';

// The global setup mocks GeneratorStoreProvider to a passthrough; this suite needs
// the real one to exercise its URL-vs-fallback initialization.
vi.unmock('~/providers/GeneratorStoreProvider');

let captured: GeneratorStoreApi | null = null;

function Probe() {
  // Read the store straight from context: useGenerator/useGeneratorStore are mocked
  // to a singleton in the global setup and would bypass the provider's store.
  captured = useContext(GeneratorStoreContext);

  return null;
}

function renderProvider(fallbackPalette = createTestPalette(1)) {
  return render(
    <GeneratorStoreProvider fallbackPalette={fallbackPalette}>
      <Probe />
    </GeneratorStoreProvider>,
  );
}

describe('GeneratorStoreProvider', () => {
  beforeEach(() => {
    captured = null;
    setMockRoute('/');
  });

  it('initializes the store from the URL on /p/* routes', () => {
    const url = serializePaletteToUrl(createTestPalette(2));
    const parsed = parsePaletteFromUrl(url);

    expect(parsed).not.toBeNull();
    setMockRoute(url);

    renderProvider();

    expect(captured?.getState().colors).toEqual(parsed?.state.colors);
  });

  it('initializes the store from fallbackPalette off /p/* routes', () => {
    const fallback = createTestPalette(3);

    setMockRoute('/');
    renderProvider(fallback);

    expect(captured?.getState().colors).toEqual(fallback.colors);
  });

  it('keeps the same store instance across re-renders', () => {
    const { rerender } = renderProvider();
    const first = captured;

    rerender(
      <GeneratorStoreProvider fallbackPalette={createTestPalette(1)}>
        <Probe />
      </GeneratorStoreProvider>,
    );

    expect(captured).toBe(first);
  });
});
