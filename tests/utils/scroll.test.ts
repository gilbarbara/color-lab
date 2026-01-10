import { scrollToSelector } from '~/utils/scroll';

describe('utils/scroll', () => {
  const mockScrollIntoView = vi.fn();

  beforeEach(() => {
    mockScrollIntoView.mockClear();
  });

  describe('scrollToSelector', () => {
    it('scrolls to element when id is provided and element exists', () => {
      const element = document.createElement('div');

      element.id = 'test-element';
      element.scrollIntoView = mockScrollIntoView;
      document.body.appendChild(element);

      scrollToSelector('test-element');

      expect(mockScrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start',
      });

      document.body.removeChild(element);
    });

    it('does nothing when id is undefined', () => {
      scrollToSelector(undefined);

      expect(mockScrollIntoView).not.toHaveBeenCalled();
    });

    it('does nothing when id is empty string', () => {
      scrollToSelector('');

      expect(mockScrollIntoView).not.toHaveBeenCalled();
    });

    it('does nothing when element does not exist', () => {
      scrollToSelector('non-existent-element');

      expect(mockScrollIntoView).not.toHaveBeenCalled();
    });
  });
});
