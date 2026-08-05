import { listApiTokens } from "@/lib/api-tokens";
import { getLocale } from "@/lib/i18n/cookie";
import ApiTokenManager from "./ApiTokenManager";

export const dynamic = "force-dynamic";

export default async function AdminApiTokensPage() {
  const tokens = await listApiTokens();
  const locale = await getLocale();
  return <ApiTokenManager tokens={tokens.map((token) => ({
    id: token.id, name: token.name, prefix: token.prefix, scopes: token.scopes,
    expiresAt: token.expires_at?.toISOString() ?? null, revokedAt: token.revoked_at?.toISOString() ?? null,
    lastUsedAt: token.last_used_at?.toISOString() ?? null,
  }))} locale={locale} />;
}
