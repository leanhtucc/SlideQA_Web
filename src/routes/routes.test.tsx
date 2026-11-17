import { screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { request } from "src/apis/client";
import { session } from "src/helpers/session";
import { err, mockApi, tokens, USER } from "src/test/mockApi";
import { renderApp } from "src/test/renderApp";
const heading = (name: RegExp | string) => screen.findByRole("heading", { name });

describe("đăng nhập", () => {
  it("gửi form rỗng: báo lỗi từng trường, không gọi API, đưa focus vào ô lỗi đầu tiên", async () => {
    const api = mockApi({});
    renderApp("/login");
    await heading("Đăng nhập");
    await userEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));
    expect(screen.getByText("Email chưa đúng định dạng.")).toBeInTheDocument();
    expect(screen.getByText("Hãy nhập mật khẩu.")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
    await waitFor(() => expect(screen.getByLabelText("Email")).toHaveFocus());
    expect(api.fn).not.toHaveBeenCalled();
  });

  it("sai mật khẩu: hiện thông báo của máy chủ và ở lại trang", async () => {
    mockApi({
      "POST /auth/login": () => err(401, "invalid_credentials", "Email hoặc mật khẩu chưa đúng."),
    });
    renderApp("/login");
    await userEvent.type(await screen.findByLabelText("Email"), "tu@example.test");
    await userEvent.type(screen.getByLabelText("Mật khẩu"), "sai-mat-khau");
    await userEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Email hoặc mật khẩu chưa đúng.");
    expect(screen.getByRole("heading", { name: "Đăng nhập" })).toBeInTheDocument();
    expect(session.getRefresh()).toBeNull();
  });

  it("quá nhiều lần thử (429): hiện thông báo, nút dùng lại được", async () => {
    mockApi({
      "POST /auth/login": () => err(429, "rate_limited", "Quá nhiều lần thử. Hãy thử lại sau 30 giây."),
    });
    renderApp("/login");
    await userEvent.type(await screen.findByLabelText("Email"), "tu@example.test");
    await userEvent.type(screen.getByLabelText("Mật khẩu"), "x");
    await userEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("thử lại sau 30 giây");
    expect(screen.getByRole("button", { name: "Đăng nhập" })).toBeEnabled();
  });

  it("mất mạng: báo lỗi và không mất nội dung đã nhập (WEB-07)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Promise.reject(new TypeError("Failed to fetch"))),
    );
    renderApp("/login");
    await userEvent.type(await screen.findByLabelText("Email"), "tu@example.test");
    await userEvent.type(screen.getByLabelText("Mật khẩu"), "mat-khau-123");
    await userEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Mất kết nối");
    expect(screen.getByLabelText("Email")).toHaveValue("tu@example.test");
    expect(screen.getByLabelText("Mật khẩu")).toHaveValue("mat-khau-123");
  });

  it("thành công: vào /app, refresh token được lưu còn access token thì không", async () => {
    mockApi({
      "POST /auth/login": ({ body }) => (body.email === "tu@example.test" ? { json: tokens(1) } : err(401, "invalid_credentials", "x")),
    });
    renderApp("/login");
    await userEvent.type(await screen.findByLabelText("Email"), "  Tu@Example.test ");
    await userEvent.type(screen.getByLabelText("Mật khẩu"), "mat-khau-thu-123");
    await userEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));
    expect(await heading(/Chào Tú/)).toBeInTheDocument();
    expect(localStorage.getItem("slideqa.refresh")).toBe("ref-1");
    expect(JSON.stringify({ ...localStorage })).not.toContain("acc-1");
    expect(session.getAccess()).toBe("acc-1");
  });
});

describe("đăng ký", () => {
  it("kiểm tra từng trường và bắt buộc đồng ý điều khoản trước khi gọi API", async () => {
    const api = mockApi({});
    renderApp("/register");
    await heading("Tạo tài khoản");
    await userEvent.type(screen.getByLabelText("Mật khẩu"), "ngan");
    await userEvent.click(screen.getByRole("button", { name: "Đăng ký" }));
    expect(screen.getByText("Hãy nhập tên hiển thị.")).toBeInTheDocument();
    expect(screen.getByText("Email chưa đúng định dạng.")).toBeInTheDocument();
    expect(screen.getByText("Mật khẩu cần ít nhất 8 ký tự.")).toBeInTheDocument();
    expect(screen.getByText(/Bạn cần đồng ý Điều khoản/)).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-invalid", "true");
    expect(api.fn).not.toHaveBeenCalled();
  });

  it("hiện độ mạnh mật khẩu khi gõ", async () => {
    mockApi({});
    renderApp("/register");
    await userEvent.type(await screen.findByLabelText("Mật khẩu"), "Abcdefgh1234!");
    expect(screen.getByText(/Độ mạnh: mạnh/)).toBeInTheDocument();
  });

  it("email đã dùng (409): lỗi ở ô email kèm liên kết đăng nhập", async () => {
    mockApi({
      "POST /auth/register": () => err(409, "email_taken", "Email này đã được dùng."),
    });
    renderApp("/register");
    await userEvent.type(await screen.findByLabelText("Tên hiển thị"), "Tú");
    await userEvent.type(screen.getByLabelText("Email"), "tu@example.test");
    await userEvent.type(screen.getByLabelText("Mật khẩu"), "mat-khau-thu-123");
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: "Đăng ký" }));
    expect(await screen.findByText("Email này đã được dùng.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Đăng nhập?" })).toHaveAttribute("href", "/login");
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
  });

  it("thành công: gửi acceptTerms và email đã chuẩn hóa, rồi vào /app", async () => {
    const api = mockApi({
      "POST /auth/register": () => ({ status: 201, json: tokens(1) }),
    });
    renderApp("/register");
    await userEvent.type(await screen.findByLabelText("Tên hiển thị"), "  Tú  ");
    await userEvent.type(screen.getByLabelText("Email"), "TU@Example.test");
    await userEvent.type(screen.getByLabelText("Mật khẩu"), "mat-khau-thu-123");
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: "Đăng ký" }));
    expect(await heading(/Chào Tú/)).toBeInTheDocument();
    expect(api.calls[0]?.body).toEqual({
      email: "tu@example.test",
      password: "mat-khau-thu-123",
      displayName: "Tú",
      acceptTerms: true,
    });
  });

  it("liên kết điều khoản và chính sách mở đúng trang", async () => {
    mockApi({});
    renderApp("/register");
    expect(await screen.findByRole("link", { name: "Điều khoản sử dụng" })).toHaveAttribute("href", "/terms");
    expect(screen.getByRole("link", { name: "Chính sách bảo vệ dữ liệu cá nhân" })).toHaveAttribute("href", "/privacy");
  });
});

describe("bảo vệ route và phiên", () => {
  it("chưa đăng nhập vào /app thì chuyển về /login", async () => {
    mockApi({});
    renderApp("/app");
    expect(await heading("Đăng nhập")).toBeInTheDocument();
  });

  it("đã đăng nhập mà vào /login thì chuyển vào /app", async () => {
    session.setRefresh("ref-1");
    mockApi({
      "POST /auth/refresh": () => ({ json: tokens(2) }),
      "GET /me": () => ({ json: USER }),
    });
    renderApp("/login");
    expect(await heading(/Chào Tú/)).toBeInTheDocument();
  });

  it("tải lại trang (F5) với refresh token đã lưu: khôi phục phiên và xoay vòng token", async () => {
    session.setRefresh("ref-1");
    const api = mockApi({
      "POST /auth/refresh": ({ body }) => (body.refreshToken === "ref-1" ? { json: tokens(2) } : err(401, "invalid_refresh_token", "x")),
      "GET /me": ({ headers }) => (headers.get("authorization") === "Bearer acc-2" ? { json: USER } : err(401, "unauthorized", "x")),
    });
    renderApp("/app");
    expect(await heading(/Chào Tú/)).toBeInTheDocument();
    expect(api.count("POST /auth/refresh")).toBe(1);
    expect(session.getRefresh()).toBe("ref-2");
  });

  it("refresh token không còn hợp lệ: về /login và xóa phiên", async () => {
    session.setRefresh("het-han");
    mockApi({
      "POST /auth/refresh": () => err(401, "invalid_refresh_token", "Phiên đã hết hạn"),
    });
    renderApp("/app");
    expect(await heading("Đăng nhập")).toBeInTheDocument();
    expect(session.getRefresh()).toBeNull();
  });

  it("mất mạng khi khôi phục phiên: giữ phiên, hiện nút Thử lại, thử lại được", async () => {
    session.setRefresh("ref-1");
    let online = false;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (!online) throw new TypeError("Failed to fetch");
        const res = (j: unknown) => new Response(JSON.stringify(j), { status: 200 });
        if (String(url).endsWith("/courses")) return res([]);
        return String(url).endsWith("/auth/refresh") ? res(tokens(2)) : res(USER);
      }),
    );
    renderApp("/app");
    expect(await screen.findByRole("alert")).toHaveTextContent("Không kết nối được máy chủ");
    expect(session.getRefresh()).toBe("ref-1");
    online = true;
    await userEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(await heading(/Chào Tú/)).toBeInTheDocument();
  });

  it("đăng xuất: báo server thu hồi token, xóa phiên, về /login", async () => {
    session.setRefresh("ref-1");
    const api = mockApi({
      "POST /auth/refresh": () => ({ json: tokens(2) }),
      "GET /me": () => ({ json: USER }),
      "POST /auth/logout": () => ({ status: 204 }),
    });
    renderApp("/app");
    await heading(/Chào Tú/);
    await userEvent.click(screen.getByRole("button", { name: "Đăng xuất" }));
    expect(await heading("Đăng nhập")).toBeInTheDocument();
    expect(session.getRefresh()).toBeNull();
    expect(session.getAccess()).toBeNull();
    expect(api.calls.find((c) => c.path === "/auth/logout")?.body).toEqual({
      refreshToken: "ref-2",
    });
  });

  it("phiên hết hạn giữa chừng: tự về /login kèm thông báo", async () => {
    session.setRefresh("ref-1");
    mockApi({
      "POST /auth/refresh": ({ body }) => (body.refreshToken === "ref-1" ? { json: tokens(2) } : err(401, "invalid_refresh_token", "x")),
      "GET /me": () => ({ json: USER }),
      "GET /courses": () => err(401, "unauthorized", "x"),
    });
    renderApp("/app");
    await heading(/Chào Tú/);
    await act(async () => {
      await request("GET", "/courses").catch(() => undefined);
    });
    expect(await heading("Đăng nhập")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Phiên đăng nhập đã hết hạn");
  });

  it("đường dẫn lạ hiện trang 404", async () => {
    mockApi({});
    renderApp("/khong-co");
    expect(await heading("Không tìm thấy trang")).toBeInTheDocument();
  });
});
