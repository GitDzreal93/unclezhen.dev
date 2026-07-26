import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

// Render Markdown to sanitized HTML. Runs server-side so marked/DOMPurify stay
// out of the client bundle, and sanitizing is mandatory because the output is
// injected via dangerouslySetInnerHTML.
export function renderMarkdown(md: string): string {
  const raw = marked.parse(md ?? "", { async: false }) as string;
  return DOMPurify.sanitize(raw, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["target", "rel"],
  });
}
