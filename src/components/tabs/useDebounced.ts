import { useEffect, useState } from 'react';

/** `value` as it stood `ms` milliseconds ago, so a request waits for the reader to stop typing. */
export function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}
