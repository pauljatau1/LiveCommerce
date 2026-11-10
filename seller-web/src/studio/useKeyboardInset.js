// The on-screen keyboard (same approach as the buyer's Watch). iOS doesn't shrink
// the page when it opens, only the visual viewport, so we read how much of the
// bottom it covers and how tall the visible area is.
import { useEffect, useState } from 'react';

export default function useKeyboardInset() {
  const [inset, setInset] = useState({ bottom: 0, height: typeof window !== 'undefined' ? window.innerHeight : 0 });
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return undefined;
    const update = () => {
      const covered = Math.max(0, window.innerHeight - (vv.height + vv.offsetTop));
      setInset({ bottom: covered > 80 ? Math.round(covered) : 0, height: Math.round(vv.height) });
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => { vv.removeEventListener('resize', update); vv.removeEventListener('scroll', update); };
  }, []);
  return inset;
}
