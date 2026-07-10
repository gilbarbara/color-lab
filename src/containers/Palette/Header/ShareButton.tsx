import { ShareIcon } from '@phosphor-icons/react';

import { trackEvent } from '~/utils/analytics';
import { copyToClipboard } from '~/utils/clipboard';

import Button from '~/components/Button';
import Tooltip from '~/components/Tooltip';

export default function ShareButton() {
  return (
    <Tooltip content="Share Palette URL">
      <Button
        aria-label="Share"
        className="@max-xl:button-menu-square"
        onPress={() => {
          trackEvent('palette:share');
          copyToClipboard(window.location.href, { title: 'Palette URL copied!' });
        }}
        size="menu"
        startContent={<ShareIcon className="text-xl" weight="bold" />}
        variant="light"
      >
        <span className="hidden @xl:inline">Share</span>
      </Button>
    </Tooltip>
  );
}
