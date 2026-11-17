import { describe, expect, it, vi } from "vitest";
import { ApiError, request, requestStream, setSessionExpiredHandler } from "src/apis/client";
import { session } from "src/helpers/session";
import { err, mockApi } from "src/test/mockApi";

const authed = (access = "old", refresh = "ref-1") => {
  session.setAccess(access);
  session.setRefresh(refresh);
};

describe("request", () => {
  it("gắn Bearer token vào request cần đăng nhập, và không gắn vào request công khai", async () => {
    const api = mockApi({
      "GET /courses": () => ({ json: [] }),
      "POST /auth/login": () => ({ json: {} }),
    });
    authed("tok-1");
    await request("GET", "/courses");
    await request("POST", "/auth/login", { body: { x: 1 }, auth: false });
    expect(api.calls[0]?.auth).toBe("Bearer tok-1");
    expect(api.calls[1]?.auth).toBeNull();
  });

  it("401 → refresh một lần → gọi lại bằng token mới và lưu cặp token xoay vòng", async () => {
    const api = mockApi({
      "GET /courses": ({ headers }) => (headers.get("authorization") === "Bearer new" ? { json: [{ id: 1 }] } : err(401, "unauthorized", "hết hạn")),
      "POST /auth/refresh": ({ body }) => (body.refreshToken === "ref-1" ? { json: { accessToken: "new", refreshToken: "ref-2" } } : err(401, "invalid_refresh_token", "x")),
    });
    authed();
    await expect(request("GET", "/courses")).resolves.toEqual([{ id: 1 }]);
    expect(api.count("POST /auth/refresh")).toBe(1);
    expect(session.getAccess()).toBe("new");
    expect(session.getRefresh()).toBe("ref-2");
  });

  it("nhiều request cùng gặp 401 chỉ gây MỘT lần refresh (single-flight)", async () => {
    const api = mockApi({
      "GET /a": ({ headers }) => (headers.get("authorization") === "Bearer new" ? { json: "a" } : err(401, "unauthorized", "x")),
      "GET /b": ({ headers }) => (headers.get("authorization") === "Bearer new" ? { json: "b" } : err(401, "unauthorized", "x")),
      "GET /c": ({ headers }) => (headers.get("authorization") === "Bearer new" ? { json: "c" } : err(401, "unauthorized", "x")),
      "POST /auth/refresh": async () => {
        await new Promise((r) => setTimeout(r, 30)); // giữ lại để các request kịp chồng lên nhau
        return { json: { accessToken: "new", refreshToken: "ref-2" } };
      },
    });
    authed();
    const out = await Promise.all([request("GET", "/a"), request("GET", "/b"), request("GET", "/c")]);
    expect(out).toEqual(["a", "b", "c"]);
    expect(api.count("POST /auth/refresh")).toBe(1);
  });

  it("refresh thất bại: xóa phiên, báo hết hạn và request lỗi 401", async () => {
    mockApi({
      "GET /courses": () => err(401, "unauthorized", "hết hạn"),
      "POST /auth/refresh": () => err(401, "invalid_refresh_token", "Phiên đã hết hạn"),
    });
    const expired = vi.fn();
    setSessionExpiredHandler(expired);
    authed();
    await expect(request("GET", "/courses")).rejects.toMatchObject({
      status: 401,
    });
    expect(expired).toHaveBeenCalledTimes(1);
    expect(session.getAccess()).toBeNull();
    expect(session.getRefresh()).toBeNull();
  });

  it("không có refresh token mà gặp 401: coi như hết phiên, không gọi refresh", async () => {
    const api = mockApi({
      "GET /courses": () => err(401, "unauthorized", "x"),
    });
    const expired = vi.fn();
    setSessionExpiredHandler(expired);
    await expect(request("GET", "/courses")).rejects.toBeInstanceOf(ApiError);
    expect(expired).toHaveBeenCalled();
    expect(api.count("POST /auth/refresh")).toBe(0);
  });

  it("401 của đăng nhập (sai mật khẩu) KHÔNG kích hoạt refresh", async () => {
    const api = mockApi({
      "POST /auth/login": () => err(401, "invalid_credentials", "Email hoặc mật khẩu chưa đúng."),
    });
    authed();
    await expect(request("POST", "/auth/login", { body: {}, auth: false })).rejects.toMatchObject({ code: "invalid_credentials", status: 401 });
    expect(api.count("POST /auth/refresh")).toBe(0);
    expect(session.getRefresh()).toBe("ref-1");
  });

  it("mất mạng: ném ApiError status 0 và giữ nguyên phiên", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Promise.reject(new TypeError("Failed to fetch"))),
    );
    authed();
    await expect(request("GET", "/courses")).rejects.toMatchObject({
      status: 0,
      code: "network",
    });
    expect(session.getRefresh()).toBe("ref-1");
  });

  it("mất mạng đúng lúc refresh: báo lỗi mạng, không đăng xuất", async () => {
    let calls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (String(url).endsWith("/auth/refresh")) throw new TypeError("Failed to fetch");
        calls++;
        return new Response(JSON.stringify({ error: { code: "unauthorized", message: "x" } }), { status: 401 });
      }),
    );
    const expired = vi.fn();
    setSessionExpiredHandler(expired);
    authed();
    await expect(request("GET", "/courses")).rejects.toMatchObject({
      status: 0,
    });
    expect(calls).toBe(1);
    expect(expired).not.toHaveBeenCalled();
    expect(session.getRefresh()).toBe("ref-1");
  });

  it("ánh xạ lỗi theo từng trường và Retry-After của 429", async () => {
    mockApi({
      "POST /auth/register": () =>
        err(422, "validation_error", "Dữ liệu chưa hợp lệ.", {
          fields: { email: "Email chưa đúng định dạng." },
        }),
      "POST /auth/login": () => ({
        ...err(429, "rate_limited", "Quá nhiều lần thử."),
        headers: { "retry-after": "42" },
      }),
    });
    await expect(request("POST", "/auth/register", { body: {}, auth: false })).rejects.toMatchObject({
      code: "validation_error",
      fields: { email: "Email chưa đúng định dạng." },
    });
    await expect(request("POST", "/auth/login", { body: {}, auth: false })).rejects.toMatchObject({ status: 429, retryAfter: 42 });
  });

  it("phản hồi 204 không có nội dung vẫn thành công", async () => {
    mockApi({ "DELETE /courses/1": () => ({ status: 204 }) });
    authed();
    await expect(request("DELETE", "/courses/1")).resolves.toBeNull();
  });
});

describe("requestStream (SSE)", () => {
  const sse = (...parts: string[]) =>
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(new ReadableStream({ start: (c) => (parts.forEach((x) => c.enqueue(new TextEncoder().encode(x))), c.close()) }), { headers: { "content-type": "text/event-stream" } })),
    );
  const ev = (e: string, d: unknown) => `event: ${e}
data: ${JSON.stringify(d)}

`;

  it("nhận từng đoạn chữ rồi kết quả cuối, kể cả khi một sự kiện bị cắt đôi giữa hai gói", async () => {
    authed();
    const whole = ev("delta", { text: "Xin " });
    sse(whole.slice(0, 10), whole.slice(10) + ev("delta", { text: "chào" }), ev("done", { id: "m1" }));
    const got: string[] = [];
    await expect(requestStream("/x", {}, (t) => got.push(t))).resolves.toEqual({ id: "m1" });
    expect(got).toEqual(["Xin ", "chào"]);
  });

  it("server trả JSON thường (không qua AI) thì dùng luôn; lỗi JSON thành ApiError", async () => {
    authed();
    mockApi({ "POST /x": () => ({ json: { id: "m2" } }), "POST /y": () => err(404, "not_found", "Không thấy") });
    await expect(requestStream("/x", {}, () => {})).resolves.toEqual({ id: "m2" });
    await expect(requestStream("/y", {}, () => {})).rejects.toMatchObject({ status: 404, message: "Không thấy" });
  });

  it("sự kiện error hoặc luồng đứt trước khi xong thì báo lỗi", async () => {
    authed();
    sse(ev("delta", { text: "a" }), ev("error", { message: "AI lỗi" }));
    await expect(requestStream("/x", {}, () => {})).rejects.toMatchObject({ message: "AI lỗi" });
    sse(ev("delta", { text: "a" }));
    await expect(requestStream("/x", {}, () => {})).rejects.toMatchObject({ status: 0 });
  });
});
