import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Posts carry their canonical title separately for listings and metadata. When
// editors also begin the Markdown body with that same H1, render it once in
// the article header instead of making readers see two identical titles.
export function removeLeadingMarkdownTitle(markdown: string, title: string): string {
  const source = markdown ?? "";
  const heading = new RegExp(
    `^\\s{0,3}#\\s+${escapeRegExp(title)}\\s*#*\\s*(?:\\r?\\n|$)`,
  );
  return source.replace(heading, "").trimStart();
}

// Render Markdown to sanitized HTML. Runs server-side so marked/DOMPurify stay
// out of the client bundle, and sanitizing is mandatory because the output is
// injected via dangerouslySetInnerHTML.
export function renderMarkdown(md: string): string {
  const raw = marked.parse((md ?? "").replace(/[—–]/g, "-"), { async: false }) as string;
  return DOMPurify.sanitize(raw, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["target", "rel"],
  });
}
