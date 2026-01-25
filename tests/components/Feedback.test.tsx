import { render } from '@testing-library/react';

import Feedback from '~/components/Feedback';

describe('Feedback', () => {
  describe('Render', () => {
    it('renders "empty" type (default)', () => {
      const { container } = render(<Feedback />);

      expect(container).toMatchSnapshot();
    });

    it('renders "error" type', () => {
      const { container } = render(<Feedback type="error" />);

      expect(container).toMatchSnapshot();
    });

    it('renders "forbidden" type', () => {
      const { container } = render(<Feedback type="forbidden" />);

      expect(container).toMatchSnapshot();
    });

    it('renders "no-results" type', () => {
      const { container } = render(<Feedback type="no-results" />);

      expect(container).toMatchSnapshot();
    });

    it('renders "not-found" type', () => {
      const { container } = render(<Feedback type="not-found" />);

      expect(container).toMatchSnapshot();
    });

    it('renders "success" type', () => {
      const { container } = render(<Feedback type="not-found" />);

      expect(container).toMatchSnapshot();
    });

    it('renders small size', () => {
      const { container } = render(<Feedback size="sm" />);

      expect(container).toMatchSnapshot();
    });

    it('renders large size', () => {
      const { container } = render(<Feedback size="lg" />);

      expect(container).toMatchSnapshot();
    });

    it('renders with custom content', () => {
      const { container } = render(
        <Feedback
          description="Custom description text"
          icon={<span data-testid="custom-icon">Custom Icon</span>}
          title="Custom Title"
          type={null}
        />,
      );

      expect(container).toMatchSnapshot();
    });

    it('renders with hidden icon', () => {
      const { container } = render(<Feedback hideIcon type="error" />);

      expect(container).toMatchSnapshot();
    });

    it('renders with children', () => {
      const { container } = render(
        <Feedback type="empty">
          <button type="button">Action Button</button>
        </Feedback>,
      );

      expect(container).toMatchSnapshot();
    });
  });
});
