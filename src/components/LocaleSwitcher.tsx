"use client";

import { useTransition } from "react";
import { setLocaleAction } from "@/lib/i18n/actions";
import { type Locale } from "@/lib/i18n/dict";

// Compact language toggle — uses the server action so the locale cookie
// is set + the page is revalidated, then the new language renders on the
// next request. The button itself shows the current locale label so the
// click target is obvious.
export default function LocaleSwitcher({ locale }: { locale: Locale }) {
  const [pending, startTransition] = useTransition();
  const next: Locale = locale === "zh" ? "en" : "zh";

  function toggle() {
    if (pending) return;
    startTransition(async () => {
      await setLocaleAction(next);
    });
  }

  return (
    <button
      type="button"
      className="nav-locale"
      onClick={toggle}
      disabled={pending}
      aria-label={`Switch to ${next === "zh" ? "Chinese" : "English"}`}
      title={pending ? "Switching language…" : `Switch to ${next === "zh" ? "Chinese" : "English"}`}
    >
      <span className="nav-locale__label" aria-hidden="true">
        {locale === "zh" ? "中" : "EN"}
      </span>
    </button>
  );
}
