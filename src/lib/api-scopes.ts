export const API_SCOPES = [
  "products:read", "products:write",
  "posts:read", "posts:write",
  "projects:read", "projects:write",
] as const;

export type ApiScope = (typeof API_SCOPES)[number];
