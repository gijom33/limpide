import { useCallback, useState } from 'react';
import { type DisplaySetting, type DisplayValue, recall, remember } from '../../app/displaySettings';
import type { KeyValueStorage } from '../../app/storage';

/** A Display setting as React state: it starts from what an earlier visit kept, and each change is kept (issue 87). */
export function useDisplaySetting<K extends DisplaySetting>(storage: KeyValueStorage, name: K) {
  const [value, setValue] = useState(() => recall(storage, name));
  const change = useCallback(
    (next: DisplayValue<K>) => {
      setValue(next);
      remember(storage, name, next);
    },
    [storage, name],
  );
  return [value, change] as const;
}
