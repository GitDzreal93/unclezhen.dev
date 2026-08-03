"use client";

import { useEffect } from "react";
import { ErrorTerminal } from "../_components/ErrorTerminal";

// Admin-area error boundary. Lives inside AdminChrome's .admin-shell so
// the err-stage shouldn't be 60vh tall. The ErrorTerminal uses the public
// class names; we wrap it in a tightened stage class via inline styles
// to stay within the admin sidebar layout.

export default function AdminError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin error:", error);
  }, [error]);

  const locale = "zh" as const;
  const isNotFound =
    typeof error.digest === "string" &&
    (error.digest.startsWith("NEXT_NOT_FOUND") ||
      error.digest.startsWith("NEXT_HTTP_ERROR_FALLBACK;404"));

  return (
    <div style={{ padding: 8 }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <ErrorTerminal
          variant={isNotFound ? "not-found" : "error"}
          scope="admin"
          errorMessage={isNotFound ? undefined : error.message}
          errorDigest={isNotFound ? undefined : error.digest}
          resetHref="/admin"
          locale={locale}
        />
      </div>
    </div>
  );
}
