import { useEffect, useState } from 'react';

export function usePrevious<T>(value: T) {
  const [current, setCurrent] = useState<T>(value);
  const [previous, setPrevious] = useState<T | null>(null);

  useEffect(() => {
    if (JSON.stringify(value) !== JSON.stringify(current)) {
      setPrevious(current);
      setCurrent(value);
    }
  }, [value, current]);

  return previous;
}
