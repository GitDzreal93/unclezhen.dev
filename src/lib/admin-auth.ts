import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifyToken } from "./auth";

// Belt-and-suspenders auth check for server actions and node-runtime routes.
// Middleware already guards /admin/*, but server actions can be invoked
// directly, so every mutating action calls this first.
export async function assertAdmin(): Promise<void> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!(await verifyToken(token))) {
    throw new Error("未授权");
  }
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifyToken(store.get(ADMIN_COOKIE)?.value);
}
