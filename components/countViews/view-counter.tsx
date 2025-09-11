import { useEffect, useRef } from "react";

export function useOnScreen(callback: () => void, options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new window.IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          callback();
        }
      },
      options
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [callback, options]);

  return ref;
}