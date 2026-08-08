export const API_SCOPES = [
  "products:read", "products:write",
  "posts:read", "posts:write",
  "projects:read", "projects:write",
  "images:write",
  "series:read", "series:write",
  "banners:read", "banners:write",
] as const;

export type ApiScope = (typeof API_SCOPES)[number];
