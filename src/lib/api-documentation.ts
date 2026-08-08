import "server-only";

// The API reference is application content rather than a local docs artifact,
// so it remains available in standalone deployments even when docs/ is ignored.
const markdown = `# Public Content API

此 API 让受控的 AI Agent 或自动化流程维护站点的商品、博客和项目内容。基础路径为 /api/v1，所有响应都是 JSON，且含有 X-Request-Id；响应不会被缓存。

## 鉴权与权限

在后台的 **API Token** 页面生成 Token。明文只出现一次，服务端仅保存 SHA-256 哈希。

~~~http
Authorization: Bearer zhen_your_secret_token
~~~

可授予的权限：

| 权限 | 能力 |
| --- | --- |
| products:read / products:write | 读取 / 新增、更新、删除商品 |
| posts:read / posts:write | 读取 / 新增、更新、删除博客 |
| projects:read / projects:write | 读取 / 新增、更新、删除项目 |
| series:read / series:write | 读取 / 创建、编辑、删除合集，管理合集内文章与排序 |
| banners:read / banners:write | 读取 / 新增、更新、删除侧栏 Banner |
| images:write | 上传图片素材到图床，返回 CDN 链接与 Markdown 标签 |

读取和写入是独立授权。缺少、无效、过期或已撤销的 Token 返回 401；Token 有效但权限不足返回 403。

## 端点

| 方法 | 路径 | 权限 |
| --- | --- | --- |
| GET / POST | /products | products:read / products:write |
| GET / PATCH / DELETE | /products/:id | products:read / products:write |
| GET / POST | /posts | posts:read / posts:write |
| GET / PATCH / DELETE | /posts/:id | posts:read / posts:write |
| GET / POST | /projects | projects:read / projects:write |
| GET / PATCH / DELETE | /projects/:id | projects:read / projects:write |
| GET / POST | /series | series:read / series:write |
| GET / PATCH / DELETE | /series/:id | series:read / series:write |
| POST / PATCH | /series/:id/posts | series:write |
| DELETE | /series/:id/posts/:postId | series:write |
| GET / POST | /banners | banners:read / banners:write |
| GET / PATCH / DELETE | /banners/:id | banners:read / banners:write |
| POST | /images | images:write |

集合读取返回 { "data": [...], "meta": { "count": 1 } }，单条返回 { "data": {...} }。新增返回 201，删除返回空响应 204。

## 数据字段

POST 必须包含 id，重复 ID 返回 409。PATCH 只提交需要改动的字段，空请求返回 422。

~~~json
// posts
{ "id": "api-intro", "title": "API 维护内容", "date": "2026-08-06", "tags": ["API"], "excerpt": "摘要", "body": "Markdown 正文", "sort": 0 }

// projects
{ "id": "api-project", "name": "API 项目", "type": "工具", "year": "2026", "blurb": "简介", "problem": "问题", "solution": "方案", "result": "结果", "stack": ["Next.js"], "role": "开发", "sort": 0 }

// products
{ "id": "api-product", "name": "API 商品", "cat": "软件", "price": 99, "descr": "商品说明", "stock": -1, "sort": 0 }

// series
{ "id": "agent-notes", "title": "Agent 学习笔记", "description": "合集简介", "showNumber": true, "sort": 0 }

// banners（字段为下划线命名，与数据库列一致）
{ "id": "agent-promo", "title": "alt 文案", "image_url": "https://cdn.jsdelivr.net/gh/...", "link_url": "/blog/series/agent-notes", "sort": 0, "visible": true }
~~~

商品读取刻意不返回发货内容、发货方式、卡密和订单信息。该 API 也不能管理支付、订单、卡密或导航；图片素材通过 images:write 上传（见下文）。

## 图片上传

POST /api/v1/images 以 multipart/form-data 上传一张图片到图床（GitHub 仓库 + jsDelivr CDN），并记录到媒体库。字段：file（必填，仅 image/*，上限 8MB）、alt（可选，替代文本）。

返回单条资源：

~~~json
{ "data": { "id": "pic-abc12", "url": "https://cdn.jsdelivr.net/gh/.../pic.png", "filename": "pic.png", "markdown": "![示例图](https://cdn.jsdelivr.net/gh/.../pic.png)" } }
~~~

把返回的 markdown 直接拼进 POST /api/v1/posts 的 body 即可完成「带图发文」。该端点仅支持上传，没有列举/删除；管理已有素材请用后台「媒体」页。

## 合集与 Banner

**合集（series）** 把多篇博客文章归入有序集合。创建合集 `POST /api/v1/series`；`GET /api/v1/series/:id` 返回合集元信息 + 文章列表（按合集内顺序）。管理合集内文章：

- `POST /api/v1/series/:id/posts`，body `{ "postId": "x" }` 或 `{ "postIds": ["a","b"] }`，新成员追加到末尾。
- `PATCH /api/v1/series/:id/posts`，body `{ "postIds": ["a","b","c"] }`，按数组顺序重排（位置 0..n-1）。
- `DELETE /api/v1/series/:id/posts/:postId`，把文章移出合集（文章本身不删）。

合集的 `showNumber` 控制前台合集页是否显示文章序号（1. 2. 3.）。

**Banner** 是博客侧栏轮播的推广位。`POST /api/v1/banners` 创建（image_url 必填，link_url 可选，跳合集 /blog/series/... 或任意 URL）。字段为下划线命名（image_url / link_url / visible）。

## 示例

~~~bash
export ZHEN_TOKEN='zhen_replace_with_secret'

curl -H "Authorization: Bearer $ZHEN_TOKEN" \\
  http://localhost:3003/api/v1/posts

curl -X POST -H "Authorization: Bearer $ZHEN_TOKEN" \\
  -H "Content-Type: application/json" \\
  --data '{"id":"api-example","title":"由 API 创建","date":"2026-08-06","tags":["API"],"excerpt":"自动化内容示例","body":"这篇文章用于验证内容 API。"}' \\
  http://localhost:3003/api/v1/posts

# 上传图片到图床，返回 CDN 链接与可直接用于正文的 Markdown
curl -X POST -H "Authorization: Bearer $ZHEN_TOKEN" \\
  -F "file=@/path/to/pic.png" -F "alt=示例图" \\
  http://localhost:3003/api/v1/images

# 创建合集、加入文章并排序
curl -X POST -H "Authorization: Bearer $ZHEN_TOKEN" -H "Content-Type: application/json" \\
  --data '{"id":"agent-notes","title":"Agent 学习笔记","showNumber":true}' \\
  http://localhost:3003/api/v1/series

curl -X POST -H "Authorization: Bearer $ZHEN_TOKEN" -H "Content-Type: application/json" \\
  --data '{"postIds":["agent-protocols","agent-eval"]}' \\
  http://localhost:3003/api/v1/series/agent-notes/posts

curl -X PATCH -H "Authorization: Bearer $ZHEN_TOKEN" -H "Content-Type: application/json" \\
  --data '{"postIds":["agent-eval","agent-protocols"]}' \\
  http://localhost:3003/api/v1/series/agent-notes/posts

# 创建侧栏 Banner（image_url 来自 /api/v1/images 上传或图床）
curl -X POST -H "Authorization: Bearer $ZHEN_TOKEN" -H "Content-Type: application/json" \\
  --data '{"id":"agent-promo","title":"Agent 学习笔记","image_url":"https://cdn.jsdelivr.net/gh/.../promo.png","link_url":"/blog/series/agent-notes"}' \\
  http://localhost:3003/api/v1/banners
~~~

## 错误格式

~~~json
{
  "error": {
    "code": "validation_error",
    "message": "请求字段无效",
    "requestId": "uuid",
    "details": { "date": "必须是 YYYY-MM-DD" }
  }
}
~~~

状态码：401 unauthorized、403 forbidden、404 not_found、409 conflict、422 validation_error、500 internal_error。

## 给 AI Agent 的约束

- 为每个 Agent 创建单独 Token，按最小权限授权，并设置需要的有效期。
- 不要把 Token 置于提示词、代码库、日志或文章正文；使用部署平台的秘密环境变量。
- 先 GET 再 PATCH，删除前确认 ID 和影响范围。
- 保存 POST 返回的 ID；若请求失败，记录 X-Request-Id 供站长审计。
- Token 泄露时立即在后台撤销并创建替代 Token。
`;

export type ApiDocumentation = { available: true; markdown: string };

export async function getApiDocumentation(): Promise<ApiDocumentation> {
  return { available: true, markdown };
}
