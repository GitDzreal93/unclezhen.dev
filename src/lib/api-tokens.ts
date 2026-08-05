import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { query } from "./db";
import { API_SCOPES, type ApiScope } from "./api-scopes";
export { API_SCOPES, type ApiScope } from "./api-scopes";

type ApiTokenRow = {
  id: string; name: string; prefix: string; token_hash: string; scopes: ApiScope[];
  expires_at: Date | null; revoked_at: Date | null;
};

export type ApiToken = Omit<ApiTokenRow, "token_hash"> & {
  last_used_at?: Date | null; last_used_ip?: string | null; created_at?: Date; updated_at?: Date;
};
export type AuthenticatedApiToken = { id: string; name: string; prefix: string; scopes: ApiScope[] };

export class ApiAuthError extends Error {
  constructor(readonly code: "unauthorized" | "forbidden", readonly tokenId?: string) {
    super(code === "unauthorized" ? "Invalid API token" : "Token lacks the required scope");
  }
}

export function hashApiToken(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}

export function generateApiToken() {
  const secret = `zhen_${randomBytes(32).toString("base64url")}`;
  return { secret, tokenHash: hashApiToken(secret), prefix: secret.slice(0, 13) };
}

export function normalizeScopes(scopes: unknown): ApiScope[] {
  if (!Array.isArray(scopes) || scopes.length === 0) throw new Error("至少选择一个有效权限");
  const values = scopes.map(String);
  if (new Set(values).size !== values.length || values.some((value) => !API_SCOPES.includes(value as ApiScope))) {
    throw new Error("包含无效或重复权限");
  }
  return values as ApiScope[];
}

function bearerToken(request: Request) {
  const value = request.headers.get("authorization") ?? "";
  const match = /^Bearer (zhen_[A-Za-z0-9_-]{30,})$/.exec(value);
  return match?.[1] ?? null;
}

function sourceIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip") || undefined;
}

export async function writeApiAuditLog(input: {
  tokenId?: string; method: string; route: string; resourceId?: string; statusCode: number;
  requestId: string; sourceIp?: string; failureCode?: string;
}) {
  await query(
    `INSERT INTO api_token_audit_logs
      (token_id,method,route,resource_id,status_code,request_id,source_ip,failure_code)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [input.tokenId ?? null, input.method, input.route, input.resourceId ?? null, input.statusCode,
      input.requestId, input.sourceIp ?? null, input.failureCode ?? null],
  );
}

export async function requireApiScope(request: Request, requiredScope: ApiScope): Promise<AuthenticatedApiToken> {
  const secret = bearerToken(request);
  if (!secret) throw new ApiAuthError("unauthorized");
  const hash = hashApiToken(secret);
  const rows = await query<ApiTokenRow>(
    `SELECT id,name,prefix,token_hash,scopes,expires_at,revoked_at FROM api_tokens WHERE token_hash=$1 LIMIT 1`, [hash],
  );
  const token = rows[0];
  if (!token || token.revoked_at || (token.expires_at && token.expires_at <= new Date())) {
    throw new ApiAuthError("unauthorized");
  }
  const expected = Buffer.from(token.token_hash, "hex");
  const supplied = Buffer.from(hash, "hex");
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) throw new ApiAuthError("unauthorized");
  const scopes = normalizeScopes(token.scopes);
  if (!scopes.includes(requiredScope)) throw new ApiAuthError("forbidden", token.id);
  await query("UPDATE api_tokens SET last_used_at=now(),last_used_ip=$2,updated_at=now() WHERE id=$1", [token.id, sourceIp(request) ?? null]);
  return { id: token.id, name: token.name, prefix: token.prefix, scopes };
}

export async function listApiTokens(): Promise<ApiToken[]> {
  return query<ApiToken>(`SELECT id,name,prefix,scopes,expires_at,revoked_at,last_used_at,last_used_ip,created_at,updated_at
    FROM api_tokens ORDER BY created_at DESC`);
}
