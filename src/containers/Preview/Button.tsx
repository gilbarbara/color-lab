import { EyeIcon } from '@phosphor-icons/react';

import useApp from '~/hooks/useApp';
import useGenerator from '~/hooks/useGenerator';

import Button, { type ButtonProps } from '~/components/Button';
import Tooltip from '~/components/Tooltip';

interface PreviewButtonProps {
  id: string;
  onPreview?: () => void;
  variant?: ButtonProps['variant'];
}

export default function PreviewButton(props: PreviewButtonProps) {
  const { id, onPreview, variant = 'flat' } = props;
  const { setActiveColor, setPreviewColor } = useGenerator('setActiveColor', 'setPreviewColor');
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
          onPreview?.();
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
