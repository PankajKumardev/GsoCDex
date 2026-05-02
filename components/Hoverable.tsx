"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

import { cn } from "@/lib/cn";

interface HoverableProps extends HTMLMotionProps<"div"> {
  /** Override the hover scale (defaults to 0.985 for a sophisticated press feel). */
  scale?: number;
  /** Optional tag override; defaults to motion.div. Use 'article' / 'section' as needed. */
  as?: "div" | "article" | "section" | "li";
  className?: string;
  children: React.ReactNode;
  /** When false, no hover transform applied. */
  active?: boolean;
}

/**
 * Sophisticated, momentum-based hover wrapper:
 *   - whileHover: scale 0.985 + gold-glow ring
 *   - spring transition with low stiffness for that designer-think feel
 *   - respects prefers-reduced-motion automatically (Framer handles it)
 */
export function Hoverable({
  scale = 0.985,
  as = "div",
  className,
  children,
  active = true,
  ...rest
}: HoverableProps) {
  const Comp = motion[as] as typeof motion.div;
  if (!active) {
    return (
      <Comp className={className} {...rest}>
        {children}
      </Comp>
    );
  }
  return (
    <Comp
      className={cn(className)}
      whileHover={{
        scale,
        boxShadow:
          "0 0 0 1px rgba(180,83,9,0.32), 0 14px 36px -16px rgba(180,83,9,0.28)",
      }}
      transition={{ type: "spring", stiffness: 220, damping: 26, mass: 0.9 }}
      {...rest}
    >
      {children}
    </Comp>
  );
}
