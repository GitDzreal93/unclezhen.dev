"use client";

import { useEffect, useState, useTransition } from "react";
import { setThemeAction } from "@/lib/theme/actions";
import type { Theme } from "@/lib/theme/cookie";

// Two-button toggle. Dark / light are the two states; we render one button
// per state so the affordance is always explicit. The active state is
// styled via the parent's existing color tokens.
export default function ThemeSwitcher({ theme }: { theme: Theme }) {
  const [pending, startTransition] = useTransition();
  const [currentTheme, setCurrentTheme] = useState(theme);
  const other: Theme = currentTheme === "dark" ? "light" : "dark";

  useEffect(() => {
    setCurrentTheme(theme);
  }, [theme]);

  useEffect(() => {
    const sync = (event: Event) => {
      const next = (event as CustomEvent<Theme>).detail;
      if (next === "dark" || next === "light") setCurrentTheme(next);
    };
    window.addEventListener("site-theme-change", sync);
    return () => window.removeEventListener("site-theme-change", sync);
  }, []);

  function flip() {
    if (pending) return;
    const previousTheme = currentTheme;
    setCurrentTheme(other);
    document.documentElement.dataset.theme = other;
    window.dispatchEvent(new CustomEvent<Theme>("site-theme-change", { detail: other }));
    startTransition(async () => {
      try {
        await setThemeAction(other);
      } catch {
        setCurrentTheme(previousTheme);
        document.documentElement.dataset.theme = previousTheme;
        window.dispatchEvent(new CustomEvent<Theme>("site-theme-change", { detail: previousTheme }));
      }
    });
  }

  return (
    <button
      type="button"
      className="nav-theme"
      onClick={flip}
      disabled={pending}
      aria-label={`Switch to ${other} theme`}
      aria-pressed={currentTheme === "light"}
      title={pending ? "Switching theme…" : `Switch to ${other} theme`}
    >
      <svg className="nav-theme__icon" viewBox="0 0 24 24" aria-hidden="true">
        {currentTheme === "dark" ? (
          <path d="M20.2 15.1A8.4 8.4 0 0 1 8.9 3.8 8.5 8.5 0 1 0 20.2 15.1Z" />
        ) : (
          <>
            <circle cx="12" cy="12" r="3.5" />
            <path d="M12 2.5v2M12 19.5v2M21.5 12h-2M4.5 12h-2M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4M18.7 18.7l-1.4-1.4M6.7 6.7 5.3 5.3" />
          </>
        )}
      </svg>
    </button>
  );
}
