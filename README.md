# unclezhen.cn — 臻叔个人站

极客终端工坊风格的个人站，高保真还原自 `docs/screen` 原型稿。技术栈 **Next.js 15 (App Router) + React 19 + PostgreSQL**，首页含 Three.js 滚动驱动 3D IP 舞台。

## 页面

| 路由 | 说明 |
|------|------|
| `/` | 站点导航启动器 |
| `/home` | 首页 · 滚动驱动 3D IP 场景（Three.js）+ 关于 / 模块 / 联系 |
| `/blog` | 技术博客 · 搜索 + 标签过滤 + 文章详情 |
| `/projects` | 项目展示 · 类型过滤 + 详情面板 |
| `/courses` | 课程 · 标签过滤 + 报名意向弹层 |
| `/shop` | 商店 · 分类过滤 + 购物车 + 演示结算 |
| `/game` | 扫地机器人房间漫游（Canvas 2D） |

内容（博客 / 项目 / 课程 / 商品）存于 PostgreSQL；联系、报名、订单表单写入数据库。

## 快速开始

```bash
npm install
npm run db:setup   # 建表并从原型数据 seed
npm run dev        # http://localhost:3000
```

生产构建：

```bash
npm run build && npm run start
```

## 环境变量

`.env.local`：

```
POSTGRES_DSN=postgres://admin:Postgres%402026@localhost:5432/unclezhen?sslmode=disable
```

> 注意：本机 shell 已导出一个指向别的库的 `POSTGRES_DSN`。`src/lib/db.ts` 与 `scripts/setup-db.mjs` 都会**优先读取 `.env.local`**，覆盖 shell 里的值，因此 `npm run dev/start` 始终连到 `unclezhen` 库。

## 数据表

`posts`、`projects`、`courses`、`products`（内容）+ `contacts`、`enrollments`、`orders`（表单提交）。订单金额在服务端按库中价格重新计算，防止前端篡改。
