import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

type SetValue<T> = Dispatch<SetStateAction<T>>;

export function useLocalStorage<T>(key: string, fallback: T): [T, SetValue<T>] {
  const [value, setValue] = useState<T>(fallback);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) {
        setValue(JSON.parse(stored));
      }
    } catch {
      // do nothing
    } finally {
      setIsHydrated(true);
    }
  }, [key]);

  useEffect(() => {
    if (!isHydrated) return;

    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // do nothing
    }
  }, [key, value, isHydrated]);

  return [value, setValue];
}
