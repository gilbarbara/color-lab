import { EyeIcon } from '@phosphor-icons/react';

import useApp from '~/hooks/useApp';
import usePalette from '~/hooks/usePalette';

import Button, { type ButtonProps } from '~/components/Button';
import Tooltip from '~/components/Tooltip';

interface PreviewButtonProps {
  id: string;
  variant?: ButtonProps['variant'];
}

export default function PreviewButton(props: PreviewButtonProps) {
  const { id, variant = 'flat' } = props;
  const { setActiveColor, setPreviewColor } = usePalette('setActiveColor', 'setPreviewColor');
  const { requestPreviewScroll, togglePreview } = useApp('requestPreviewScroll', 'togglePreview');

  return (
    <Tooltip content="View Live Preview" placement="bottom">
      <Button
        aria-label="View Live Preview"
        isIconOnly
        onPress={() => {
          setActiveColor(id);
          setPreviewColor(id);
          togglePreview(true);
          requestPreviewScroll();
        }}
        size="menu"
        variant={variant}
      >
        <EyeIcon className="text-lg" />
      </Button>
    </Tooltip>
  );
}
