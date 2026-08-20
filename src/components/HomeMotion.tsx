"use client";

// Home-page motion: hero entrance timeline + skill-bar growth. Wraps the
// server-rendered <main> as a client boundary.
//
// Guardrails:
//  - Only touches #panel-0's descendants, never .hero-panel itself — the
//    panels' scroll cross-fade (.is-dim) is owned by HomeScene's rAF loop.
//  - HomeScene / the Three.js canvas are untouched.

import { useRef, type ReactNode } from "react";
import { gsap, ScrollTrigger, useGSAP, EASE, DUR } from "@/lib/gsap";

export default function HomeMotion({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;
      const q = gsap.utils.selector(root);

      // JetBrains Mono swap shifts layout — re-measure triggers once ready.
      document.fonts?.ready.then(() => ScrollTrigger.refresh());

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // —— Hero entrance (first panel's terminal only) ——
        const tl = gsap.timeline({ defaults: { ease: EASE } });
        tl.fromTo(
          q("#panel-0 .term-window"),
          { autoAlpha: 0, y: 26 },
          { autoAlpha: 1, y: 0, duration: DUR.base }
        )
          .fromTo(
            q("#panel-0 .term-chrome, #panel-0 .path-line"),
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.25 },
            "-=0.2"
          )
          .fromTo(
            q(
              "#panel-0 h1, #panel-0 .lead, #panel-0 .hero-actions, #panel-0 .stat-row, #panel-0 .scroll-hint"
            ),
            { autoAlpha: 0, y: 18, filter: "blur(5px)" },
            { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.6, stagger: 0.07 },
            "-=0.1"
          );

        // Scroll restoration: jump to end so content never sits hidden.
        if (window.scrollY > 80) tl.progress(1);

        // —— Live stats count-up (posts / shop from the DB) ——
        q("#panel-0 .stat__n[data-count-to]").forEach((el) => {
          const node = el as HTMLElement;
          const target = Number(node.dataset.countTo || "0");
          if (!Number.isFinite(target) || target <= 0) return;
          const digits = node.dataset.countDigits || String(target).length;
          const obj = { v: 0 };
          gsap.to(obj, {
            v: target,
            duration: 1.1,
            ease: "power2.out",
            delay: 0.9,
            onUpdate: () => {
              node.textContent = String(Math.round(obj.v)).padStart(Number(digits), "0");
            },
          });
        });

        // —— Skill bars: scaleX 0 → 1, inline width untouched ——
        gsap.fromTo(
          q(".bar-track > i"),
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 0.9,
            ease: "power2.out",
            stagger: 0.08,
            transformOrigin: "left center",
            scrollTrigger: {
              trigger: q(".skill-list"),
              start: "top 88%",
              once: true,
            },
          }
        );
      });
    },
    { scope }
  );

  return <div ref={scope}>{children}</div>;
}
