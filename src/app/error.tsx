"use client";

import { useEffect } from "react";
import { ErrorTerminal } from "./_components/ErrorTerminal";

// Route-segment error boundary. Catches anything a server component throws
// inside any page under /, /blog, /projects, /shop, etc.
//
// Next.js 15: when a page calls notFound(), the resulting NEXT_NOT_FOUND /
// NEXT_HTTP_ERROR_FALLBACK;404 error is caught by the error boundary in the
// same segment. To keep the visual consistent with the not-found.tsx path,
// we detect the 404 by digest and render the not-found variant. The
// not-found.tsx file still works for unmatched routes (no segment
// boundary to hit).

export default function RouteError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  // Error boundaries are client components; cookies() (next/headers)
  // isn't reachable here, so we default to zh. A future improvement is
  // to read locale from a cookie that the layout also writes to document.
  const locale = "zh" as const;

  const isNotFound =
    typeof error.digest === "string" &&
    (error.digest.startsWith("NEXT_NOT_FOUND") ||
      error.digest.startsWith("NEXT_HTTP_ERROR_FALLBACK;404"));

  if (isNotFound) {
    return <ErrorTerminal variant="not-found" locale={locale} resetHref="/" />;
  }

  return (
    <ErrorTerminal
      variant="error"
      scope="public"
      errorMessage={error.message}
      errorDigest={error.digest}
      locale={locale}
      resetHref="/"
    />
  );
}
