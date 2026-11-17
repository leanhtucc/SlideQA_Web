import { vi } from "vitest";

export interface Req {
  body: any;
  headers: Headers;
}
export type Handler = (req: Req) => { status?: number; json?: unknown; headers?: Record<string, string> } | Promise<{ status?: number; json?: unknown; headers?: Record<string, string> }>;

/** Thay fetch toàn cục bằng một backend giả: khóa là "METHOD /đường-dẫn" (không gồm /api/v1). */
export function mockApi(routes: Record<string, Handler>) {
  const calls: { method: string; path: string; body: any; auth: string | null }[] = [];
  const fn = vi.fn(async (url: string, init: RequestInit = {}) => {
    const path = String(url).replace(/^https?:\/\/[^/]+\/api\/v1/, "");
    const method = init.method ?? "GET";
    const headers = new Headers(init.headers as HeadersInit);
    const body = init.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ method, path, body, auth: headers.get("authorization") });
    const h = routes[`${method} ${path}`];
    if (!h) return new Response(JSON.stringify({ error: { code: "not_found", message: "Không tìm thấy." } }), { status: 404 });
    const r = await h({ body, headers });
    return new Response(r.json === undefined ? null : JSON.stringify(r.json), { status: r.status ?? 200, ...(r.headers ? { headers: r.headers } : {}) });
  });
  vi.stubGlobal("fetch", fn);
  const count = (key: string) => calls.filter((c) => `${c.method} ${c.path}` === key).length;
  return { calls, fn, count };
}

export const err = (status: number, code: string, message: string, extra: Record<string, unknown> = {}) => ({ status, json: { error: { code, message, ...extra } } });

export const USER = { id: "u1", email: "tu@example.test", displayName: "Tú", role: "learner" as const, llmConsentAt: null, hasPassword: true };
export const tokens = (n: number) => ({ user: USER, accessToken: `acc-${n}`, refreshToken: `ref-${n}`, expiresIn: 900 });
