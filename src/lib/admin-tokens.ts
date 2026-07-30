// Mirror of the OKLCH tokens declared in src/app/admin/admin.css. Kept here so
// the settings page can render an inline swatch grid without parsing the
// stylesheet at runtime. If you change a token value, update both.

export type DesignToken = {
  name: string;
  value: string; // the OKLCH expression
  fg?: "dark" | "light"; // text colour to use on top of the swatch
  use: string;
};

export const designTokens: DesignToken[] = [
  { name: "--bg", value: "oklch(11% 0.012 155)", fg: "light", use: "页面底" },
  { name: "--surface", value: "oklch(15% 0.016 155)", fg: "light", use: "侧栏 / 卡片 / 登录" },
  { name: "--surface-2", value: "oklch(19% 0.02 155)", fg: "light", use: "导航 hover / 当前项" },
  { name: "--fg", value: "oklch(93% 0.02 145)", fg: "dark", use: "主文字" },
  { name: "--muted", value: "oklch(62% 0.03 150)", fg: "dark", use: "次要文字 / 表头 / 标签" },
  { name: "--border", value: "oklch(28% 0.03 150)", fg: "light", use: "分割线 / 边框" },
  { name: "--accent", value: "oklch(78% 0.19 145)", fg: "dark", use: "主强调" },
  { name: "--accent-dim", value: "oklch(42% 0.1 145)", fg: "light", use: "弱描边" },
  { name: "--success", value: "oklch(74% 0.16 150)", fg: "dark", use: "成功态" },
  { name: "--warn", value: "oklch(78% 0.12 85)", fg: "dark", use: "待支付 pill" },
  { name: "--danger", value: "oklch(68% 0.16 25)", fg: "dark", use: "删除 / 危险" },
];
