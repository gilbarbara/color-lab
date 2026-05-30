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

// The app persists `gamut` to localStorage and reads it before consulting
// matchMedia (app/layout.tsx gamutBootstrap + appStore partialize), so a
// previously persisted 'srgb' overrides the spoof above. Force the saved
// gamut to 'p3' before any page script runs on each navigation.
try {
  const key = 'color-lab';
  let persisted = null;

  try {
    persisted = JSON.parse(localStorage.getItem(key));
  } catch {
    persisted = null;
  }

  if (!persisted || typeof persisted !== 'object') {
    persisted = { state: {}, version: 1 };
  }

  if (!persisted.state || typeof persisted.state !== 'object') {
    persisted.state = {};
  }

  persisted.state.gamut = 'p3';
  localStorage.setItem(key, JSON.stringify(persisted));
} catch {
  // localStorage unavailable (e.g. about:blank opaque origin) — ignore.
}
