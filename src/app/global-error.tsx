"use client";

// Root error boundary. Renders WITHOUT the root layout (so the html/body
// must be inlined here), and without any imported stylesheets. Keep it
// self-contained: inline the minimum terminal chrome so the page still
// reads as part of the site even when the rest of Next has failed to load.

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  const isDev = process.env.NODE_ENV !== "production";

  return (
    <html lang="zh-CN">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "32px 20px",
          background: "oklch(11% 0.012 155)",
          color: "oklch(93% 0.02 145)",
          fontFamily:
            '"JetBrains Mono", "IBM Plex Mono", ui-monospace, Menlo, monospace',
        }}
      >
        <div
          role="alert"
          style={{
            maxWidth: 640,
            width: "100%",
            border: "1px solid oklch(28% 0.03 150)",
            background: "oklch(15% 0.016 155)",
            borderRadius: 5,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 12px",
              borderBottom: "1px solid oklch(28% 0.03 150)",
              background: "oklch(19% 0.02 155)",
              fontSize: 11,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "oklch(62% 0.03 150)",
            }}
          >
            <span style={{ display: "flex", gap: 5 }} aria-hidden="true">
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "oklch(78% 0.19 145)",
                  display: "block",
                }}
              />
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "oklch(60% 0.10 85)",
                  display: "block",
                }}
              />
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "oklch(68% 0.16 25)",
                  display: "block",
                }}
              />
            </span>
            <span>zhen@lab — fatal</span>
            <span style={{ marginLeft: "auto" }}>exit 500</span>
          </div>
          <div style={{ padding: "24px 22px 26px", display: "grid", gap: 18 }}>
            <div
              style={{
                fontFamily:
                  '"JetBrains Mono", "IBM Plex Mono", ui-monospace, monospace',
                fontSize: 12.5,
                color: "oklch(62% 0.03 150)",
                lineHeight: 1.6,
              }}
            >
              <span style={{ color: "oklch(78% 0.19 145)" }}>zhen@lab</span>{" "}
              <span>~/site </span>
              <span style={{ color: "oklch(78% 0.19 145)" }}>❯</span>{" "}
              <span style={{ color: "oklch(93% 0.02 145)" }}>render</span>
            </div>
            <div
              style={{
                display: "inline-flex",
                gap: 6,
                fontSize: 10.5,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "oklch(62% 0.03 150)",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "oklch(68% 0.16 25)",
                  display: "inline-block",
                }}
              />
              runtime · unhandled
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: 28,
                fontWeight: 600,
                fontFamily:
                  '"JetBrains Mono", "IBM Plex Mono", ui-monospace, monospace',
                letterSpacing: "-0.01em",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              500
              <span
                style={{
                  color: "oklch(62% 0.03 150)",
                  fontWeight: 400,
                  fontSize: 16,
                  marginLeft: 10,
                }}
              >
                layout failed to load
              </span>
            </h1>
            <p style={{ margin: 0, lineHeight: 1.6, wordBreak: "break-word" }}>
              {error.message || "全局错误:根布局渲染失败,通常是样式表或字体加载异常。"}
            </p>
            {isDev && error.digest && (
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  color: "oklch(62% 0.03 150)",
                  wordBreak: "break-all",
                  borderTop: "1px dashed oklch(28% 0.03 150)",
                  paddingTop: 12,
                }}
              >
                digest · {error.digest}
              </p>
            )}
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                paddingTop: 6,
                borderTop: "1px solid oklch(28% 0.03 150)",
              }}
            >
              <button
                type="button"
                onClick={reset}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 14px",
                  border: "1px solid oklch(78% 0.19 145)",
                  background: "oklch(78% 0.19 145)",
                  color: "oklch(11% 0.012 155)",
                  borderRadius: 3,
                  fontFamily: "inherit",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    background: "oklch(11% 0.012 155)",
                    color: "oklch(78% 0.19 145)",
                    padding: "1px 6px",
                    borderRadius: 3,
                    fontSize: 11,
                  }}
                >
                  ↩
                </span>
                retry
              </button>
              <a
                href="/"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 14px",
                  border: "1px solid oklch(28% 0.03 150)",
                  background: "transparent",
                  color: "oklch(93% 0.02 145)",
                  borderRadius: 3,
                  fontFamily: "inherit",
                  fontSize: 12,
                  textDecoration: "none",
                }}
              >
                <span
                  style={{
                    background: "oklch(15% 0.016 155)",
                    color: "oklch(62% 0.03 150)",
                    border: "1px solid oklch(28% 0.03 150)",
                    padding: "1px 6px",
                    borderRadius: 3,
                    fontSize: 11,
                  }}
                >
                  cd
                </span>
                回到首页
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
