import { MODAL_MIN_WIDTH } from '~/config/ui';

/**
 * Responsive `maxWidth` for the info/contrast modals: clamp the content's
 * desired width, and on md+ never exceed the viewport minus a 2rem gutter.
 */
export function getModalMaxWidth(desiredWidth: number, maxWidth: number, isMd: boolean): string {
  const baseClamp = `clamp(${MODAL_MIN_WIDTH}px, ${desiredWidth}px, ${maxWidth}px)`;

  return isMd ? `min(${baseClamp}, calc(100% - 4rem))` : baseClamp;
}
