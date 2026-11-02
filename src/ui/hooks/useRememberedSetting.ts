import { useCallback, useState } from 'react';
import { type RememberedSetting, type RememberedValue, recall, remember } from '../../app/rememberedSettings';
import type { KeyValueStorage } from '../../app/storage';

/** A remembered setting as React state: it starts from what an earlier visit kept, and each change is kept (issue 87). */
export function useRememberedSetting<K extends RememberedSetting>(storage: KeyValueStorage, name: K) {
  const [value, setValue] = useState(() => recall(storage, name));
  const change = useCallback(
    (next: RememberedValue<K>) => {
      setValue(next);
      remember(storage, name, next);
    },
    [storage, name],
  );
  return [value, change] as const;
}
