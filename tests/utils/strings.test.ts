import { createElement, Fragment } from 'react';

import { getTextFromNode } from '~/utils/strings';

describe('utils/strings', () => {
  describe('getTextFromNode', () => {
    it('returns strings unchanged', () => {
      expect(getTextFromNode('hello')).toBe('hello');
    });

    it('stringifies numbers', () => {
      expect(getTextFromNode(0)).toBe('0');
      expect(getTextFromNode(42)).toBe('42');
    });

    it('concatenates array children', () => {
      expect(getTextFromNode(['a', 1, 'b'])).toBe('a1b');
    });

    it('recurses into element children', () => {
      const node = createElement('span', null, 'inner');

      expect(getTextFromNode(node)).toBe('inner');
    });

    it('recurses into nested elements and arrays', () => {
      const node = createElement('div', null, 'a', createElement('strong', null, 'b'), [
        'c',
        createElement('em', null, 'd'),
      ]);

      expect(getTextFromNode(node)).toBe('abcd');
    });

    it('returns empty string for nullish and boolean nodes', () => {
      expect(getTextFromNode(null)).toBe('');
      expect(getTextFromNode(undefined)).toBe('');
      expect(getTextFromNode(true)).toBe('');
      expect(getTextFromNode(false)).toBe('');
    });

    it('returns empty string for an element without children', () => {
      expect(getTextFromNode(createElement('br'))).toBe('');
    });

    it('returns empty string for an empty fragment', () => {
      expect(getTextFromNode(createElement(Fragment))).toBe('');
    });
  });
});
