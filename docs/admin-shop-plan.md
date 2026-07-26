# 管理后台 + 虚拟商品发货系统 + z-pay 支付 — 实施方案

> 状态：已确认，开工中。分支 `feat/admin-shop`。

## 目标概述

给臻叔个人站加一个管理后台，管理**博客、项目、商品**三类内容；把原来的「课程」概念取消——课程/资料一律作为**商品**维护。商品是**虚拟物品**，购买成功后自动发货（网盘链接 / 卡密），带库存管理，形态类似 [独角数卡 dujiaoka](https://github.com/assimon/dujiaoka)。结算走 [z-pay](https://member.z-pay.cn/member/doc.html)（易支付标准）页面跳转支付。博客只以 Markdown 为正文格式，但后台提供把富文本（微信公众号 / 飞书等）转成 Markdown 的能力。

## 一、核心模型转变

- **删除「课程」**：删除 `/courses` 页、`courses` 表、`/api/enroll`、`enrollments` 相关前台流程。课程/资料作为商品维护。
- **商品 = 虚拟物品**，购买成功后自动发货，两种发货模式：
  - `fixed`（固定内容）：所有买家拿到同一份内容（一个网盘链接 / 提取码）。库存可无限或计数。
  - `card`（卡密池）：每笔订单从卡密池取一条唯一内容（激活码 / 独立链接）。库存 = 未售卡密数，售罄不可买。
- **单商品下单**取代原多商品购物车（贴合发卡系统）。

## 二、数据层（`scripts/setup-db.mjs` 幂等迁移 + `src/lib/data.ts`）

```sql
-- products 扩展（ADD COLUMN IF NOT EXISTS，保证二次运行不报错）
products:
  + delivery_mode text NOT NULL DEFAULT 'fixed'   -- 'fixed' | 'card'
  + fixed_content text NOT NULL DEFAULT ''         -- fixed 模式发货内容
  + stock int NOT NULL DEFAULT -1                  -- -1 = 无限；fixed 模式用；card 模式由 cards 计算
  -- 移除课程相关字段的使用（level/hours/audience/outcome/outline 若已加则忽略）

-- 卡密池
CREATE TABLE cards (
  id serial PRIMARY KEY,
  product_id text NOT NULL,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'unused',  -- 'unused' | 'sold'
  order_id int,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- orders 重构
orders:
  + out_trade_no text UNIQUE      -- 商户订单号
  + product_id text
  + product_name text
  + qty int NOT NULL DEFAULT 1
  + status text NOT NULL DEFAULT 'pending'  -- 'pending' | 'paid'
  + trade_no text                 -- z-pay 订单号
  + pay_type text
  + delivered_content text        -- 发货内容
  + paid_at timestamptz
  (保留 email, total/amount, created_at)

DROP TABLE IF EXISTS courses;   -- 已删则跳过
```

- 迁移把现有 6 个 product 补默认 `fixed` 模式。
- 博客 `posts.body` 用 turndown 从现有 HTML 转成 Markdown 落库（语义从 HTML 改为 Markdown 源文）。
- `data.ts`：扩展 `Product` 类型，新增 `cards`/`orders` 读写与各类 CRUD 函数；移除 `getCourses`。

## 三、z-pay 页面跳转支付（`src/lib/zpay.ts` + API）

易支付标准（MD5 签名）。环境变量：`ZPAY_URL`（网关域名）、`ZPAY_PID`、`ZPAY_KEY`（key 只在服务端）。

- **签名算法**：参数按 key 升序排序，排除 `sign`/`sign_type`/空值，拼成 `a=b&c=d`（值不 URL 编码），末尾直接拼商户 `key`，MD5 小写。
- **下单** `POST /api/orders`：校验库存 → 服务端算金额 → 生成 `out_trade_no` → 建 pending 订单 → 签名 → 返回 `submit.php` 表单参数 → 前端自动 POST 跳转 z-pay 收银台。
  - 参数：`pid`、`type`（alipay/wxpay）、`out_trade_no`、`notify_url`、`return_url`、`name`、`money`、`sign`、`sign_type`。
- **异步回调** `GET /api/pay/notify`：验签 → 核对金额 → `trade_status === 'TRADE_SUCCESS'` → 幂等（已 paid 直接返回）→ 事务内分配卡密 / 固定内容、扣库存、置 paid、写 `delivered_content` → **返回纯文本 `success`**（非 JSON，否则 z-pay 重试）。
  - 卡密分配用 `SELECT ... FOR UPDATE SKIP LOCKED` 防超卖。
- **同步回跳** `return_url` → `/orders/[out_trade_no]` 展示订单状态与发货内容（轮询到发货完成）。
- **订单查询页** `/orders`：邮箱 + 订单号找回已购内容（防回跳页丢失）。

## 四、鉴权（env 密码 + HMAC Cookie）

- `.env.local` 加 `ADMIN_PASSWORD`。
- `src/lib/auth.ts`：Web Crypto HMAC-SHA256 无状态 token（middleware edge runtime 只验签不查库）。
- `src/middleware.ts`：保护 `/admin/*`（放行 `/admin/login`），校验 httpOnly + sameSite=lax cookie，失败重定向登录页。
- `POST /api/admin/login`（校验密码、种 cookie）、`POST /api/admin/logout`。

## 五、后台 `src/app/admin/*`（Server Actions CRUD + `assertAdmin()` 兜底）

- 外壳 `layout.tsx` + `admin.css` + 仪表盘（各类内容数量 + 入口）。
- `login/`：登录表单。
- **商品**：列表 + 编辑（发货模式 / 固定内容 / 库存 / 价格 / 分类 / 排序）。
- **卡密池**：按商品批量粘贴导入、看未售 / 已售、删未售。
- **订单**：列表、状态、发货内容、手动补发 / 标记已付（兜底）。
- **博客**：Markdown 编辑器 + 富文本→Markdown 导入器 + 实时预览。
- **项目**：列表 + 编辑。
- 增删改用 Server Actions（`src/lib/admin.ts`，每个 action 内 `assertAdmin()` 兜底）+ `revalidatePath` 刷新前台。

## 六、博客 Markdown 与渠道转换

- 平台内部只存 Markdown。前台渲染放**服务端**（`blog/page.tsx` 里 `marked` → 消毒 → 传干净 HTML），避免把 marked/DOMPurify 打进客户端 bundle 且防 XSS。
- 依赖：`marked`（MD→HTML）、`isomorphic-dompurify`（消毒）、`turndown`（HTML→MD）。
- **富文本导入器**（后台文章编辑页），两条路径：
  1. **粘贴富文本 / HTML**（主通道）：从微信公众号 / 飞书复制的带结构内容，前端 turndown 转 Markdown 填入编辑器。几乎总能用。
  2. **粘贴 URL 抓取**（增强，尽力而为）：`POST /api/admin/import` 后端 fetch 目标页提取正文 → turndown。公众号抓 `#js_content`；飞书多需鉴权可能失败，失败时提示改用粘贴富文本。
- 已知约束：公众号图片有防盗链，抓来的 `<img>` 在本站跨域可能 403。

## 七、前台合并

- `/shop`：商品网格（价格 + 售罄态）→ 点商品进购买（邮箱 + 数量 + 支付方式）→ z-pay。移除多商品购物车。
- 删 `src/app/courses/*`，`src/lib/nav.ts` 去掉课程入口。

## 八、已识别的坑（已在方案中规避）

1. **`notify_url` 必须公网可达**——本地测支付要内网穿透（cpolar/ngrok）或部署到公网。上线前最大约束。
2. 回调**幂等 + 验签 + 金额核对**，只认 `TRADE_SUCCESS`，回纯文本 `success`。
3. 迁移**幂等**（`ADD COLUMN IF NOT EXISTS`、`DROP TABLE IF EXISTS courses`）。
4. 博客 Markdown **服务端渲染 + 消毒**（`dangerouslySetInnerHTML` 防 XSS）。
5. **公众号抓取图片防盗链**，URL 抓取尽力而为，**粘贴富文本是主通道**。
6. 卡密并发分配用**事务 + 行锁**（`FOR UPDATE SKIP LOCKED`）防超卖。
7. middleware 在 **edge runtime** 不能用 `pg`——token 无状态 HMAC 只验签；DB 操作放 node runtime 的 Server Actions / API。

## 九、落地阶段

1. **数据层 + 迁移**：schema、data.ts、setup-db.mjs。
2. **鉴权**：auth.ts、middleware、登录/登出。
3. **后台**：外壳、商品、卡密、订单、项目。
4. **z-pay 支付**：zpay.ts、下单、回调、订单页、订单查询。
5. **博客**：Markdown 存储改造、服务端渲染、后台编辑器 + 富文本导入器。
6. **前台合并**：/shop 单商品下单、删 /courses、导航。

## 十、需要用户手动完成

1. `.env.local` 填 `ADMIN_PASSWORD`、`ZPAY_URL`、`ZPAY_PID`、`ZPAY_KEY`。
2. `npm i marked turndown isomorphic-dompurify`（+ 对应 `@types`）。
3. `npm run db:setup` 跑迁移。
