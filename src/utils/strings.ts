import { isValidElement, type ReactNode } from 'react';

export function getTextFromNode(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(getTextFromNode).join('');
  }

  if (isValidElement<{ children?: ReactNode }>(node) && node.props.children) {
    return getTextFromNode(node.props.children);
  }

  return '';
}
