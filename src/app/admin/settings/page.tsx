import { cookies } from "next/headers";
import LogoutButton from "../LogoutButton";
import { ADMIN_COOKIE, tokenExpiryMs } from "@/lib/auth";
import { designTokens } from "@/lib/admin-tokens";

export const dynamic = "force-dynamic";

// Format a ms timestamp as "YYYY-MM-DD HH:mm" in the server's local time.
// Kept inline (no date-fns) to avoid a dep for one helper.
function fmtDateTime(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function AdminSettings() {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  const expiryMs = tokenExpiryMs(token);
  const siteUrl = process.env.SITE_URL || "(未设置 SITE_URL)";
  const adminPasswordSet = Boolean(process.env.ADMIN_PASSWORD);

  return (
    <>
      <div className="admin-head">
        <h1>设置</h1>
      </div>

      <div className="settings-card">
        <h2>会话与安全</h2>
        <p>
          后台通过 HMAC-SHA256 Cookie 鉴权。登录走{" "}
          <span className="mono">POST /api/admin/login</span>，登出走{" "}
          <span className="mono">POST /api/admin/logout</span>。会话有效期 7
          天，由 token 内嵌的过期时间戳判定，签名密钥派生自{" "}
          <span className="mono">ADMIN_PASSWORD</span>。
        </p>
        <div className="settings-row">
          <span className="k">鉴权方式</span>
          <span className="v">HMAC-SHA256 Cookie</span>
        </div>
        <div className="settings-row">
          <span className="k">当前会话过期</span>
          <span className="v">
            {expiryMs ? fmtDateTime(expiryMs) : "—（无活动会话）"}
          </span>
        </div>
        <div className="settings-row">
          <span className="k">管理密码</span>
          <span className="v">
            {adminPasswordSet ? "环境变量 ADMIN_PASSWORD" : "⚠ 未设置 ADMIN_PASSWORD"}
          </span>
        </div>
        <p style={{ margin: 0 }}>
          修改 <span className="mono">ADMIN_PASSWORD</span> 需重启进程；进程重启
          后所有旧 token 签名立即失效，浏览器会被踢回登录页。
        </p>
        <div className="admin-form__actions" style={{ marginTop: 4 }}>
          <LogoutButton />
        </div>
      </div>

      <div className="settings-card">
        <h2>站点</h2>
        <div className="settings-row">
          <span className="k">品牌</span>
          <span className="v">unclezhen.cn · 臻叔</span>
        </div>
        <div className="settings-row">
          <span className="k">SITE_URL</span>
          <span className="v">{siteUrl}</span>
        </div>
        <p style={{ margin: 0 }}>
          品牌名当前为源码硬编码；如需在管理后台编辑，请接入 <span className="mono">site_settings</span>{" "}
          表后再做。
        </p>
      </div>

      <div className="settings-card">
        <h2>设计 token</h2>
        <p>
          与 <span className="mono">src/app/admin/admin.css</span> 同源；值变更需
          同步更新 <span className="mono">src/lib/admin-tokens.ts</span>。
        </p>
        <div className="token-grid">
          {designTokens.map((t) => (
            <div key={t.name} className="token-swatch">
              <div
                className="token-swatch__chip"
                style={{
                  background: t.value,
                  color: t.fg === "dark" ? "#0a1410" : "#e8efe9",
                }}
                aria-hidden="true"
              />
              <div className="token-swatch__body">
                <div className="token-swatch__name">{t.name}</div>
                <div className="token-swatch__val">{t.value}</div>
                <div className="token-swatch__use">{t.use}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
