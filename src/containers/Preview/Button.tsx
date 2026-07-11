import { EyeIcon } from '@phosphor-icons/react';

import useApp from '~/hooks/useApp';
import useGenerator from '~/hooks/useGenerator';
import { trackEvent } from '~/utils/analytics';

import Button, { type ButtonProps } from '~/components/Button';
import Tooltip, { type TooltipProps } from '~/components/Tooltip';

interface PreviewButtonProps {
  id: string;
  onPreview?: () => void;
  placement?: TooltipProps['placement'];
  source: 'scale' | 'color';
  variant?: ButtonProps['variant'];
}

export default function PreviewButton(props: PreviewButtonProps) {
  const { id, onPreview, placement = 'bottom', source, variant = 'flat' } = props;
  const { setActiveColor, setPreviewColor } = useGenerator('setActiveColor', 'setPreviewColor');
  const { requestPreviewScroll, togglePreview } = useApp('requestPreviewScroll', 'togglePreview');

  return (
    <Tooltip content="View Live Preview" placement={placement}>
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
