"use client";

// Generic scroll-into-view reveal wrapper. Server-rendered children stay
// server-rendered — this component only adds the tween. Two modes:
//   mode="self"     (default) animate the wrapper itself
//   mode="children" stagger the wrapper's direct children (card grids, column groups)
//
// Under prefers-reduced-motion nothing is hidden and no tween runs — the
// reduce branch returns before any initial state is applied.

import { useRef, type CSSProperties, type ReactNode } from "react";
import { gsap, useGSAP, EASE, DUR } from "@/lib/gsap";

type Props = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  as?: "div" | "section" | "ul";
  mode?: "self" | "children";
  y?: number;
  x?: number;
  /** degrees — used for the weekly paper "settle" */
  rotate?: number;
  /** only for small one-shot element counts (paint cost) */
  blur?: boolean;
  delay?: number;
  /** children mode only */
  stagger?: number;
  start?: string;
};

export default function Reveal({
  children,
  className,
  style,
  as = "div",
  mode = "self",
  y = 24,
  x = 0,
  rotate = 0,
  blur = false,
  delay = 0,
  stagger = 0.08,
  start = "top 85%",
}: Props) {
  const scope = useRef<HTMLElement | null>(null);
  const Tag = as;

  useGSAP(
    () => {
      const el = scope.current;
      if (!el) return;
      const targets: Element[] =
        mode === "children" ? Array.from(el.children) : [el];
      if (targets.length === 0) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          targets,
          {
            autoAlpha: 0,
            y,
            x,
            rotate,
            ...(blur ? { filter: "blur(6px)" } : {}),
          },
          {
            autoAlpha: 1,
            y: 0,
            x: 0,
            rotate: 0,
            filter: "blur(0px)",
            duration: DUR.slow,
            delay,
            ease: EASE,
            stagger: mode === "children" ? stagger : 0,
            overwrite: "auto",
            // Strip inline transform/filter afterwards — leftover non-none
            // values would create containing blocks that break any
            // position:fixed descendant (modals, drawers).
            clearProps: "transform,filter",
            scrollTrigger: {
              trigger: el,
              start,
              once: true,
            },
          }
        );
      });
    },
    { scope }
  );

  return (
    <Tag ref={scope as never} className={className} style={style}>
      {children}
    </Tag>
  );
}
