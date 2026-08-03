"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { SUPPORTED_LOCALES, type Locale } from "./dict";

const COOKIE = "locale";
const MAX_AGE = 60 * 60 * 24 * 365;

// Set the locale cookie and revalidate the root layout. Co-located with
// the action so the client `LocaleSwitcher` doesn't transitively import
// next/headers via the cookie helper.
async function setLocaleCookie(locale: Locale) {
  if (!(SUPPORTED_LOCALES as string[]).includes(locale)) return;
  const store = await cookies();
  store.set(COOKIE, locale, {
    path: "/",
    maxAge: MAX_AGE,
    sameSite: "lax",
  });
}

export async function setLocaleAction(locale: Locale) {
  await setLocaleCookie(locale);
  revalidatePath("/", "layout");
}
