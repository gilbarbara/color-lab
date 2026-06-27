import { addToast } from '@heroui/react';

interface CopyToClipboardOptions {
  showToast?: boolean;
  title?: string;
}

export async function copyToClipboard(
  value: string,
  options: CopyToClipboardOptions = {},
): Promise<boolean> {
  const { showToast = true, title = 'Copied to clipboard' } = options;

  try {
    await navigator.clipboard.writeText(value);

    if (showToast) {
      addToast({ title, color: 'success' });
    }

    return true;
  } catch {
    if (showToast) {
      addToast({ title: 'Failed to copy', color: 'danger' });
    }

    return false;
  }
}
