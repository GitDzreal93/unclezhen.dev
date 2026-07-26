import LogoutButton from "../LogoutButton";

export const dynamic = "force-dynamic";

export default function AdminSettings() {
  return (
    <>
      <div className="admin-head">
        <h1>设置</h1>
      </div>
      <div className="settings-card">
        <h2>会话与安全</h2>
        <p>
          后台通过 Cookie 会话鉴权。登录走{" "}
          <span className="mono">POST /api/admin/login</span>，登出走{" "}
          <span className="mono">POST /api/admin/logout</span>。会话有效期 7
          天，修改管理密码会立即让所有已登录会话失效。
        </p>
        <div className="settings-row">
          <span className="k">鉴权方式</span>
          <span className="v">HMAC-SHA256 Cookie</span>
        </div>
        <div className="settings-row">
          <span className="k">站点品牌</span>
          <span className="v">unclezhen.dev · 臻叔</span>
        </div>
        <div className="settings-row">
          <span className="k">管理密码</span>
          <span className="v">环境变量 ADMIN_PASSWORD</span>
        </div>
        <div className="settings-row">
          <span className="k">设计 token</span>
          <span className="v">见 docs/admin/DESIGN.md</span>
        </div>
        <div className="admin-form__actions" style={{ marginTop: 4 }}>
          <LogoutButton />
        </div>
      </div>
    </>
  );
}
