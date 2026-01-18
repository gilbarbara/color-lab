import { formatDate } from '~/utils/date';

describe('utils/date', () => {
  describe('formatDate', () => {
    it('formats an ISO date string', () => {
      const result = formatDate('2024-03-15T10:30:00.000Z');

      expect(result).toMatch(/Mar/);
      expect(result).toMatch(/15/);
      expect(result).toMatch(/2024/);
    });

    it('formats a different date', () => {
      const result = formatDate('2023-12-25T12:00:00.000Z');

      expect(result).toMatch(/Dec/);
      expect(result).toMatch(/25/);
      expect(result).toMatch(/2023/);
    });
  });
});
