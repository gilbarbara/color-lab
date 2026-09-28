import type { BrowserOptions } from '@sentry/nextjs';

const SENSITIVE_KEYS = ['forwarded', '-ip', 'remote-', 'via', '-user'];

// v11 collects everything when `dataCollection` is unset; pin the v10 defaults
// (sendDefaultPii off) so no user info, cookies, or bodies reach Sentry.
export const SENTRY_DATA_COLLECTION: BrowserOptions['dataCollection'] = {
  userInfo: false,
  cookies: false,
  httpHeaders: {
    request: { deny: SENSITIVE_KEYS },
    response: { deny: SENSITIVE_KEYS },
  },
  httpBodies: [],
  urlQueryParams: { deny: SENSITIVE_KEYS },
  genAI: { inputs: false, outputs: false },
  databaseQueryData: false,
  graphQL: { document: false, variables: false },
  frameContextLines: 7,
};
