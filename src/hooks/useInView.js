import { useCallback, useRef, useState } from 'react';

export function useInView(threshold = 0.1) {
  const [inView, setInView] = useState(false);
  const obsRef = useRef(null);

  const ref = useCallback((el) => {
    if (obsRef.current) obsRef.current.disconnect();
    if (!el) return;
    obsRef.current = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obsRef.current?.disconnect(); } },
      { threshold }
    );
    obsRef.current.observe(el);
  }, [threshold]);

  return [ref, inView];
}
