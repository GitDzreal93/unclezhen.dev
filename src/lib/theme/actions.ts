"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import type { Theme } from "./cookie";

const MAX_AGE = 60 * 60 * 24 * 365;

async function setThemeCookie(theme: Theme) {
  const store = await cookies();
  store.set("theme", theme, {
    path: "/",
    maxAge: MAX_AGE,
    sameSite: "lax",
  });
}

export async function setThemeAction(theme: Theme) {
  if (theme !== "dark" && theme !== "light") return;
  await setThemeCookie(theme);
  revalidatePath("/", "layout");
}
