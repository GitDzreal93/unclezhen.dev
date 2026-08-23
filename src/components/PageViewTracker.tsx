"use client";

// Fires a single POST to /api/track on every pathname change (and on first
// mount), skipping /admin. Stamps and reads the uz_visitor cookie on the
// client so the server never has to set it. Renders nothing.
//
// Why client-only: middleware would run on Edge and `pg` is not edge-safe.
// The Next.js render is server-side, but the analytics write is a one-shot
// side effect, so doing it on the client is the right layer.
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const COOKIE = "uz_visitor";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const re = new RegExp(
    "(?:^|; )" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "=([^;]*)",
  );
  const m = document.cookie.match(re);
  return m ? decodeURIComponent(m[1]) : null;
}

function writeCookie(name: string, value: string, maxAge: number, secure: boolean) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Max-Age=${maxAge}`,
    "Path=/",
    "SameSite=Lax",
  ];
  if (secure) parts.push("Secure");
  document.cookie = parts.join("; ");
}

function newVisitorId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function send(path: string, referer: string | null) {
  const body = JSON.stringify({ path, referer });
  // sendBeacon survives page unload; the body must be a Blob to set
  // Content-Type to application/json (sendBeacon ignores headers arg).
  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const ok = navigator.sendBeacon(
      "/api/track",
      new Blob([body], { type: "application/json" }),
    );
    if (ok) return;
  }
  // Fallback: fetch with keepalive (modern browsers; won't survive unload
  // as reliably as sendBeacon, but covers fetch-only environments).
  if (typeof fetch !== "undefined") {
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  }
}

export default function PageViewTracker() {
  const pathname = usePathname();
  // Tracks the path we last fired for. Same value -> skip. This also
  // covers React StrictMode's double-mount in dev, since the ref is
  // preserved across the synthetic unmount/remount of the same instance.
  const lastFiredRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/admin")) {
      // Record the path so we don't fire later if the user lands on /admin
      // first, then later hits a public path that reuses the ref.
      lastFiredRef.current = pathname;
      return;
    }
    if (lastFiredRef.current === pathname) return;
    lastFiredRef.current = pathname;

    // Ensure the visitor cookie exists. If it doesn't, stamp one so the
    // server can attribute the visit. The first request from a new browser
    // therefore has a fresh visitor_id before the next navigation.
    let visitorId = readCookie(COOKIE);
    if (!visitorId) {
      visitorId = newVisitorId();
      const secure =
        typeof window !== "undefined" && window.location.protocol === "https:";
      writeCookie(COOKIE, visitorId, COOKIE_MAX_AGE, secure);
    }

    send(pathname, typeof document !== "undefined" ? document.referrer || null : null);
  }, [pathname]);

  return null;
}
