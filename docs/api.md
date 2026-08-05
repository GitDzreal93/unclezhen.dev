# Public Content API

此 API 让受控的 AI Agent 或自动化流程维护站点的商品、博客和项目内容。基础路径为 `/api/v1`，所有响应都是 JSON，且含有 `X-Request-Id`；响应不会被缓存。

## 鉴权与权限

在后台的 **API Token** 页面生成 Token。明文只出现一次，服务端仅保存 SHA-256 哈希。

```http
Authorization: Bearer zhen_your_secret_token
```

可授予的权限：

| 权限 | 能力 |
| --- | --- |
| `products:read` / `products:write` | 读取 / 新增、更新、删除商品 |
| `posts:read` / `posts:write` | 读取 / 新增、更新、删除博客 |
| `projects:read` / `projects:write` | 读取 / 新增、更新、删除项目 |

读取和写入是独立授权。缺少、无效、过期或已撤销的 Token 返回 `401`；Token 有效但权限不足返回 `403`。

## 端点

| 方法 | 路径 | 权限 |
| --- | --- | --- |
| GET / POST | `/products` | `products:read` / `products:write` |
| GET / PATCH / DELETE | `/products/:id` | `products:read` / `products:write` |
| GET / POST | `/posts` | `posts:read` / `posts:write` |
| GET / PATCH / DELETE | `/posts/:id` | `posts:read` / `posts:write` |
| GET / POST | `/projects` | `projects:read` / `projects:write` |
| GET / PATCH / DELETE | `/projects/:id` | `projects:read` / `projects:write` |

集合读取返回 `{ "data": [...], "meta": { "count": 1 } }`，单条返回 `{ "data": {...} }`。新增返回 `201`，删除返回空响应 `204`。

## 数据字段

`POST` 必须包含 `id`，重复 ID 返回 `409`。`PATCH` 仅提交需要改动的字段，空请求返回 `422`。

```json
// posts
{ "id": "api-intro", "title": "API 维护内容", "date": "2026-08-05", "tags": ["API"], "excerpt": "摘要", "body": "Markdown 正文", "sort": 0 }

// projects
{ "id": "api-project", "name": "API 项目", "type": "工具", "year": "2026", "blurb": "简介", "problem": "问题", "solution": "方案", "result": "结果", "stack": ["Next.js"], "role": "开发", "sort": 0 }

// products
{ "id": "api-product", "name": "API 商品", "cat": "软件", "price": 99, "descr": "商品说明", "stock": -1, "sort": 0 }
```

商品读取刻意不返回发货内容、发货方式、卡密和订单信息。该 API 也不能管理支付、订单、媒体上传、卡密或导航。

## 示例

```bash
export ZHEN_TOKEN='zhen_replace_with_secret'

curl -H "Authorization: Bearer $ZHEN_TOKEN" \
  https://your-domain.com/api/v1/posts

curl -X POST -H "Authorization: Bearer $ZHEN_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"id":"api-example","title":"由 API 创建","date":"2026-08-05","tags":["API"],"excerpt":"自动化内容示例","body":"这篇文章用于验证内容 API。"}' \
  https://your-domain.com/api/v1/posts

curl -X PATCH -H "Authorization: Bearer $ZHEN_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"title":"更新后的标题"}' \
  https://your-domain.com/api/v1/posts/api-example

curl -X DELETE -H "Authorization: Bearer $ZHEN_TOKEN" \
  https://your-domain.com/api/v1/posts/api-example
```

## 错误格式

```json
{
  "error": {
    "code": "validation_error",
    "message": "请求字段无效",
    "requestId": "uuid",
    "details": { "date": "必须是 YYYY-MM-DD" }
  }
}
```

状态码：`401 unauthorized`、`403 forbidden`、`404 not_found`、`409 conflict`、`422 validation_error`、`500 internal_error`。

## 给 AI Agent 的约束

- 为每个 Agent 创建单独 Token，按最小权限授权，并设置需要的有效期。
- 不要把 Token 置于提示词、代码库、日志或文章正文；使用部署平台的秘密环境变量。
- 先 `GET` 再 `PATCH`，删除前确认 ID 和影响范围。
- 保存 `POST` 返回的 ID；若请求失败，记录 `X-Request-Id` 供站长审计。
- Token 泄露时立即在后台撤销并创建替代 Token。
