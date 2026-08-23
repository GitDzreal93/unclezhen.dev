// Schema-only migration runner. Idempotent: safe to run on every deploy.
// Does NOT touch seed content (posts, projects, products, nav_items) —
// that's `scripts/setup-db.mjs`, which is for local dev or fresh-DB seeding.
//
// Source of truth for the SQL is the SCHEMA + MIGRATIONS template literals
// in setup-db.mjs; we extract them at runtime via regex so the two scripts
// never drift. The only DDL allowed in those blocks is idempotent:
//   CREATE TABLE / INDEX IF NOT EXISTS
//   ALTER TABLE ... ADD COLUMN IF NOT EXISTS
//   DROP TABLE IF EXISTS
// If a future change needs non-idempotent DDL (column rename, backfill, ...),
// do it in a separate, manually-invoked script — do NOT add it to setup-db.mjs.
//
// Run:        node scripts/migrate.mjs
// In docker:  docker compose exec -T app node scripts/migrate.mjs
// Via npm:    npm run db:migrate
import pg from "pg";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load POSTGRES_DSN from .env.local (local dev) or fall back to process.env
// (production: docker compose env_file injects it from /opt/unclezhen/.env).
function loadEnv() {
  try {
    const raw = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
      if (m) process.env[m[1]] = m[2].trim();
    }
  } catch {
    // .env.local not present (production) — process.env from docker env_file wins.
  }
}
loadEnv();

if (!process.env.POSTGRES_DSN) {
  console.error("POSTGRES_DSN is not set; aborting.");
  process.exit(1);
}

const source = readFileSync(join(__dirname, "setup-db.mjs"), "utf8");
const schema = source.match(/const SCHEMA = `([\s\S]*?)`;/)?.[1];
const migrations = source.match(/const MIGRATIONS = `([\s\S]*?)`;/)?.[1];
if (!schema || !migrations) {
  console.error("Could not extract SCHEMA / MIGRATIONS from setup-db.mjs");
  process.exit(1);
}

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.POSTGRES_DSN });

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(schema);
    await client.query(migrations);
    await client.query("COMMIT");
    console.log("✔ schema + migrations applied");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("✖ migrations failed:", e);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
