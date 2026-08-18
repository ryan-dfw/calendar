import { useEffect, useRef, useState } from "react";

export function useFadeMount(show: boolean, duration = 300) {
  const [mounted, setMounted] = useState(show);
  const [visible, setVisible] = useState(false);
  const unmountTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showFrame = useRef<number | null>(null);

  useEffect(() => {
    if (unmountTimer.current) clearTimeout(unmountTimer.current);
    if (showFrame.current !== null) cancelAnimationFrame(showFrame.current);

    if (show) {
      setMounted(true);
      showFrame.current = requestAnimationFrame(() => {
        showFrame.current = requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
      unmountTimer.current = setTimeout(() => setMounted(false), duration);
    }

    return () => {
      if (unmountTimer.current) clearTimeout(unmountTimer.current);
      if (showFrame.current !== null) cancelAnimationFrame(showFrame.current);
    };
  }, [show, duration]);

  return { mounted, visible };
}
