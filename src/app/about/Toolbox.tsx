"use client";

import dynamic from "next/dynamic";

// LogoPit (three.js) is client-only; never SSR it.
const LogoPit = dynamic(() => import("@/components/LogoPit"), {
  ssr: false,
  loading: () => null,
});

type Tool = { name: string; hex: string; path?: string; text?: string };

/**
 * Tech-stack toolbox: a LogoPit — the skill icons themselves are the physical
 * objects (camera-facing logo chips) that bounce, collide, flee the cursor, and
 * burst on click. Replaces the earlier "green ball field + DOM tiles" combo.
 */
export default function Toolbox({ tools }: { tools: Tool[] }) {
  return (
    <div className="toolpit">
      {/* count = tools + 1: index 0 is the invisible cursor influencer, so each
          logo appears exactly once (no duplicates). */}
      <LogoPit className="toolpit__bg" tools={tools} count={tools.length + 1} followCursor={true} />
    </div>
  );
}
