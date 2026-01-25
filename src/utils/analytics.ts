declare global {
  interface Window {
    umami?: { track: (...arguments_: any[]) => void };
  }
}

export function trackEvent(name: string, data?: Record<string, string | number | boolean>): void {
  window.umami?.track(name, data);
}

export function trackPage(url: string): void {
  window.umami?.track((props: Record<string, unknown>) => ({ ...props, url }));
}
