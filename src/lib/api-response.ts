import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "validation_error"
  | "internal_error";

const commonHeaders = (requestId: string) => ({
  "Cache-Control": "no-store",
  "X-Request-Id": requestId,
});

export function newRequestId() {
  return randomUUID();
}

export function apiJson<T>(data: T, requestId: string, init: ResponseInit & { meta?: unknown } = {}) {
  const { meta, headers, ...responseInit } = init;
  return NextResponse.json(meta === undefined ? { data } : { data, meta }, {
    ...responseInit,
    headers: { ...commonHeaders(requestId), ...headers },
  });
}

export function apiNoContent(requestId: string) {
  return new NextResponse(null, { status: 204, headers: commonHeaders(requestId) });
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  requestId: string,
  status: number,
  details?: Record<string, string>,
) {
  return NextResponse.json(
    { error: { code, message, requestId, ...(details ? { details } : {}) } },
    { status, headers: commonHeaders(requestId) },
  );
}
