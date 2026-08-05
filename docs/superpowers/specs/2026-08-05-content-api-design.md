# Content Management Public API

## Goal

Allow AI agents and external automations to maintain public products, blog posts, and projects without receiving an admin browser session or database credentials.

## Scope

- API version: `/api/v1`.
- Resources: `products`, `posts`, and `projects`.
- Operations: list, create, read one, update, and delete.
- Authentication: `Authorization: Bearer <token>`.
- Authorization: independent `read` and `write` scopes per resource.
- Token management: the existing admin UI can create, list, revoke, and delete tokens.
- Audit: record token use for mutations and failed authentication; show last-used time in admin.

## Out of scope

- Orders, cards, payments, media uploads, navigation, and admin-session APIs.
- Access to product `fixed_content`, card contents, or any other delivery secret.
- User-facing OAuth, third-party sign-in, rate limiting service, or multi-tenant organizations.
- Bilingual database content fields; this API preserves the existing single-language resource schema.

## Token model

Each token has:

- `id`: UUID.
- `name`: an admin-chosen description, such as `content-agent-production`.
- `prefix`: a non-secret identifier shown in the UI, e.g. `zhen_ab12cd`.
- `token_hash`: SHA-256 hash of the complete secret, never the secret itself.
- `scopes`: text array selected from `products:read`, `products:write`, `posts:read`, `posts:write`, `projects:read`, and `projects:write`.
- `expires_at`, nullable for a non-expiring token.
- `revoked_at`, nullable; revoked tokens cannot authenticate.
- `last_used_at` and `last_used_ip` for operational visibility.
- creation and update timestamps.

Generated token plaintext uses a recognizable `zhen_` prefix and high-entropy random value. It is rendered once in the successful create response/UI and cannot be recovered afterwards.

## API contract

Every response is JSON and includes a request ID in `X-Request-Id`. Successful collection responses use `{ data, meta }`; successful item responses use `{ data }`. Errors use:

```json
{
  "error": {
    "code": "forbidden",
    "message": "Token lacks posts:write scope",
    "requestId": "..."
  }
}
```

| Method | Path | Required scope | Behavior |
| --- | --- | --- | --- |
| GET | `/api/v1/products` | `products:read` | List public-safe product fields. |
| POST | `/api/v1/products` | `products:write` | Create a product. |
| GET | `/api/v1/products/:id` | `products:read` | Fetch one product. |
| PATCH | `/api/v1/products/:id` | `products:write` | Update supplied mutable fields. |
| DELETE | `/api/v1/products/:id` | `products:write` | Delete product and unused cards, matching current admin behavior. |
| GET/POST | `/api/v1/posts` | `posts:read` / `posts:write` | List or create posts. |
| GET/PATCH/DELETE | `/api/v1/posts/:id` | `posts:read` / `posts:write` | Read, patch, or delete one post. |
| GET/POST | `/api/v1/projects` | `projects:read` / `projects:write` | List or create projects. |
| GET/PATCH/DELETE | `/api/v1/projects/:id` | `projects:read` / `projects:write` | Read, patch, or delete one project. |

`POST` requires an ID and rejects an existing ID with `409`. `PATCH` updates only supplied fields and returns `404` when absent. `DELETE` returns `204`. Input validation returns `422` with field-specific details. Read responses intentionally omit product `fixedContent`, delivery mode internals, stock/card state, and all private order data.

## Server architecture

1. `lib/api-tokens.ts` owns token generation, hashing, lookup, scope checks, and activity updates.
2. `lib/content-api.ts` owns resource validation, database mutations, response-safe shaping, and path revalidation. It is shared by API routes; server actions retain their existing implementation.
3. `app/api/v1/**/route.ts` files parse HTTP input, call the auth helper, call content services, and serialize standardized errors.
4. `api_tokens` and `api_token_audit_logs` are added via the idempotent setup script migration.
5. `app/admin/api-tokens` provides token administration. Creation uses a server action protected by existing `assertAdmin`; only the plaintext return is client-visible for that interaction.

## Security behavior

- Missing, malformed, expired, revoked, or unknown bearer tokens all return `401` without revealing token state.
- Valid token lacking the action scope returns `403`.
- Token comparison uses fixed-length SHA-256 values and `timingSafeEqual`.
- Token secrets are never written to application logs, audit logs, UI lists, or API error responses.
- Mutation audit records include token ID, method, route, resource ID when available, response status, request ID, and source IP.
- API route responses set `Cache-Control: no-store`.

## Admin experience

The admin sidebar gets an “API Tokens” item. The page includes:

- a creation form with name, selected scopes, and expiration choice;
- one-time secret display with copy control and an explicit warning;
- token table with prefix, scopes, expiry, last use, and status;
- revoke action (recoverable status transition) and permanent delete action with confirmation;
- a short usage snippet pointing to `docs/api.md`.

## Documentation and validation

`docs/api.md` will document authentication, scopes, schemas, error responses, curl examples, and AI-agent guardrails.

Automated coverage will exercise token generation/verification, expiry/revocation, authorization matrix, private-field omission, validation failures, and each resource CRUD route. The existing build/type checks and a manual API smoke test using a generated token complete validation.
