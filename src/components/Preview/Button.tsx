import { EyeIcon } from '@phosphor-icons/react';

import usePalette from '~/hooks/usePalette';
import { useAppStore } from '~/stores/appStore';

import Button, { type ButtonProps } from '~/components/Button';
import Tooltip from '~/components/Tooltip';

interface PreviewButtonProps {
  id: string;
  variant?: ButtonProps['variant'];
}

export default function PreviewButton(props: PreviewButtonProps) {
  const { id, variant = 'flat' } = props;
  const { setActiveColor, setPreviewColor } = usePalette();
  const { requestPreviewScroll, togglePreview } = useAppStore();

  return (
    <Tooltip content="View Live Preview" placement="bottom">
      <Button
        aria-label="View Live Preview"
        className="text-base"
        isIconOnly
        onPress={() => {
          setActiveColor(id);
          setPreviewColor(id);
          togglePreview(true);
          requestPreviewScroll();
        }}
        size="sm"
        variant={variant}
      >
        <EyeIcon />
      </Button>
    </Tooltip>
  );
}
