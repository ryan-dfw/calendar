import { useEffect, useRef, useState } from "react";

type Options = {
  delay?: number;
  minDuration?: number;
};

export function useDelayedLoading(isLoading: boolean, options: Options = {}): boolean {
  const { delay = 350, minDuration = 500 } = options;
  const [shown, setShown] = useState(false);
  const shownAtRef = useRef<number | null>(null);
  const delayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (delayTimer.current) clearTimeout(delayTimer.current);
    if (holdTimer.current) clearTimeout(holdTimer.current);
    delayTimer.current = null;
    holdTimer.current = null;

    if (isLoading) {
      delayTimer.current = setTimeout(() => {
        shownAtRef.current = Date.now();
        setShown(true);
      }, delay);
    } else if (shownAtRef.current !== null) {
      const elapsed = Date.now() - shownAtRef.current;
      const remaining = minDuration - elapsed;
      if (remaining > 0) {
        holdTimer.current = setTimeout(() => {
          shownAtRef.current = null;
          setShown(false);
        }, remaining);
      } else {
        shownAtRef.current = null;
        setShown(false);
      }
    } else {
      setShown(false);
    }

    return () => {
      if (delayTimer.current) clearTimeout(delayTimer.current);
      if (holdTimer.current) clearTimeout(holdTimer.current);
    };
  }, [isLoading, delay, minDuration]);

  return shown;
}
