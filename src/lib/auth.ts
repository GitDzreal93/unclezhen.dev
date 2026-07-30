// Stateless admin auth built on Web Crypto HMAC-SHA256 so it runs in both the
// edge runtime (middleware) and the node runtime (route handlers / server
// actions). The token is `<expiry>.<hmac>`; there is no server-side session
// store. The signing secret is derived from ADMIN_PASSWORD, so changing the
// password invalidates every existing token.

const encoder = new TextEncoder();

export const ADMIN_COOKIE = "admin_session";
const TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function getSecret(): string {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) throw new Error("ADMIN_PASSWORD is not set");
  return pw;
}

async function hmac(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Buffer.from(sig).toString("hex");
}

// Constant-time string compare to avoid leaking match position via timing.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createToken(): Promise<string> {
  const secret = getSecret();
  const expiry = String(Date.now() + TTL_MS);
  const sig = await hmac(expiry, secret);
  return `${expiry}.${sig}`;
}

export async function verifyToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot < 0) return false;
  const expiry = token.slice(0, dot);
  const exp = Number(expiry);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = await hmac(expiry, getSecret()).catch(() => null);
  if (!expected) return false;
  // Constant-time compare against the supplied signature (everything after the
  // first dot), not the re-signed expiry.
  const sig = token.slice(dot + 1);
  return timingSafeEqual(sig, expected);
}

// Extract the expiry timestamp (ms) from a session token without verifying the
// signature. For UI display only — verifyToken is the security boundary.
export function tokenExpiryMs(token: string | undefined): number | null {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot < 0) return null;
  const exp = Number(token.slice(0, dot));
  return Number.isFinite(exp) ? exp : null;
}

export function checkPassword(input: unknown): boolean {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || typeof input !== "string") return false;
  return timingSafeEqual(input, pw);
}
