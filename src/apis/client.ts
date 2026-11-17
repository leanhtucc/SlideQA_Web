import { session } from "src/helpers/session";

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3000/api/v1";

/** Lỗi API theo hợp đồng `{ error: { code, message, fields? } }`; status 0 = mất kết nối. */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields: Record<string, string> = {},
    public retryAfter?: number,
  ) {
    super(message);
  }
}

let onExpired: (() => void) | null = null;
/** Gọi khi phiên không còn cứu được (refresh thất bại): UI đưa người dùng về trang đăng nhập. */
export const setSessionExpiredHandler = (fn: (() => void) | null) => {
  onExpired = fn;
};

interface Raw {
  status: number;
  data: any;
  headers: Headers;
}

async function rawFetch(method: string, path: string, body: unknown, token: string | null): Promise<Raw> {
  let res: Response;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: {
        ...(body !== undefined ? { "content-type": "application/json" } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new ApiError(0, "network", "Mất kết nối. Hãy kiểm tra mạng và thử lại.");
  }
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* không phải JSON */
  }
  return { status: res.status, data, headers: res.headers };
}

function toError(r: Raw): ApiError {
  const e = r.data?.error;
  const retry = Number(r.headers.get("retry-after"));
  return new ApiError(r.status, e?.code ?? "error", e?.message ?? "Có lỗi xảy ra, hãy thử lại.", e?.fields ?? {}, Number.isFinite(retry) && retry > 0 ? retry : undefined);
}

const expire = () => {
  session.clear();
  onExpired?.();
};

async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  // Khóa liên tab: hai tab cùng refresh một lúc sẽ làm refresh token xoay vòng bị thu hồi nhầm.
  const locks = (
    navigator as {
      locks?: {
        request: <R>(name: string, cb: () => Promise<R>) => Promise<R>;
      };
    }
  ).locks;
  return locks ? locks.request("slideqa-refresh", fn) : fn();
}

async function doRefresh(): Promise<boolean> {
  const rt = session.getRefresh();
  if (!rt) {
    expire();
    return false;
  }
  const r = await rawFetch("POST", "/auth/refresh", { refreshToken: rt }, null); // mất mạng thì ném lỗi, giữ phiên
  if (r.status === 200) {
    session.setAccess(r.data.accessToken);
    session.setRefresh(r.data.refreshToken);
    return true;
  }
  if (r.status === 401 || r.status === 403) {
    expire();
    return false;
  }
  throw toError(r);
}

let inflight: Promise<boolean> | null = null;
/** Một lần refresh dùng chung cho mọi request đang chờ (single-flight). */
export function refreshSession(): Promise<boolean> {
  inflight ??= withLock(doRefresh).finally(() => {
    inflight = null;
  });
  return inflight;
}

export async function request<T>(method: string, path: string, opts: { body?: unknown; auth?: boolean } = {}): Promise<T> {
  const auth = opts.auth ?? true;
  let r = await rawFetch(method, path, opts.body, auth ? session.getAccess() : null);
  if (r.status === 401 && auth) {
    // Access token hết hạn: refresh một lần rồi gọi lại. Refresh thất bại thì refreshSession đã đưa về đăng nhập.
    if (await refreshSession()) r = await rawFetch(method, path, opts.body, session.getAccess());
  }
  if (r.status >= 400) throw toError(r);
  return r.data as T;
}

/** Địa chỉ đầy đủ của một đường dẫn API (dùng cho XHR upload, vì fetch không báo tiến độ tải lên). */
export const apiUrl = (path: string) => BASE + path;

/** Tải một tệp nhị phân (PDF) kèm xác thực; gặp 401 thì refresh một lần rồi tải lại, giống `request`. */
export async function requestBuffer(path: string): Promise<ArrayBuffer> {
  const get = (token: string | null) =>
    fetch(BASE + path, {
      headers: token ? { authorization: `Bearer ${token}` } : {},
    }).catch(() => {
      throw new ApiError(0, "network", "Mất kết nối. Hãy kiểm tra mạng và thử lại.");
    });
  let res = await get(session.getAccess());
  if (res.status === 401 && (await refreshSession())) res = await get(session.getAccess());
  if (!res.ok) {
    const e = await res.json().catch(() => null);
    throw new ApiError(res.status, e?.error?.code ?? "error", e?.error?.message ?? "Không tải được tệp.");
  }
  return res.arrayBuffer();
}
