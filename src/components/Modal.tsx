"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { gsap, useGSAP, EASE, DUR } from "@/lib/gsap";

// Open/close is animated by GSAP on the always-mounted backdrop (see the
// .modal-backdrop note in globals.css). The .is-open class remains as a
// styling/a11y hook; callers are unaware of the animation.
//
// Portaled to document.body: any ancestor with a transform/filter (e.g. a
// GSAP-revealed section) would otherwise turn position:fixed into
// position:absolute-relative-to-that-ancestor and break the overlay.
export default function Modal({
  open,
  onClose,
  labelledBy,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy?: string;
  children: ReactNode;
}) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useGSAP(
    () => {
      const bd = backdropRef.current;
      const panel = bd?.querySelector<HTMLElement>(".modal");
      if (!bd || !panel) return;

      const mm = gsap.matchMedia();
      mm.add(
        {
          ok: "(prefers-reduced-motion: no-preference)",
          reduce: "(prefers-reduced-motion: reduce)",
        },
        (ctx) => {
          const dur = ctx.conditions?.reduce ? 0 : open ? DUR.base : DUR.fast;
          if (open) {
            gsap.fromTo(
              bd,
              { autoAlpha: 0 },
              { autoAlpha: 1, duration: dur, ease: EASE }
            );
            gsap.fromTo(
              panel,
              { autoAlpha: 0, y: 18, scale: 0.97 },
              { autoAlpha: 1, y: 0, scale: 1, duration: dur, ease: EASE }
            );
          } else {
            gsap.to(bd, { autoAlpha: 0, duration: dur });
            gsap.to(panel, {
              autoAlpha: 0,
              y: 10,
              scale: 0.98,
              duration: dur,
              ease: "power2.in",
            });
          }
        }
      );
      return () => mm.revert();
    },
    { dependencies: [open] }
  );

  if (!mounted) return null;

  return createPortal(
    <div
      ref={backdropRef}
      className={`modal-backdrop${open ? " is-open" : ""}`}
      aria-hidden={!open}
      role="dialog"
      aria-labelledby={labelledBy}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal">{children}</div>
    </div>,
    document.body
  );
}
