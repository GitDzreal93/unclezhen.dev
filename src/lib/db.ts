import { Pool } from "pg";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Resolve the DSN with .env.local taking precedence over an inherited shell
// value. Next.js normally loads .env.local, but a variable already present in
// the process environment wins — and this machine's shell exports POSTGRES_DSN
// pointing at a different database. Reading the file directly keeps the project
// pinned to its own database regardless of the surrounding shell.
function resolveDsn(): string | undefined {
  try {
    const raw = readFileSync(join(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*POSTGRES_DSN\s*=\s*(.*)\s*$/);
      if (m) return m[1].trim();
    }
  } catch {
    // .env.local not present (e.g. production) — fall back to process env.
  }
  return process.env.POSTGRES_DSN;
}

const globalForPg = globalThis as unknown as { pgPool?: Pool };

export const pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString: resolveDsn(),
    max: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPg.pgPool = pool;
}

// Wraps any pg error so the upstream `error.tsx` boundary and the dev overlay
// always see a meaningful `.message` — pg-pool's connection-refused failure is
// an `AggregateError` whose own message is empty, which Next renders as
// "An error occurred in the Server Components render but no message was
// provided". Carrying the original code (e.g. ECONNREFUSED, 42P01) keeps logs
// useful and lets callers tell "DB down" apart from "syntax error".
export class DbError extends Error {
  code?: string;
  query?: string;
  cause?: unknown;
  constructor(message: string, opts: { code?: string; query?: string; cause?: unknown } = {}) {
    super(message);
    this.name = "DbError";
    this.code = opts.code;
    this.query = opts.query;
    this.cause = opts.cause;
  }
}

function describePgError(e: unknown, query: string): DbError {
  if (e instanceof DbError) return e;
  // pg rejects with a plain object on connection failures (AggregateError or
  // an Error with no message). Build a useful one from whatever fields it has.
  const any = e as { code?: string; message?: string; errors?: unknown[] };
  const code = any?.code;
  const msg = (any?.message || "").trim();

  // Connection-class codes get a friendlier operator message; the raw code is
  // still in `DbError.code` for logs.
  const connectionCodes = new Set([
    "ECONNREFUSED",
    "ENOTFOUND",
    "ETIMEDOUT",
    "ECONNRESET",
    "EHOSTUNREACH",
  ]);
  if (code && connectionCodes.has(code)) {
    return new DbError(
      `数据库连接失败 (${code})，请检查 Postgres 是否启动、DSN 是否正确`,
      { code, query, cause: e }
    );
  }
  if (msg) {
    return new DbError(`数据库错误：${msg}`, { code, query, cause: e });
  }
  // Last-resort fallback — the original object had nothing readable. Never
  // throw an empty-message error again.
  return new DbError(
    `数据库错误：未能解析 pg 抛出的错误对象（code=${code ?? "?"}）`,
    { code, query, cause: e }
  );
}

// Short, single-line preview of the query for log/error context.
function preview(text: string): string {
  const collapsed = text.replace(/\s+/g, " ").trim();
  return collapsed.length > 120 ? collapsed.slice(0, 117) + "…" : collapsed;
}

export async function query<T = any>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  try {
    const res = await pool.query(text, params);
    return res.rows as T[];
  } catch (e) {
    throw describePgError(e, preview(text));
  }
}
