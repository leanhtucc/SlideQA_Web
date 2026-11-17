import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { session } from "src/helpers/session";
import { err, mockApi, tokens, USER, type Handler } from "src/test/mockApi";
import { renderApp } from "src/test/renderApp";

function backend(extra: Record<string, Handler> = {}) {
  return mockApi({
    "POST /auth/refresh": () => ({ json: tokens(2) }),
    "GET /me": () => ({ json: USER }),
    "POST /auth/logout": () => ({ status: 204 }),
    ...extra,
  });
}
const signedIn = () => session.setRefresh("ref-1");

describe("quên và đặt lại mật khẩu", () => {
  it("quên mật khẩu: báo email sai định dạng, rồi luôn báo đã gửi (không lộ email có tồn tại)", async () => {
    const api = backend({ "POST /auth/forgot": () => ({ status: 204 }) });
    renderApp("/forgot");
    await userEvent.type(await screen.findByLabelText("Email"), "khong-phai-email");
    await userEvent.click(screen.getByRole("button", { name: "Gửi liên kết đặt lại" }));
    expect(await screen.findByText("Email chưa đúng định dạng.")).toBeInTheDocument();
    expect(api.count("POST /auth/forgot")).toBe(0);

    await userEvent.clear(screen.getByLabelText("Email"));
    await userEvent.type(screen.getByLabelText("Email"), "  Tu@Example.TEST ");
    await userEvent.click(screen.getByRole("button", { name: "Gửi liên kết đặt lại" }));
    expect(await screen.findByText(/Nếu email này đã đăng ký/)).toBeInTheDocument();
    expect(api.calls.find((c) => c.path === "/auth/forgot")?.body).toEqual({ email: "tu@example.test" });
  });

  it("đặt lại mật khẩu: kiểm tra khớp rồi gửi token trong URL; thành công thì dẫn về đăng nhập", async () => {
    const api = backend({ "POST /auth/reset": () => ({ status: 204 }) });
    renderApp("/reset?token=abc123");
    await userEvent.type(await screen.findByLabelText("Mật khẩu mới"), "mat-khau-moi-456");
    await userEvent.type(screen.getByLabelText("Nhập lại mật khẩu mới"), "khac-hoan-toan");
    await userEvent.click(screen.getByRole("button", { name: "Đặt mật khẩu" }));
    expect(await screen.findByText("Hai mật khẩu chưa giống nhau.")).toBeInTheDocument();
    expect(api.count("POST /auth/reset")).toBe(0);

    await userEvent.clear(screen.getByLabelText("Nhập lại mật khẩu mới"));
    await userEvent.type(screen.getByLabelText("Nhập lại mật khẩu mới"), "mat-khau-moi-456");
    await userEvent.click(screen.getByRole("button", { name: "Đặt mật khẩu" }));
    expect(await screen.findByText(/Đã đổi mật khẩu/)).toBeInTheDocument();
    expect(api.calls.find((c) => c.path === "/auth/reset")?.body).toEqual({ token: "abc123", password: "mat-khau-moi-456" });
    expect(screen.getByRole("link", { name: "Đăng nhập" })).toBeInTheDocument();
  });

  it("liên kết hết hạn: hiện lỗi từ máy chủ kèm đường yêu cầu liên kết mới", async () => {
    backend({ "POST /auth/reset": () => err(400, "invalid_reset_token", "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.") });
    renderApp("/reset?token=old");
    await userEvent.type(await screen.findByLabelText("Mật khẩu mới"), "mat-khau-moi-456");
    await userEvent.type(screen.getByLabelText("Nhập lại mật khẩu mới"), "mat-khau-moi-456");
    await userEvent.click(screen.getByRole("button", { name: "Đặt mật khẩu" }));
    expect(await screen.findByText(/không hợp lệ hoặc đã hết hạn/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Yêu cầu liên kết mới" })).toHaveAttribute("href", "/forgot");
  });

  it("thiếu token trong URL: báo liên kết không hợp lệ", async () => {
    backend();
    renderApp("/reset");
    expect(await screen.findByText(/Liên kết không hợp lệ/)).toBeInTheDocument();
  });
});

describe("cài đặt tài khoản", () => {
  it("đổi tên hiển thị: gọi PATCH /me và cập nhật tên trên thanh bên", async () => {
    signedIn();
    let name = USER.displayName;
    const api = backend({
      "PATCH /me": ({ body }) => {
        name = body.displayName;
        return { json: { ...USER, displayName: name } };
      },
      "GET /me": () => ({ json: { ...USER, displayName: name } }),
    });
    renderApp("/app/settings");
    const input = await screen.findByLabelText("Tên hiển thị");
    await userEvent.clear(input);
    await userEvent.type(input, "Tên mới");
    await userEvent.click(screen.getByRole("button", { name: "Lưu" }));
    expect(await screen.findByText("Đã lưu tên hiển thị.")).toBeInTheDocument();
    expect(api.calls.find((c) => c.method === "PATCH")?.body).toEqual({ displayName: "Tên mới" });
    await waitFor(() => expect(screen.getByText("Tên mới", { selector: ".h4" })).toBeInTheDocument());
  });

  it("đổi mật khẩu sai mật khẩu hiện tại: báo ngay tại ô, vẫn ở lại trang", async () => {
    signedIn();
    backend({ "POST /me/password": () => err(403, "wrong_password", "Mật khẩu chưa đúng.") });
    renderApp("/app/settings");
    await userEvent.type(await screen.findByLabelText("Mật khẩu hiện tại"), "sai");
    await userEvent.type(screen.getByLabelText("Mật khẩu mới"), "mat-khau-moi-456");
    await userEvent.type(screen.getByLabelText("Nhập lại mật khẩu mới"), "mat-khau-moi-456");
    await userEvent.click(screen.getByRole("button", { name: "Đổi mật khẩu" }));
    expect(await screen.findByText("Mật khẩu chưa đúng.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cài đặt" })).toBeInTheDocument();
  });

  it("đổi mật khẩu thành công: đăng xuất và về trang đăng nhập kèm thông báo", async () => {
    signedIn();
    const api = backend({ "POST /me/password": () => ({ status: 204 }) });
    renderApp("/app/settings");
    await userEvent.type(await screen.findByLabelText("Mật khẩu hiện tại"), "mat-khau-cu-123");
    await userEvent.type(screen.getByLabelText("Mật khẩu mới"), "mat-khau-moi-456");
    await userEvent.type(screen.getByLabelText("Nhập lại mật khẩu mới"), "mat-khau-moi-456");
    await userEvent.click(screen.getByRole("button", { name: "Đổi mật khẩu" }));
    expect(await screen.findByRole("heading", { name: "Đăng nhập" })).toBeInTheDocument();
    expect(screen.getByText(/Đã đổi mật khẩu/)).toBeInTheDocument();
    expect(api.calls.find((c) => c.path === "/me/password")?.body).toEqual({ currentPassword: "mat-khau-cu-123", newPassword: "mat-khau-moi-456" });
    expect(session.getRefresh()).toBeNull();
  });

  it("xóa tài khoản: phải nhập mật khẩu; sai thì báo, đúng thì đăng xuất và về đăng nhập", async () => {
    signedIn();
    let ok = false;
    const api = backend({ "DELETE /me": ({ body }) => (body.password === "dung" ? ((ok = true), { status: 204 }) : err(403, "wrong_password", "Mật khẩu chưa đúng.")) });
    renderApp("/app/settings");
    await userEvent.click(await screen.findByRole("button", { name: "Xóa tài khoản…" }));
    const dlg = await screen.findByRole("alertdialog");
    expect(dlg).toHaveTextContent(/không hoàn tác được/);

    await userEvent.click(screen.getByRole("button", { name: "Xóa vĩnh viễn" }));
    expect(await screen.findByText("Hãy nhập mật khẩu để xác nhận.")).toBeInTheDocument();
    expect(api.count("DELETE /me")).toBe(0);

    await userEvent.type(screen.getByLabelText("Nhập mật khẩu để xác nhận"), "sai");
    await userEvent.click(screen.getByRole("button", { name: "Xóa vĩnh viễn" }));
    expect(await screen.findByText("Mật khẩu chưa đúng.")).toBeInTheDocument();
    expect(ok).toBe(false);

    await userEvent.clear(screen.getByLabelText("Nhập mật khẩu để xác nhận"));
    await userEvent.type(screen.getByLabelText("Nhập mật khẩu để xác nhận"), "dung");
    await userEvent.click(screen.getByRole("button", { name: "Xóa vĩnh viễn" }));
    expect(await screen.findByRole("heading", { name: "Đăng nhập" })).toBeInTheDocument();
    expect(screen.getByText(/đã được xóa/)).toBeInTheDocument();
    expect(session.getRefresh()).toBeNull();
  });
});
