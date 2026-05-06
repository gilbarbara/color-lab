import { addToast } from '@heroui/react';

export async function copyToClipboard(value: string, showToast = true): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);

    if (showToast) {
      addToast({ title: 'Copied to clipboard', color: 'success' });
    }

    return true;
  } catch {
    if (showToast) {
      addToast({ title: 'Failed to copy', color: 'danger' });
    }

    return false;
  }
}
