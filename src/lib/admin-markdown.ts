// Client-safe wrapper around the markdown pipeline used by the admin form's
// live preview. Re-exports the server-side `renderMarkdown` under a name
// that signals "preview" so the form's intent is obvious. Both marked and
// isomorphic-dompurify are isomorphic (work in the browser) so this can run
// in a Client Component without bundling server-only deps.

import { renderMarkdown } from "./markdown";

export function renderMarkdownPreview(source: string): string {
  return renderMarkdown(source);
}
