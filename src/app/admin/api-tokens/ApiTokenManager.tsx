"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { API_SCOPES, type ApiScope } from "@/lib/api-scopes";
import { createApiToken, deleteApiToken, revokeApiToken } from "@/lib/admin";
import { t, type Locale } from "@/lib/i18n/dict";

type Token = { id: string; name: string; prefix: string; scopes: ApiScope[]; expiresAt: string | null; revokedAt: string | null; lastUsedAt: string | null };
const fmt = (value: string | null) => value ? new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";

export default function ApiTokenManager({ tokens, locale }: { tokens: Token[]; locale: Locale }) {
  const router = useRouter(); const [pending, startTransition] = useTransition();
  const [secret, setSecret] = useState(""); const [error, setError] = useState("");
  const tx = (key: string) => t(locale, `admin.api.${key}`);
  function create(form: HTMLFormElement) {
    setError(""); startTransition(async () => { try { const result = await createApiToken(new FormData(form)); setSecret(result.secret); form.reset(); router.refresh(); } catch (e) { setError(e instanceof Error ? e.message : "创建失败"); } });
  }
  function action(fn: (id: string) => Promise<void>, id: string, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    startTransition(async () => { try { await fn(id); router.refresh(); } catch (e) { setError(e instanceof Error ? e.message : "操作失败"); } });
  }
  return <>
    <div className="admin-head"><h1>{tx("title")}</h1><span className="toolbar-count">{t(locale, "admin.api.count", { count: tokens.length })}</span></div>
    <section className="settings-card token-manager">
      <h2>创建 Token</h2><p>Token 仅显示一次；请保存到 AI 或自动化工具的安全环境变量中。按资源授予最小读写权限。</p>
      <form onSubmit={(event) => { event.preventDefault(); create(event.currentTarget); }} className="api-token-form">
        <div className="field"><label htmlFor="token-name">名称</label><input id="token-name" name="name" required placeholder="content-agent-production" /></div>
        <div className="field"><label htmlFor="token-expiry">过期时间（可选）</label><input id="token-expiry" name="expiresAt" type="datetime-local" /></div>
        <fieldset className="api-token-scopes"><legend>权限范围</legend>{API_SCOPES.map((scope) => <label key={scope}><input type="checkbox" name="scopes" value={scope} /> <code>{scope}</code></label>)}</fieldset>
        <button className="btn btn--primary" disabled={pending}>{pending ? "处理中…" : "生成 Token"}</button>
      </form>
      {error && <p className="admin-login__err">{error}</p>}
      {secret && <div className="api-token-secret" role="status"><strong>请立即复制，此 Token 不会再次显示：</strong><code>{secret}</code><button className="btn btn--ghost btn--sm" onClick={() => navigator.clipboard.writeText(secret)}>复制</button><button className="btn btn--ghost btn--sm" onClick={() => setSecret("")}>我已保存</button></div>}
    </section>
    <section className="settings-card"><h2>已创建 Token</h2><div className="api-token-list">{tokens.length === 0 ? <p className="hint">还没有 Token。</p> : tokens.map((token) => {
      const expired = !!token.expiresAt && new Date(token.expiresAt) <= new Date(); const status = token.revokedAt ? "已撤销" : expired ? "已过期" : "有效";
      return <article className="api-token-row" key={token.id}><div><strong>{token.name}</strong><div className="mono muted">{token.prefix}••••</div><div className="scope-chips">{token.scopes.map((scope) => <code key={scope}>{scope}</code>)}</div></div><div className="api-token-meta"><span className={status === "有效" ? "token-status token-status--active" : "token-status"}>{status}</span><span>过期：{fmt(token.expiresAt)}</span><span>最后使用：{fmt(token.lastUsedAt)}</span></div><div className="api-token-actions">{!token.revokedAt && !expired && <button className="btn btn--ghost btn--sm" disabled={pending} onClick={() => action(revokeApiToken, token.id, "确定撤销此 Token？撤销后无法恢复。")}>撤销</button>}<button className="btn btn--ghost btn--sm" disabled={pending} onClick={() => action(deleteApiToken, token.id, "永久删除此 Token？审计记录会保留，但不能恢复。")}>删除</button></div></article>;
    })}</div></section>
    <section className="settings-card"><h2>调用方式</h2><pre className="api-token-example">{"curl -H \"Authorization: Bearer $ZHEN_TOKEN\" \\\n  https://your-domain.com/api/v1/posts"}</pre><p>完整字段与错误码请见 <code>docs/api.md</code>。</p></section>
  </>;
}
