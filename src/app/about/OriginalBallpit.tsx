"use client";

import dynamic from "next/dynamic";

// The original React Bits Ballpit (green balls, gravity, silky) — rendered as a
// reference next to the logo-chip Toolbox so the two can be compared. Client-only.
const Ballpit = dynamic(() => import("@/components/Ballpit"), {
  ssr: false,
  loading: () => null,
});

export default function OriginalBallpit() {
  return (
    <div className="orig-ballpit">
      <Ballpit
        count={100}
        gravity={0.5}
        friction={0.9975}
        wallBounce={0.95}
        followCursor={true}
        colors={[0x1f5d3a, 0x3aa56b, 0x9affc8]}
      />
    </div>
  );
}
