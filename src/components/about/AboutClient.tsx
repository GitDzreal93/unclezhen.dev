"use client";

// Client-side shell for the heavy /about components that can't SSR
// (3D scene + three/examples/jsm). Server page imports this single
// client boundary, so all dynamic({ ssr: false }) calls live here.

import nextDynamic from "next/dynamic";
import type { Locale } from "@/lib/i18n/dict";

const HeroIP = nextDynamic(() => import("./HeroIP"), { ssr: false });
const AboutStack = nextDynamic(() => import("./AboutStack"), {
  ssr: false,
  loading: () => (
    <div className="toolpit">
      <div className="toolpit__loading">// loading stack…</div>
    </div>
  ),
});

export function AboutHero() {
  return <HeroIP />;
}

export function AboutStackSection({ locale }: { locale: Locale }) {
  return <AboutStack locale={locale} />;
}
