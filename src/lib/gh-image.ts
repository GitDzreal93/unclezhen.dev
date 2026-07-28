// Server-only GitHub image host. Uploads a binary asset to a GitHub repo via
// the Contents API and returns a CDN-backed link. The DB stores host + path
// separately so the CDN origin can be swapped later
// (`UPDATE images SET host = ...`) without rewriting any path.
//
// Config lives in .env.local (GH_IMG_*). Next.js loads .env.local into
// process.env for server runtime, so we read it directly here.

import { randomBytes } from "node:crypto";

export type ImageConfig = {
  token: string;
  user: string;
  repo: string;
  branch: string;
  dir: string; // e.g. "img"
  host: string; // CDN base, e.g. https://cdn.jsdelivr.net/gh
};

function required(name: string, v?: string): string {
  if (!v) throw new Error(`图床配置缺失：${name}（检查 .env.local）`);
  return v;
}

export function imageConfig(): ImageConfig {
  return {
    token: required("GH_IMG_TOKEN", process.env.GH_IMG_TOKEN),
    user: required("GH_IMG_USER", process.env.GH_IMG_USER),
    repo: required("GH_IMG_REPO", process.env.GH_IMG_REPO),
    branch: process.env.GH_IMG_BRANCH || "main",
    dir: (process.env.GH_IMG_DIR || "img").replace(/^\/+|\/+$/g, ""),
    host: (process.env.GH_IMG_HOST || "https://cdn.jsdelivr.net/gh").replace(/\/+$/, ""),
  };
}

// Per-CDN base URL. jsDelivr family: .../gh/user/repo@branch.
// raw.githubusercontent: .../user/repo/branch. Detect by host.
export function composeHost(c: ImageConfig = imageConfig()): string {
  if (/jsdelivr\.net/.test(c.host)) {
    return `${c.host}/${c.user}/${c.repo}@${c.branch}`;
  }
  return `${c.host}/${c.user}/${c.repo}/${c.branch}`;
}

export function imageUrl(host: string, path: string): string {
  return `${host}/${path.replace(/^\/+/, "")}`;
}

// Map common content types to an extension when the filename lacks one.
function extFromType(ct: string): string {
  const m: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/svg+xml": "svg",
    "image/avif": "avif",
  };
  return m[(ct || "").toLowerCase()] || "bin";
}

// ASCII-safe slug; the original (possibly CJK) name is kept verbatim in the
// `filename` DB column for reference.
function slugifyBase(name: string): string {
  const base = name.replace(/\.[^.]+$/, "");
  const slug = base
    .normalize("NFKD")
    .replace(/[^\w.-]/g, "-") // ascii word, dash, dot only
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return slug || "image";
}

export type UploadedImage = {
  id: string;
  host: string;
  path: string;
  filename: string;
  bytes: number;
  contentType: string;
  url: string;
};

// Upload a buffer to the repo under <dir>/<yyyymm>/<slug>-<shortid>.<ext>.
// The shortid makes the path collision-proof without probing the repo.
export async function uploadImage(opts: {
  filename: string;
  contentType: string;
  bytes: Uint8Array;
}): Promise<UploadedImage> {
  const c = imageConfig();
  const ym = new Date().toISOString().slice(0, 7).replace("-", ""); // yyyymm
  const shortid = randomBytes(3).toString("base64url").slice(0, 5);
  const ext = (
    opts.filename.match(/\.([a-z0-9]+)$/i)?.[1] || extFromType(opts.contentType)
  ).toLowerCase();
  const id = `${slugifyBase(opts.filename)}-${shortid}`;
  const path = `${c.dir}/${ym}/${id}.${ext}`;

  const b64 = Buffer.from(opts.bytes).toString("base64");
  const api = `https://api.github.com/repos/${c.user}/${c.repo}/contents/${path}`;
  const res = await fetch(api, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${c.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: `upload: ${opts.filename}`,
      content: b64,
      branch: c.branch,
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`GitHub 上传失败 (HTTP ${res.status}): ${t.slice(0, 160)}`);
  }

  const host = composeHost(c);

  // Best-effort jsDelivr cache purge so the asset is reachable immediately.
  // Fire-and-forget — a purge failure must never fail the upload.
  if (/jsdelivr\.net/.test(c.host)) {
    fetch(`https://purge.jsdelivr.net/gh/${c.user}/${c.repo}@${c.branch}/${path}`).catch(
      () => {}
    );
  }

  return {
    id,
    host,
    path,
    filename: opts.filename,
    bytes: opts.bytes.byteLength,
    contentType: opts.contentType,
    url: imageUrl(host, path),
  };
}
