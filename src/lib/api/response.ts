/**
 * Unified API response helpers.
 *
 * Shape (audit ARCH_BACKEND API-2):
 *   Error   : { error: string, code?: string, details?: unknown }
 *   Success : { ok: true, data: T }  OR raw data for legacy compat
 *
 * `apiError(msg, status, { code, details, headers })`
 * `apiOk(data, { status, headers })`
 */
import { NextResponse } from "next/server";

export interface ApiErrorBody {
  error: string;
  code?: string;
  details?: unknown;
}

export interface ApiSuccessBody<T> {
  ok: true;
  data: T;
}

export interface ErrorOptions {
  code?: string;
  details?: unknown;
  headers?: HeadersInit;
}

export interface OkOptions {
  status?: number;
  headers?: HeadersInit;
}

export function apiError(
  message: string,
  status = 500,
  options: ErrorOptions = {},
): NextResponse<ApiErrorBody> {
  const body: ApiErrorBody = { error: message };
  if (options.code) body.code = options.code;
  if (options.details !== undefined) body.details = options.details;

  return NextResponse.json(body, {
    status,
    headers: options.headers,
  });
}

export function apiOk<T>(
  data: T,
  options: OkOptions = {},
): NextResponse<ApiSuccessBody<T>> {
  return NextResponse.json(
    { ok: true, data },
    { status: options.status ?? 200, headers: options.headers },
  );
}

/**
 * Legacy-compatible success response: returns `data` directly, not wrapped.
 * Use only when migrating an existing endpoint that clients rely on.
 * Prefer `apiOk(data)` for all new code.
 */
export function apiRaw<T>(
  data: T,
  options: OkOptions = {},
): NextResponse<T> {
  return NextResponse.json(data, {
    status: options.status ?? 200,
    headers: options.headers,
  });
}
