"use client";

import Lenis from "lenis";
import { useEffect } from "react";

let lenisInstance: Lenis | null = null;

/**
 * Stop / start the global Lenis instance. Used by full-screen overlays
 * (PDF viewer, search palette) so the modal's native scroll isn't
 * hijacked by Lenis's smooth wheel translation.
 */
export function pauseLenis() {
  lenisInstance?.stop();
}
export function resumeLenis() {
  lenisInstance?.start();
}

/**
 * Mounts Lenis smooth-scroll with a heavy, intentional lerp.
 * Skips activation when the user prefers reduced motion.
 */
export function LenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const lenis = new Lenis({
      duration: 1.4,
      lerp: 0.08,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.4,
    });
    lenisInstance = lenis;

    let raf = 0;
    const tick = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      if (lenisInstance === lenis) lenisInstance = null;
    };
  }, []);
  return <>{children}</>;
}
