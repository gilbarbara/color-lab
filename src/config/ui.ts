export const BREAKPOINTS = { xs: 0, sm: 360, md: 768, lg: 1024, xl: 1280 };

export const HEADER_HEIGHT = 64;
export const OFFSET = 16;
export const SCROLL_OFFSET = HEADER_HEIGHT + OFFSET;

export const MODAL_GAP = 24;
export const MODAL_BODY_PADDING = 32;
export const MODAL_MIN_WIDTH = 480;

// DOM
export const DATA_INTERACTING_ATTR = 'data-interacting';

// Motion
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

// How long the sidebar / bottom-drawer CSS transitions run (Generator/Panel). Callers that
// need the panel to be at its final size before measuring it wait this out.
export const PANEL_TRANSITION_MS = 500;

// Charts — vertical padding inside the 100x100 viewBox shared by the color charts
// and the scale-option curve previews.
export const CHART_PAD_Y = 5;

export const ROUTER_NAVIGATION_OPTIONS = { scroll: false } as const;
