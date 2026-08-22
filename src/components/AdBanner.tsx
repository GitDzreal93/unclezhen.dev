"use client";

// AdSense banner unit. The global loader script is mounted once in
// <RootLayout> when NEXT_PUBLIC_ADSENSE_CLIENT is set, so each <AdBanner>
// just pushes an adsbygoogle config into the queue.
//
// Server-component safe to render: the effect is client-only. If
// NEXT_PUBLIC_ADSENSE_CLIENT is unset, nothing is rendered (clean fallback
// for the pre-AdSense period — no empty iframe, no script).

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type Props = {
  slot: string;
  className?: string;
  /** "auto" = responsive, "rectangle" = fixed 300x250, "fluid" = in-article. */
  format?: "auto" | "fluid" | "rectangle";
  style?: React.CSSProperties;
};

export default function AdBanner({
  slot,
  className,
  format = "auto",
  style,
}: Props) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const pushed = useRef(false);

  useEffect(() => {
    if (!client || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // Loader not yet ready (Fast Refresh) — retry once on next mount.
    }
  }, [client]);

  if (!client) return null;
  return (
    <ins
      className={`adsbygoogle ${className ?? ""}`.trim()}
      style={{ display: "block", textAlign: "center", ...style }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  );
}
