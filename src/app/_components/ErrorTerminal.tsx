"use client";

import { usePathname } from "next/navigation";
import { t, type Locale } from "@/lib/i18n/dict";
import "../errors.css";

// Shared terminal-window body for both not-found (no match) and the
// error.tsx path (NEXT_HTTP_ERROR_FALLBACK;404 / NEXT_NOT_FOUND). In Next.js
// 15, notFound() thrown from a page can be caught by an error boundary
// above the not-found boundary, so we render the same shell in both cases
// to keep the visual consistent regardless of which path is taken.
//
// Variants:
//   - "not-found" → "zsh: command not found" + exit 404
//   - "error"     → "runtime error" + exit 500
// `errorMessage` is shown verbatim under the headline when provided.

type Variant = "not-found" | "error";
type Scope = "public" | "admin" | "fatal";

export function ErrorTerminal({
  variant,
  scope = "public",
  errorMessage,
  errorDigest,
  resetHref = "/",
  locale,
}: {
  variant: Variant;
  scope?: Scope;
  errorMessage?: string;
  errorDigest?: string;
  resetHref?: string;
  locale: Locale;
}) {
  const path = usePathname() || "/";
  const isNotFound = variant === "not-found";
  const isAdmin = scope === "admin";
  const isFatal = scope === "fatal";

  // Title bar copy: public "not found" / "runtime error" / admin "admin · runtime error" / fatal "fatal".
  let titleKey: string;
  if (isNotFound) titleKey = "err.404.title";
  else if (isFatal) titleKey = "err.500.title.fatal";
  else if (isAdmin) titleKey = "err.500.title.admin";
  else titleKey = "err.500.title";

  let leadKey: string | null = null;
  if (!isNotFound) {
    if (isFatal) leadKey = "err.500.lead.fatal";
    else if (isAdmin) leadKey = "err.500.lead.admin";
    else leadKey = "err.500.lead.runtime";
  }

  return (
    <div className="err-stage">
      <div className="err-window" role="alert" aria-live={isNotFound ? "polite" : "assertive"}>
        <div className="err-chrome">
          <span className="err-dots" aria-hidden="true">
            <i></i>
            <i></i>
            <i></i>
          </span>
          <span>zhen@lab — {t(locale, titleKey)}</span>
          <span style={{ marginLeft: "auto", color: "var(--muted)" }}>
            exit {isNotFound ? 404 : 500}
          </span>
        </div>
        <div className="err-body">
          <p className="err-cmdline">
            <span className="ps1">zhen@lab</span>
            <span style={{ color: "var(--muted)" }}> {isAdmin ? "~/admin" : "~/site"} </span>
            <span className="ps1">❯</span>{" "}
            {isNotFound ? (
              <span className="arg is-missing">cd {path}</span>
            ) : (
              <span className="arg">render --path={path}</span>
            )}
          </p>
          <div>
            <span className="err-pill">
              {isNotFound
                ? t(locale, "err.404.pill")
                : t(locale, "err.500.pill")}
            </span>
          </div>
          <h1 className="err-h1">
            {isNotFound ? 404 : 500}
            <span className="exit">
              {isNotFound
                ? t(locale, "err.404.heading")
                : t(locale, "err.500.heading")}
            </span>
          </h1>
          {leadKey && errorMessage ? (
            <p className="err-msg">{errorMessage}</p>
          ) : !errorMessage && leadKey ? (
            <p className="err-msg">{t(locale, leadKey)}</p>
          ) : errorMessage ? (
            <p className="err-msg">{errorMessage}</p>
          ) : isNotFound ? (
            <p className="err-msg">{t(locale, "err.404.lead")}</p>
          ) : null}
          {!isNotFound && errorDigest && (
            <p className="err-digest">digest · {errorDigest}</p>
          )}
          <div className="err-actions">
            {isNotFound ? (
              <a className="err-btn" href={resetHref}>
                <kbd>cd</kbd> {t(locale, isAdmin ? "err.action.cdAdmin" : "err.action.cdHome")}
              </a>
            ) : (
              <>
                <button
                  type="button"
                  className="err-btn"
                  onClick={() => window.location.reload()}
                >
                  <kbd>↩</kbd> {t(locale, "err.action.retry")}
                </button>
                <a className="err-btn err-btn-ghost" href={resetHref}>
                  <kbd>cd</kbd> {t(locale, isAdmin ? "err.action.cdAdmin" : "err.action.cdHome")}
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
