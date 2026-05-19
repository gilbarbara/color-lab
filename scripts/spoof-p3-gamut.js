// Forces matchMedia('(color-gamut: p3)') to return matches: true.
// Headless Chrome reports SRGB; this lets the app render its P3 UI
// (Gamut menu, wide-gamut palettes) during agent-browser sessions.
const original = window.matchMedia;
window.matchMedia = (q) => {
  if (q === '(color-gamut: p3)') {
    return { ...original.call(window, q), matches: true };
  }
  return original.call(window, q);
};
