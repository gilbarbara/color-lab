import { createColorEntry, CRIMSON } from '~/test-fixtures';
import { render, screen } from '~/test-utils';
import { getDefaultGlobalOptions } from '~/utils/generator';

import Scale from '~/containers/Palette/Scale';

describe('Scale', () => {
  const colorEntry = createColorEntry('Primary', CRIMSON);

  it('renders correctly', () => {
    render(<Scale colorEntry={colorEntry} options={getDefaultGlobalOptions(CRIMSON)} />);

    expect(screen.getByTestId('Scale')).toMatchSnapshot();
  });
});
