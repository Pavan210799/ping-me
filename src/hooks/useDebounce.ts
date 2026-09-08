import { useEffect, useState } from "react";

export function useDebounce(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(value);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
