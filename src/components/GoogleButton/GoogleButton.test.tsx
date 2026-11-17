import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { session } from "src/helpers/session";
import { err, mockApi, tokens, USER, type Handler } from "src/test/mockApi";
import { renderApp } from "src/test/renderApp";

type Cb = (r: { credential?: string }) => void;
let callback: Cb | undefined;
let rendered: Record<string, unknown> | undefined;

beforeEach(() => {
  callback = undefined;
  rendered = undefined;
  vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "test-client.apps.googleusercontent.com");
  // Thư viện Google đã "nạp sẵn" nên không chạm mạng.
  window.google = {
    accounts: {
      id: {
        initialize: (cfg) => {
          callback = cfg.callback;
        },
        renderButton: (_el, opts) => {
          rendered = opts;
        },
      },
    },
  };
});
afterEach(() => {
  vi.unstubAllEnvs();
  delete window.google;
});

function backend(extra: Record<string, Handler> = {}) {
  session.clear();
  return mockApi({
    "POST /auth/refresh": () => err(401, "invalid_refresh_token", "x"),
    "GET /me": () => ({ json: USER }),
    "GET /courses": () => ({ json: [] }),
    ...extra,
  });
}
const google = (credential = "cred-1") => act(async () => callback?.({ credential }));

describe("đăng nhập Google", () => {
  it("không có client ID thì không hiện nút", async () => {
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "");
    backend();
    renderApp("/login");
    await screen.findByRole("heading", { name: "Đăng nhập" });
    expect(callback).toBeUndefined();
  });

  it("người dùng cũ: gửi credential, đăng nhập và vào trang chính", async () => {
    const api = backend({ "POST /auth/google": () => ({ json: tokens(1) }) });
    renderApp("/login");
    await waitFor(() => expect(callback).toBeDefined());
    expect(rendered).toMatchObject({ text: "signin_with", locale: "vi" });
    await google("cred-xyz");
    expect(await screen.findByText(/hôm nay ôn gì/)).toBeInTheDocument();
    expect(api.calls.find((c) => c.path === "/auth/google")?.body).toEqual({ credential: "cred-xyz" });
  });

  it("người dùng mới: hỏi đồng ý điều khoản, chỉ tạo tài khoản sau khi tick", async () => {
    let n = 0;
    const api = backend({
      "POST /auth/google": ({ body }) => {
        n++;
        return body.acceptTerms ? { json: tokens(1) } : err(409, "terms_required", "Bạn cần đồng ý điều khoản.");
      },
    });
    renderApp("/register");
    await waitFor(() => expect(callback).toBeDefined());
    expect(rendered).toMatchObject({ text: "signup_with" });
    await google();
    const confirm = await screen.findByRole("button", { name: "Đồng ý và tạo tài khoản" });
    expect(confirm).toBeDisabled();
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("checkbox"));
    await userEvent.click(confirm);
    expect(await screen.findByText(/hôm nay ôn gì/)).toBeInTheDocument();
    expect(n).toBe(2);
    expect(api.calls.filter((c) => c.path === "/auth/google").map((c) => c.body)).toEqual([{ credential: "cred-1" }, { credential: "cred-1", acceptTerms: true }]);
  });

  it("từ chối điều khoản: không tạo tài khoản", async () => {
    const api = backend({ "POST /auth/google": () => err(409, "terms_required", "x") });
    renderApp("/register");
    await waitFor(() => expect(callback).toBeDefined());
    await google();
    await userEvent.click(await screen.findByRole("button", { name: "Hủy" }));
    expect(api.count("POST /auth/google")).toBe(1);
    expect(screen.queryByText(/hôm nay ôn gì/)).not.toBeInTheDocument();
  });

  it("Google bị từ chối (email chưa xác minh): hiện lỗi từ máy chủ", async () => {
    backend({ "POST /auth/google": () => err(403, "google_email_unverified", "Email của tài khoản Google này chưa được xác minh.") });
    renderApp("/login");
    await waitFor(() => expect(callback).toBeDefined());
    await google();
    expect(await screen.findByText("Email của tài khoản Google này chưa được xác minh.")).toBeInTheDocument();
  });
});

describe("cài đặt cho tài khoản chỉ dùng Google", () => {
  const googleUser = { ...USER, hasPassword: false };

  it("ẩn đổi mật khẩu, chỉ đường đặt mật khẩu qua email", async () => {
    session.setRefresh("ref-1");
    mockApi({ "POST /auth/refresh": () => ({ json: { ...tokens(2), user: googleUser } }), "GET /me": () => ({ json: googleUser }) });
    renderApp("/app/settings");
    expect(await screen.findByText(/chưa có mật khẩu/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Đổi mật khẩu" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "đặt mật khẩu qua email" })).toHaveAttribute("href", "/forgot");
  });

  it("xóa tài khoản: xác nhận bằng cách gõ lại email", async () => {
    session.setRefresh("ref-1");
    const api = mockApi({
      "POST /auth/refresh": () => ({ json: { ...tokens(2), user: googleUser } }),
      "GET /me": () => ({ json: googleUser }),
      "POST /auth/logout": () => ({ status: 204 }),
      "DELETE /me": ({ body }) => (body.email === googleUser.email ? { status: 204 } : err(403, "wrong_confirmation", "Email xác nhận chưa đúng.")),
    });
    renderApp("/app/settings");
    await userEvent.click(await screen.findByRole("button", { name: "Xóa tài khoản…" }));
    const box = await screen.findByLabelText("Nhập lại email của bạn để xác nhận");
    await userEvent.type(box, "sai@example.test");
    await userEvent.click(screen.getByRole("button", { name: "Xóa vĩnh viễn" }));
    expect(await screen.findByText("Email xác nhận chưa đúng.")).toBeInTheDocument();
    await userEvent.clear(box);
    await userEvent.type(box, googleUser.email);
    await userEvent.click(screen.getByRole("button", { name: "Xóa vĩnh viễn" }));
    expect(await screen.findByRole("heading", { name: "Đăng nhập" })).toBeInTheDocument();
    expect(api.calls.filter((c) => c.method === "DELETE").map((c) => c.body)).toEqual([{ email: "sai@example.test" }, { email: googleUser.email }]);
  });
});
