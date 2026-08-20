"use client";

// Single GSAP registration point. Every component imports gsap/ScrollTrigger/
// useGSAP from here so plugins register exactly once, guarded against SSR.

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
}

export { gsap, ScrollTrigger, useGSAP };

// Shared motion language. EASE mirrors the CSS token
// --ease: cubic-bezier(0.22, 1, 0.36, 1).
export const EASE = "power3.out";
export const DUR = { fast: 0.24, base: 0.45, slow: 0.7 };
