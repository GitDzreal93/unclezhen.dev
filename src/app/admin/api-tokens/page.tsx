import { listApiTokens } from "@/lib/api-tokens";
import { getLocale } from "@/lib/i18n/cookie";
import { getApiDocumentation } from "@/lib/api-documentation";
import { renderMarkdown } from "@/lib/markdown";
import ApiTokenManager from "./ApiTokenManager";

export const dynamic = "force-dynamic";

export default async function AdminApiTokensPage() {
  const [tokens, locale, documentation] = await Promise.all([
    listApiTokens(),
    getLocale(),
    getApiDocumentation(),
  ]);
  const documentHtml = documentation.available ? renderMarkdown(documentation.markdown) : "";

  return <ApiTokenManager tokens={tokens.map((token) => ({
    id: token.id, name: token.name, prefix: token.prefix, scopes: token.scopes,
    expiresAt: token.expires_at?.toISOString() ?? null, revokedAt: token.revoked_at?.toISOString() ?? null,
    lastUsedAt: token.last_used_at?.toISOString() ?? null,
  }))} locale={locale} documentation={{
    available: documentation.available,
    markdown: documentation.markdown,
    html: documentHtml,
  }} />;
}
