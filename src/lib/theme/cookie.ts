import { cookies } from "next/headers";

export type Theme = "dark" | "light";
export const DEFAULT_THEME: Theme = "dark";

// Server-only reader. Kept in its own module so the client ThemeSwitcher
// doesn't transitively pull next/headers into the client bundle — the
// setThemeCookie helper lives next to the action in ./actions.ts.
export async function getTheme(): Promise<Theme> {
  const store = await cookies();
  const v = store.get("theme")?.value;
  return v === "light" ? "light" : "dark";
}
