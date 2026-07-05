import { EyeIcon } from '@phosphor-icons/react';

import useApp from '~/hooks/useApp';
import useGenerator from '~/hooks/useGenerator';
import { trackEvent } from '~/utils/analytics';

import Button, { type ButtonProps } from '~/components/Button';
import Tooltip from '~/components/Tooltip';

interface PreviewButtonProps {
  id: string;
  onPreview?: () => void;
  source: 'scale' | 'color';
  variant?: ButtonProps['variant'];
}

export default function PreviewButton(props: PreviewButtonProps) {
  const { id, onPreview, source, variant = 'flat' } = props;
  const { setActiveColor, setPreviewColor } = useGenerator('setActiveColor', 'setPreviewColor');
  const { requestPreviewScroll, togglePreview } = useApp('requestPreviewScroll', 'togglePreview');

  return (
    <Tooltip content="View Live Preview" placement="bottom">
      <Button
        aria-label="View Live Preview"
        isIconOnly
        onPress={() => {
          trackEvent(`${source}:preview`);
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
