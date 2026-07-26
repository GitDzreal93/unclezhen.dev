# 臻叔 Admin · 设计语言

> 从 `unclezhen.dev` 前台 `globals.css` + 后台 `admin.css` 原样提取，后台与站点共用同一套 token。

**一句话系统：** 深色终端感工具台 —— 墨绿底、酸性绿强调、等宽数字与按钮；**后台比前台更密**：控件 28–32px，侧栏壳 + 表格/表单；长文编辑用全高工作区。

---

## 色板（OKLCH，原样绑定）

| Token | 值 | 用途 |
|---|---|---|
| `--bg` | `oklch(11% 0.012 155)` | 页面底 |
| `--surface` | `oklch(15% 0.016 155)` | 侧栏、卡片、登录卡 |
| `--surface-2` | `oklch(19% 0.02 155)` | 导航 hover / 当前项 |
| `--fg` | `oklch(93% 0.02 145)` | 主文字 |
| `--muted` | `oklch(62% 0.03 150)` | 次要文字、表头、标签 |
| `--border` | `oklch(28% 0.03 150)` | 分割线、边框 |
| `--accent` | `oklch(78% 0.19 145)` | 主强调（当前导航、主按钮、数字强调） |
| `--accent-dim` | `oklch(42% 0.1 145)` | 强调边框/弱描边 |
| `--success` | `oklch(74% 0.16 150)` | 成功态 |
| `--warn` | `oklch(78% 0.12 85)` | 待支付 pill |
| `--danger` | `oklch(68% 0.16 25)` | 删除/危险操作 |

语义补充（admin 内联）：
- 危险描边按钮：`oklch(50% 0.12 25)` 边 / `oklch(72% 0.16 25)` 字
- Warn pill：`oklch(80% 0.15 70)` 字 / `oklch(50% 0.1 70)` 边

**强调纪律：** 每屏可见 accent ≤ 2 处（如当前导航 + 一个主 CTA）。数字统计用 mono，不必整卡铺 accent。

---

## 字体

| 角色 | 栈 |
|---|---|
| Display / 标题 | `"JetBrains Mono", "IBM Plex Mono", ui-monospace, Menlo, monospace` |
| Body | `"IBM Plex Sans", "SF Pro Text", system-ui, sans-serif` |
| Mono / 数据 | 同 Display（订单号、价格、ID、表单代码区） |

- 后台品牌字 `zhen_admin`：mono 600，`letter-spacing: 0.02em`，`>` 标记用 accent
- 页面 H1：24px（admin 覆盖全局大 display）
- 表头：12px uppercase，`letter-spacing: 0.04em`，muted
- 按钮：mono 13px，uppercase，`letter-spacing: 0.04em`
- Eyebrow（登录）：12px mono uppercase，`0.08em` tracking + 8px 方点

---

## 密度尺度（Admin 专用，比前台更紧）

| 角色 | 值 |
|---|---|
| 控件高度 | `--control-h: 32px` / sm `28px` |
| 正文 | 13px / line 1.45 |
| 标签 | 11px uppercase，`0.04em` |
| 页面 H1 | 18px mono |
| 侧栏宽 | 200px |
| 主区 padding | 22×28 |
| 圆角 | 控件 6 / 按钮 4 / pill 999 |
| 表单 gap | 12px（非 16） |
| 表格单元格 | 8×10 |

后台**关闭**前台 body 网格/扫描线装饰，避免编辑页视觉噪声。

---

## 布局骨架

```
┌──────────┬─────────────────────────────┐
│ 200px    │  main max ~1080px           │
│ sticky   │  padding 22×28              │
│ side     │  head (title + sm CTA)      │
│ surface  │  stats / table / form       │
└──────────┴─────────────────────────────┘
```

**文章编辑（例外）**：主区 full-bleed 工作区，结构为

```
顶栏：标题 · ID · 脏状态 · [返回] [保存]
元数据条：ID | 标题 | 日期 | 标签 | 排序 + 摘要
工具条：分栏 / 只写 / 只预览 · 导入 · ⌘S
[可选导入抽屉]
┌ Markdown 全文高 ┬ 预览 全文高 ┐
└─────────────────┴─────────────┘
```

- Shell：`grid 200px 1fr`
- ≤860px：侧栏横排；编辑器分栏改单列
- 登录：居中卡 max 320px，radius 10

导航：仪表盘 · 商品 · 卡密池 · 订单 · 博客 · 项目 · 设置

---

## 组件

### 统计卡
- surface、1px border、radius 6、padding 14
- 数字 24px mono；标签 12px muted

### 表格
- 13px；padding 8×10；操作列 ghost sm + danger

### 按钮
- 默认高 32；**列表/表单主操作一律 `btn--sm`（28）**
- Primary：accent + 轻 glow（弱于前台 CTA）
- Ghost：中性 border（非亮绿描边洪水）
- Danger：红描边小钮

### 表单
- max-width 640px；label uppercase 11px
- input h=32，radius 6，border=`--border`（统一，不用半透明白各写各的）
- focus：2px accent 环（非 3px 大光晕）
- textarea 短字段 72–80px；代码类用 mono 12.5

### 文章编辑器
- 导入默认**折叠**，需要时点开，不占主路径
- 分栏/只写/只预览可切换；预览区独立滚动
- ⌘/Ctrl+S 保存并留在页；脏状态「未保存」提示

### 空态
- muted 居中，padding 32 0

---

## 姿态规则（Posture）

1. **工具密度优先** — 后台不是营销页；控件紧、字阶小、无装饰网格。
2. **等宽即信任** — ID、金额、订单号、卡密、字数 mono。
3. **绿只点到为止** — 当前导航 + 一个主 CTA；ghost 用中性边。
4. **圆角统一** — 6 / 4 / 999，禁止同一页混用 8/10/12/14。
5. **长文 = 工作区** — 元数据收顶，编辑区吃满视口；不把 MD 塞进普通表单流。
6. **危险需确认** — 删除 confirm；订单补发就地编辑。

---

## 屏幕地图

| 路由 | 屏 | 核心交互 |
|---|---|---|
| `/admin/login` | 登录 | 密码提交 |
| `/admin` | 仪表盘 | 6 统计卡跳转 |
| `/admin/products` | 商品列表 | 新建 / 编辑 / 删除 |
| `/admin/products/new\|:id` | 商品表单 | 发货方式切换 fixed/card |
| `/admin/cards` | 卡密池 | 选商品、批量导入、删未售 |
| `/admin/orders` | 订单 | 补发/改、标记已付 |
| `/admin/posts` | 博客列表 | 新建 / 编辑 / 删除 |
| `/admin/posts/new\|:id` | 文章表单 | MD 分栏预览、富文本导入 |
| `/admin/projects` | 项目列表 | 新建 / 编辑 / 删除 |
| `/admin/projects/new\|:id` | 项目表单 | 字段保存 |
| （设计稿扩展）设置 | 系统 | 密码提示 / 会话说明 |

---

## 禁止项

- 紫/蓝 trust 渐变、emoji 图标、左色条圆角卡
- Inter/Roboto 作标题；纯黑 `#000` / 纯白 `#fff`
- 虚构业务 KPI（转化率、DAU 等）— 仅展示源码已有计数维度
