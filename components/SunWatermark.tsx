"use client";

import { motion } from "framer-motion";
import Image from "next/image";

/**
 * Slowly rotating sun-mark watermark behind the page content.
 * Uses the official Google Summer of Code 2022 sun logo
 * (sourced from Wikimedia Commons; original copyright Google LLC).
 *
 * Rendered at 4% opacity. Layered behind everything else (z-0).
 * Respects prefers-reduced-motion.
 */
export function SunWatermark() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      <motion.div
        className="absolute left-1/2 top-[18vh] -translate-x-1/2"
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 240, repeat: Infinity, ease: "linear" }}
        style={{ opacity: 0.05 }}
      >
        <Image
          src="/illustrations/gsoc-sun.svg"
          alt=""
          width={900}
          height={900}
          priority={false}
          unoptimized
          className="h-[80vmin] w-[80vmin] max-h-[820px] max-w-[820px] select-none"
          style={{ filter: "saturate(0) brightness(0.9)" }}
        />
      </motion.div>
    </div>
  );
}
