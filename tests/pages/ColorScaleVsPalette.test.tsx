import { render, screen } from '~/test-utils';

import ColorScaleVsPalette from '../../app/color-scale-vs-palette/ColorScaleVsPalette';

describe('pages/ColorScaleVsPalette', () => {
  it('renders correctly', () => {
    render(<ColorScaleVsPalette />);

    expect(screen.getByTestId('ColorScaleVsPalette')).toMatchSnapshot();
  });
});
