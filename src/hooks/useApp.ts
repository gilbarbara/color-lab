import { useShallow } from 'zustand/react/shallow';

import { type AppStateWithActions, useAppStore } from '~/stores/appStore';

export default function useApp<K extends keyof AppStateWithActions>(
  ...keys: K[]
): Pick<AppStateWithActions, K> {
  return useAppStore(
    useShallow(s => Object.fromEntries(keys.map(k => [k, s[k]])) as Pick<AppStateWithActions, K>),
  );
}
