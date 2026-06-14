import { createGeneratorStore } from '~/stores/generatorStore';

function setup() {
  const store = createGeneratorStore();
  const ids = store.getState().colors.map(color => color.id);

  return { ids, store };
}

describe('stores/generatorStore', () => {
  describe('chart visibility', () => {
    it('starts with no open charts', () => {
      const { store } = setup();

      expect(store.getState().chartColorIds.size).toBe(0);
    });

    describe('toggleChart', () => {
      it('opens then closes a single chart', () => {
        const { ids, store } = setup();

        store.getState().toggleChart(ids[0]);
        expect(store.getState().chartColorIds.has(ids[0])).toBe(true);

        store.getState().toggleChart(ids[0]);
        expect(store.getState().chartColorIds.has(ids[0])).toBe(false);
      });

      it('does not affect other colors', () => {
        const { store } = setup();

        store.getState().addColor('oklch(60% 0.2 30)' as never);

        const [first, second] = store.getState().colors.map(color => color.id);

        store.getState().toggleChart(first);

        expect(store.getState().chartColorIds.has(first)).toBe(true);
        expect(store.getState().chartColorIds.has(second)).toBe(false);
      });
    });

    describe('setAllCharts', () => {
      it('opens every color when true', () => {
        const { store } = setup();

        store.getState().addColor('oklch(60% 0.2 30)' as never);
        store.getState().setAllCharts(true);

        const { chartColorIds, colors } = store.getState();

        expect(chartColorIds.size).toBe(colors.length);
        colors.forEach(color => expect(chartColorIds.has(color.id)).toBe(true));
      });

      it('closes every color when false', () => {
        const { ids, store } = setup();

        store.getState().toggleChart(ids[0]);
        store.getState().setAllCharts(false);

        expect(store.getState().chartColorIds.size).toBe(0);
      });
    });

    describe('removeColor', () => {
      it('prunes the removed color from the open set', () => {
        const { store } = setup();

        store.getState().addColor('oklch(60% 0.2 30)' as never);
        store.getState().setAllCharts(true);

        const removedId = store.getState().colors[1].id;

        store.getState().removeColor(1);

        expect(store.getState().chartColorIds.has(removedId)).toBe(false);
      });
    });
  });
});
