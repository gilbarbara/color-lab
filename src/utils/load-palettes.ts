// Memoized dynamic import of the Firestore-backed palettes service. Keeps
// Firestore off the generator's first-load bundle while sharing a single
// import() across all call sites — one chunk load, no duplicate concurrent
// loads when several consumers (id sync + save flow) reach for it at once.

type PalettesService = typeof import('~/services/palettes');

let servicePromise: Promise<PalettesService> | undefined;

export function loadPalettesService(): Promise<PalettesService> {
  servicePromise ??= import('~/services/palettes').catch((error: unknown) => {
    // Don't cache a transient chunk-load failure — clear the memo so the next call
    // retries instead of breaking saved-palette ops for the rest of the session.
    servicePromise = undefined;
    throw error;
  });

  return servicePromise;
}
