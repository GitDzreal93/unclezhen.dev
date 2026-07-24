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

export async function query<T = any>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const res = await pool.query(text, params);
  return res.rows as T[];
}
