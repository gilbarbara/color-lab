/* eslint-disable unused-imports/no-unused-vars,@typescript-eslint/no-unused-vars */
import 'vitest';

// jest-extended only augments the global `jest.Matchers`, which Vitest 5 no longer extends.
// Augmenting `Matchers` instead would also retype `expect.extend` and reject jest-extended's export.
declare module 'vitest' {
  interface Assertion<R, T> extends CustomMatchers<R> {}

  interface AsymmetricMatchersContaining extends CustomMatchers<any> {}
}
