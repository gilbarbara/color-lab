import {
  CONTRAST_HOOK_COLOR,
  findBoundaryFlip,
  findCusp,
  findFlip,
  getDisagreementBand,
  getGamutRange,
  getMaxChroma,
  pickText,
  toOklchCSS,
} from '../../../app/apca-vs-wcag/utils';

const HUES = [0, 20, 60, 140, 200, 250, 300];

describe('pages/ApcaVsWcag/utils', () => {
  describe('pickText', () => {
    it('picks black for WCAG and white for APCA on the hook color', () => {
      const pick = pickText(CONTRAST_HOOK_COLOR);

      expect(pick.wcag).toBe('black');
      expect(pick.apca).toBe('white');
      expect(pick.wcagRatio).toEqual({ black: 5.34, white: 3.94 });
      expect(pick.apcaLc.black).toBeCloseTo(40.33, 1);
      expect(pick.apcaLc.white).toBeCloseTo(69.24, 1);
    });

    it.each([
      ['#000000', 'white'],
      ['#ffffff', 'black'],
    ])('agrees on %s', (background, expected) => {
      const pick = pickText(background);

      expect(pick.wcag).toBe(expected);
      expect(pick.apca).toBe(expected);
    });
  });

  describe('getMaxChroma', () => {
    it('returns the P3 edge', () => {
      // Past sRGB (max ≈ 0.105) at this lightness, inside P3.
      expect(getMaxChroma(0.62, 200)).toBeCloseTo(0.141, 3);
    });
  });

  describe('toOklchCSS', () => {
    it('keeps full precision', () => {
      expect(toOklchCSS({ l: 0.6327, c: 0.25404, h: 19.9 })).toBe('oklch(0.6327 0.25404 19.9)');
    });
  });

  describe('getGamutRange', () => {
    it('returns the full window for neutrals', () => {
      const range = getGamutRange(0, 0);

      expect(range?.[0]).toBeCloseTo(0.3, 5);
      expect(range?.[1]).toBeCloseTo(1, 5);
    });

    it('returns null above the cusp', () => {
      expect(getGamutRange(0.4, 200)).toBeNull();
    });
  });

  describe('findFlip', () => {
    it.each(HUES)('flips neutrals at the same lightness for hue %s', hue => {
      const wcag = findFlip(0, hue, 'wcag');
      const apca = findFlip(0, hue, 'apca');

      expect(wcag).toBeGreaterThan(0.55);
      expect(wcag).toBeLessThan(0.59);
      expect(apca).toBeGreaterThan(0.69);
      expect(apca).toBeLessThan(0.74);
    });

    it('returns null when the row has no colors in P3', () => {
      expect(findFlip(0.4, 200, 'wcag')).toBeNull();
    });

    it('flips once along lightness', () => {
      for (const hue of HUES) {
        for (const c of [0, 0.05, 0.1]) {
          const range = getGamutRange(c, hue);

          if (!range) continue;

          const flips = { apca: 0, wcag: 0 };
          let previous: ReturnType<typeof pickText> | null = null;

          for (let l = range[0]; l <= range[1]; l += 0.002) {
            const pick = pickText(toOklchCSS({ l, c, h: hue }));

            if (previous && previous.wcag !== pick.wcag) flips.wcag++;
            if (previous && previous.apca !== pick.apca) flips.apca++;

            previous = pick;
          }

          // Zero is valid: a high-chroma row can start above the flip.
          expect(flips.wcag).toBeLessThanOrEqual(1);
          expect(flips.apca).toBeLessThanOrEqual(1);
        }
      }
    });
  });

  describe('findBoundaryFlip', () => {
    it.each(HUES)('finds both flips on the P3 edge for hue %s', hue => {
      const wcag = findBoundaryFlip(hue, 'wcag')!;
      const apca = findBoundaryFlip(hue, 'apca')!;

      expect(wcag.c).toBeCloseTo(getMaxChroma(wcag.l, hue), 6);
      expect(apca.c).toBeCloseTo(getMaxChroma(apca.l, hue), 6);
      expect(wcag.l).toBeLessThan(apca.l);
    });

    it.each(HUES)('switches the pick across the edge point for hue %s', hue => {
      const onEdge = (l: number) => pickText(toOklchCSS({ l, c: getMaxChroma(l, hue), h: hue }));

      for (const method of ['wcag', 'apca'] as const) {
        const { l } = findBoundaryFlip(hue, method)!;

        expect(onEdge(l - 0.005)[method]).toBe('white');
        expect(onEdge(l + 0.005)[method]).toBe('black');
      }
    });
  });

  describe('findCusp', () => {
    it.each(HUES)('returns the most chroma for hue %s', hue => {
      const cusp = findCusp(hue);

      expect(cusp.c).toBeGreaterThanOrEqual(getMaxChroma(cusp.l - 0.01, hue));
      expect(cusp.c).toBeGreaterThanOrEqual(getMaxChroma(cusp.l + 0.01, hue));
    });

    it.each([
      [250, true],
      [270, false],
    ])('sits between the edge points for hue %s: %s', (hue, expected) => {
      const { cusp, edges } = getDisagreementBand(hue, 12);
      const between = edges.wcag!.l < cusp.l && cusp.l < edges.apca!.l;

      expect(between).toBe(expected);
    });
  });

  describe('getDisagreementBand', () => {
    it('returns the edge points with the rows', () => {
      const { cusp, edges } = getDisagreementBand(100, 12);

      expect(cusp).toEqual(findCusp(100));
      expect(edges).toEqual({
        apca: findBoundaryFlip(100, 'apca'),
        wcag: findBoundaryFlip(100, 'wcag'),
      });
    });

    it.each(HUES)('places WCAG below APCA on every row for hue %s', hue => {
      const { rows } = getDisagreementBand(hue, 12);

      expect(rows.length).toBeGreaterThan(0);

      const bothEdges = rows.filter(row => row.wcag !== null && row.apca !== null);
      const banded = rows.flatMap(row => (row.band ? [row.band] : []));

      expect(bothEdges.length).toBeGreaterThan(0);
      expect(bothEdges.every(row => row.wcag! < row.apca!)).toBe(true);
      expect(banded.every(([start, end]) => start < end)).toBe(true);
    });

    it('disagrees inside the band and agrees outside it', () => {
      const [neutral] = getDisagreementBand(20, 12).rows;
      const [start, end] = neutral.band!;
      const at = (l: number) => pickText(toOklchCSS({ l, c: 0, h: 20 }));

      expect(at((start + end) / 2)).toMatchObject({ wcag: 'black', apca: 'white' });
      expect(at(start - 0.01)).toMatchObject({ wcag: 'white', apca: 'white' });
      expect(at(end + 0.01)).toMatchObject({ wcag: 'black', apca: 'black' });
    });

    it('leans toward higher lightness as chroma rises', () => {
      const rows = getDisagreementBand(20, 12).rows.filter(row => row.wcag !== null);

      expect(rows.at(-1)!.wcag).toBeGreaterThan(rows[0].wcag!);
    });
  });
});
