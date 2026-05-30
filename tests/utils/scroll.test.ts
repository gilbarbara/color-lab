import { animate } from 'framer-motion';

import { scrollToSelector } from '~/utils/scroll';

vi.mock('framer-motion', () => ({
  animate: vi.fn(),
}));

const mockAnimate = vi.mocked(animate);

function setup(options: {
  containerTop?: number;
  scrollTop?: number;
  targetId?: string;
  targetTop?: number;
}) {
  const { containerTop = 0, scrollTop = 0, targetId = 'target', targetTop = 0 } = options;

  const container = document.createElement('div');
  const target = document.createElement('div');

  target.id = targetId;
  container.appendChild(target);
  document.body.appendChild(container);

  // jsdom does not implement layout or scrolling, so stub the pieces the
  // implementation reads/writes.
  Object.defineProperty(container, 'scrollTop', { configurable: true, value: scrollTop });
  vi.spyOn(container, 'scrollTo').mockImplementation(() => {});
  vi.spyOn(container, 'getBoundingClientRect').mockImplementation(
    () => ({ top: containerTop }) as DOMRect,
  );
  vi.spyOn(target, 'getBoundingClientRect').mockImplementation(
    () => ({ top: targetTop }) as DOMRect,
  );

  return { container, target };
}

describe('utils/scroll', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('scrollToSelector', () => {
    describe('without a container (document scroll)', () => {
      const mockScrollIntoView = vi.fn();

      function appendElement(id: string) {
        const element = document.createElement('div');

        element.id = id;
        element.scrollIntoView = mockScrollIntoView;
        document.body.appendChild(element);

        return element;
      }

      it('scrolls the matching element into view', () => {
        appendElement('test-element');

        scrollToSelector('test-element');

        expect(mockScrollIntoView).toHaveBeenCalledWith({
          behavior: 'smooth',
          block: 'start',
        });
      });

      it('does nothing when id is undefined', () => {
        scrollToSelector(undefined);

        expect(mockScrollIntoView).not.toHaveBeenCalled();
      });

      it('does nothing when id is an empty string', () => {
        scrollToSelector('');

        expect(mockScrollIntoView).not.toHaveBeenCalled();
      });

      it('does nothing when the element does not exist', () => {
        scrollToSelector('non-existent-element');

        expect(mockScrollIntoView).not.toHaveBeenCalled();
      });

      it('does not run the container animation', () => {
        appendElement('test-element');

        scrollToSelector('test-element');

        expect(mockAnimate).not.toHaveBeenCalled();
      });
    });

    describe('with a container (animated scroll)', () => {
      it('animates from scrollTop to the target offset', () => {
        const { container } = setup({ scrollTop: 100, containerTop: 50, targetTop: 300 });

        scrollToSelector('target', container);

        // start (100) + delta (300 - 50) - offset (0)
        expect(mockAnimate).toHaveBeenCalledWith(100, 350, {
          duration: 0.4,
          ease: 'easeInOut',
          onUpdate: expect.any(Function),
        });
      });

      it('subtracts the offset from the destination', () => {
        const { container } = setup({ scrollTop: 100, containerTop: 50, targetTop: 300 });

        scrollToSelector('target', container, 80);

        // start (100), destination 100 + (300 - 50) - 80
        expect(mockAnimate).toHaveBeenCalledWith(100, 270, expect.anything());
      });

      it('drives container.scrollTo through the onUpdate callback', () => {
        const { container } = setup({});

        scrollToSelector('target', container);

        const { onUpdate } = mockAnimate.mock.calls[0][2] as { onUpdate: (y: number) => void };

        onUpdate(42);

        expect(container.scrollTo).toHaveBeenCalledWith(0, 42);
      });

      it('escapes ids that are not valid CSS selectors', () => {
        const { container } = setup({ targetId: 'color:1.2' });

        scrollToSelector('color:1.2', container);

        expect(mockAnimate).toHaveBeenCalledOnce();
      });

      it('does nothing when id is undefined', () => {
        const { container } = setup({});

        scrollToSelector(undefined, container);

        expect(mockAnimate).not.toHaveBeenCalled();
      });

      it('does nothing when no descendant matches the id', () => {
        const { container } = setup({ targetId: 'target' });

        scrollToSelector('missing', container);

        expect(mockAnimate).not.toHaveBeenCalled();
      });

      it('does not fall back to document scroll when the container has no match', () => {
        const documentElement = document.createElement('div');
        const mockScrollIntoView = vi.fn();

        documentElement.id = 'missing';
        documentElement.scrollIntoView = mockScrollIntoView;
        document.body.appendChild(documentElement);

        const { container } = setup({ targetId: 'target' });

        scrollToSelector('missing', container);

        expect(mockAnimate).not.toHaveBeenCalled();
        expect(mockScrollIntoView).not.toHaveBeenCalled();
      });
    });
  });
});
