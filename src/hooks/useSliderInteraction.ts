import { useCallback, useRef } from 'react';

import { DATA_INTERACTING_ATTR } from '~/config/ui';

/**
 * Tags a wrapper element with `data-interacting="true"` while a slider is
 * actively being changed, so `useUrlSync` can pause URL writes during the
 * gesture and flush once on release.
 */
export default function useSliderInteraction() {
  const nodeRef = useRef<HTMLElement | null>(null);

  const ref = useCallback((node: HTMLElement | null) => {
    if (node) {
      nodeRef.current = node;

      return;
    }

    nodeRef.current?.removeAttribute(DATA_INTERACTING_ATTR);
    nodeRef.current = null;
  }, []);

  const start = useCallback(() => {
    nodeRef.current?.setAttribute(DATA_INTERACTING_ATTR, 'true');
  }, []);

  const end = useCallback(() => {
    nodeRef.current?.removeAttribute(DATA_INTERACTING_ATTR);
  }, []);

  return { ref, start, end };
}
