import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";

export type ApiDocumentation =
  | { available: true; markdown: string }
  | { available: false; markdown: "" };

export async function getApiDocumentation(): Promise<ApiDocumentation> {
  try {
    const markdown = await readFile(join(process.cwd(), "docs", "api.md"), "utf8");
    return { available: true, markdown };
  } catch {
    return { available: false, markdown: "" };
  }
}
