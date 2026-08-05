"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { API_SCOPES, type ApiScope } from "@/lib/api-scopes";
import { createApiToken, deleteApiToken, revokeApiToken } from "@/lib/admin";
import { t, type Locale } from "@/lib/i18n/dict";

type Token = { id: string; name: string; prefix: string; scopes: ApiScope[]; expiresAt: string | null; revokedAt: string | null; lastUsedAt: string | null };
type Documentation = { available: boolean; markdown: string; html: string };

const fmt = (value: string | null) => value ? new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";

export default function ApiTokenManager({ tokens, locale, documentation }: { tokens: Token[]; locale: Locale; documentation: Documentation }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");
  const tx = (key: string) => t(locale, `admin.api.${key}`);

  function downloadDocumentation(button: HTMLButtonElement) {
    const blob = new Blob([documentation.markdown], { type: "text/markdown;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = "public-content-api.md";
    link.hidden = true;
    button.dataset.downloaded = "true";
    window.setTimeout(() => { delete button.dataset.downloaded; }, 800);
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(href), 0);
  }

  function create(form: HTMLFormElement) {
    setError("");
    startTransition(async () => {
      try {
        const result = await createApiToken(new FormData(form));
        setSecret(result.secret);
        form.reset();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "创建失败");
      }
    });
  }

  function action(fn: (id: string) => Promise<void>, id: string, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    startTransition(async () => {
      try {
        await fn(id);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "操作失败");
      }
    });
  }

  return <>
    <div className="admin-head api-workspace__head">
      <div><span className="eyebrow">Access control</span><h1>{tx("title")}</h1></div>
      <span className="toolbar-count">{t(locale, "admin.api.count", { count: tokens.length })}</span>
    </div>
    <div className="api-workspace">
      <div className="api-workspace__tokens">
        <section className="settings-card token-manager">
          <h2>创建 Token</h2>
          <p>Token 仅显示一次；请保存到 AI 或自动化工具的安全环境变量中。按资源授予最小读写权限。</p>
          <form onSubmit={(event) => { event.preventDefault(); create(event.currentTarget); }} className="api-token-form">
            <div className="field"><label htmlFor="token-name">名称</label><input id="token-name" name="name" required placeholder="content-agent-production" /></div>
            <div className="field"><label htmlFor="token-expiry">过期时间（可选）</label><input id="token-expiry" name="expiresAt" type="datetime-local" /></div>
            <fieldset className="api-token-scopes"><legend>权限范围</legend>{API_SCOPES.map((scope) => <label key={scope}><input type="checkbox" name="scopes" value={scope} /> <code>{scope}</code></label>)}</fieldset>
            <button className="btn btn--primary" disabled={pending}>{pending ? "处理中…" : "生成 Token"}</button>
          </form>
          {error && <p className="admin-login__err">{error}</p>}
          {secret && <div className="api-token-secret" role="status"><strong>请立即复制，此 Token 不会再次显示：</strong><code>{secret}</code><button className="btn btn--ghost btn--sm" onClick={() => navigator.clipboard.writeText(secret)}>复制</button><button className="btn btn--ghost btn--sm" onClick={() => setSecret("")}>我已保存</button></div>}
        </section>

        <section className="settings-card">
          <h2>已创建 Token</h2>
          <div className="api-token-list">{tokens.length === 0 ? <p className="hint">还没有 Token。</p> : tokens.map((token) => {
            const expired = !!token.expiresAt && new Date(token.expiresAt) <= new Date();
            const status = token.revokedAt ? "已撤销" : expired ? "已过期" : "有效";
            return <article className="api-token-row" key={token.id}><div><strong>{token.name}</strong><div className="mono muted">{token.prefix}••••</div><div className="scope-chips">{token.scopes.map((scope) => <code key={scope}>{scope}</code>)}</div></div><div className="api-token-meta"><span className={status === "有效" ? "token-status token-status--active" : "token-status"}>{status}</span><span>过期：{fmt(token.expiresAt)}</span><span>最后使用：{fmt(token.lastUsedAt)}</span></div><div className="api-token-actions">{!token.revokedAt && !expired && <button className="btn btn--ghost btn--sm" disabled={pending} onClick={() => action(revokeApiToken, token.id, "确定撤销此 Token？撤销后无法恢复。")}>撤销</button>}<button className="btn btn--ghost btn--sm" disabled={pending} onClick={() => action(deleteApiToken, token.id, "永久删除此 Token？审计记录会保留，但不能恢复。")}>删除</button></div></article>;
          })}</div>
        </section>
      </div>

      <aside className="api-docs" aria-labelledby="api-docs-title">
        {documentation.available ? <>
          <header className="api-docs__head"><div><span className="eyebrow">Reference / v1</span><h2 id="api-docs-title">Public Content API</h2></div><button className="btn btn--ghost btn--sm" type="button" data-api-doc-download onClick={(event) => downloadDocumentation(event.currentTarget)}>导出 .md</button></header>
          <nav className="api-docs__nav" aria-label="接口文档章节"><a href="#鉴权与权限">鉴权</a><a href="#端点">端点</a><a href="#数据字段">字段</a><a href="#示例">示例</a><a href="#错误格式">错误码</a></nav>
          <div className="api-docs__body" dangerouslySetInnerHTML={{ __html: documentation.html }} />
        </> : <div className="api-docs__unavailable"><h2 id="api-docs-title">接口文档暂不可用</h2><p>Token 管理不受影响；请检查部署是否包含 docs/api.md。</p></div>}
      </aside>
    </div>
  </>;
}
