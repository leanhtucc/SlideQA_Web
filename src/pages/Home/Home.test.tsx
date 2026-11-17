import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { session } from "src/helpers/session";
import { err, mockApi, tokens, USER, type Handler } from "src/test/mockApi";
import { renderApp } from "src/test/renderApp";

const C = (o: Partial<Course> = {}): Course => ({
  id: "c1",
  name: "Phân tích quy trình",
  code: "IS201",
  term: "HK1",
  examDate: null,
  createdAt: "2026-11-01T00:00:00Z",
  documentCount: 0,
  quizCount: 0,
  ...o,
});

/** Backend giả có trạng thái: danh sách môn học thay đổi theo POST/PATCH/DELETE. */
function backend(initial: Course[], extra: Record<string, Handler> = {}) {
  session.setRefresh("ref-1");
  let list = [...initial];
  const api = mockApi({
    "POST /auth/refresh": () => ({ json: tokens(2) }),
    "GET /me": () => ({ json: USER }),
    "GET /courses": () => ({ json: list }),
    "POST /courses": ({ body }) => {
      const c = C({ id: "new", name: body.name, code: body.code || null, term: body.term || null, examDate: body.examDate });
      list = [c, ...list];
      return { status: 201, json: c };
    },
    "PATCH /courses/c1": ({ body }) => {
      list = list.map((c) => (c.id === "c1" ? { ...c, name: body.name, code: body.code || null, term: body.term || null, examDate: body.examDate } : c));
      return { json: list.find((c) => c.id === "c1") };
    },
    "DELETE /courses/c1": () => {
      list = list.filter((c) => c.id !== "c1");
      return { status: 204 };
    },
    ...extra,
  });
  return api;
}
const dialog = (name: string) => within(screen.getByRole(name === "Xóa" ? "alertdialog" : "dialog", { name: new RegExp(name) }));

describe("Tổng quan: danh sách môn học", () => {
  it("đang tải thì hiện khung xương, rồi hiện các môn với mã, học kỳ, ngày thi và số liệu", async () => {
    backend([C({ examDate: "2027-01-12", documentCount: 2, quizCount: 3 }), C({ id: "c2", name: "Cơ sở dữ liệu", code: null, term: null, documentCount: 1 })]);
    renderApp("/app");
    expect(await screen.findByLabelText("Đang tải môn học")).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "Phân tích quy trình" })).toHaveAttribute("href", "/app/courses/c1");
    expect(screen.getByText("IS201 · HK1")).toBeInTheDocument();
    expect(screen.getByText("Thi 12/01")).toBeInTheDocument();
    expect(screen.getByText("2 tài liệu · 3 quiz")).toBeInTheDocument();
    expect(screen.getByText("1 tài liệu · 0 quiz")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sửa môn Cơ sở dữ liệu" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tổng quan" })).toHaveAttribute("aria-current", "page");
  });

  it("chưa có môn nào: trạng thái rỗng dẫn tới tạo môn đầu tiên", async () => {
    backend([]);
    renderApp("/app");
    expect(await screen.findByText("Chưa có môn học nào")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Tạo môn học đầu tiên" }));
    expect(await screen.findByRole("dialog", { name: "Môn học mới" })).toBeVisible();
  });

  it("lỗi tải: báo lỗi và thử lại được", async () => {
    let ok = false;
    backend([C()], { "GET /courses": () => (ok ? { json: [C()] } : err(500, "internal", "Lỗi máy chủ.")) });
    renderApp("/app");
    expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được danh sách môn học.");
    ok = true;
    await userEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(await screen.findByRole("link", { name: "Phân tích quy trình" })).toBeInTheDocument();
  });

  it("đếm ngược tới kỳ thi gần nhất", async () => {
    const d = new Date();
    const iso = (days: number) => {
      const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
      return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
    };
    backend([C({ name: "Môn xa", examDate: iso(40) }), C({ id: "c2", name: "Môn gần", examDate: iso(10) }), C({ id: "c3", name: "Môn đã thi", examDate: iso(-5) })]);
    renderApp("/app");
    expect(await screen.findByText(/Thi môn Môn gần/)).toHaveTextContent("còn 10 ngày");
  });
});

describe("tạo, sửa, xóa môn học", () => {
  it("tạo môn: kiểm tra tên bắt buộc, gửi dữ liệu đã làm sạch, đóng hộp thoại và làm mới danh sách", async () => {
    const api = backend([]);
    renderApp("/app");
    await userEvent.click(await screen.findByRole("button", { name: "Tạo môn học đầu tiên" }));
    const dlg = dialog("Môn học mới");

    await userEvent.click(dlg.getByRole("button", { name: "Tạo môn học" }));
    expect(dlg.getByText("Hãy nhập tên môn học.")).toBeInTheDocument();
    expect(api.count("POST /courses")).toBe(0);

    await userEvent.type(dlg.getByLabelText("Tên môn học"), "  Cơ sở dữ liệu ");
    await userEvent.type(dlg.getByLabelText(/Mã môn/), "IS207");
    await userEvent.type(dlg.getByLabelText(/Ngày thi/), "2027-01-12");
    await userEvent.click(dlg.getByRole("button", { name: "Tạo môn học" }));

    expect(await screen.findByRole("link", { name: "Cơ sở dữ liệu" })).toBeInTheDocument();
    expect(api.calls.find((c) => c.method === "POST" && c.path === "/courses")?.body).toEqual({ name: "Cơ sở dữ liệu", code: "IS207", term: "", examDate: "2027-01-12" });
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Môn học mới" })).not.toBeInTheDocument());
  });

  it("lỗi từ máy chủ hiện ở đúng ô và hộp thoại vẫn mở", async () => {
    backend([], { "POST /courses": () => err(422, "validation_error", "Dữ liệu chưa hợp lệ.", { fields: { examDate: "Ngày thi phải có dạng YYYY-MM-DD." } }) });
    renderApp("/app");
    await userEvent.click(await screen.findByRole("button", { name: "Tạo môn học đầu tiên" }));
    const dlg = dialog("Môn học mới");
    await userEvent.type(dlg.getByLabelText("Tên môn học"), "Môn A");
    await userEvent.click(dlg.getByRole("button", { name: "Tạo môn học" }));
    expect(await dlg.findByText("Ngày thi phải có dạng YYYY-MM-DD.")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Môn học mới" })).toBeVisible();
  });

  it("sửa môn: form điền sẵn giá trị cũ, lưu thì danh sách đổi", async () => {
    const api = backend([C({ examDate: "2027-01-12" })]);
    renderApp("/app");
    await userEvent.click(await screen.findByRole("button", { name: "Sửa môn Phân tích quy trình" }));
    const dlg = dialog("Sửa môn học");
    expect(dlg.getByLabelText("Tên môn học")).toHaveValue("Phân tích quy trình");
    expect(dlg.getByLabelText(/Mã môn/)).toHaveValue("IS201");
    expect(dlg.getByLabelText(/Ngày thi/)).toHaveValue("2027-01-12");

    await userEvent.clear(dlg.getByLabelText("Tên môn học"));
    await userEvent.type(dlg.getByLabelText("Tên môn học"), "QTNV");
    await userEvent.clear(dlg.getByLabelText(/Ngày thi/));
    await userEvent.click(dlg.getByRole("button", { name: "Lưu thay đổi" }));

    expect(await screen.findByRole("link", { name: "QTNV" })).toBeInTheDocument();
    expect(api.calls.find((c) => c.method === "PATCH")?.body).toMatchObject({ name: "QTNV", examDate: null });
    expect(screen.queryByText(/Thi \d/)).not.toBeInTheDocument();
  });

  it("xóa môn: hộp xác nhận nêu rõ số tài liệu và quiz; Giữ lại thì không xóa (FR-CRS-03)", async () => {
    const api = backend([C({ documentCount: 2, quizCount: 3 })]);
    renderApp("/app");
    await userEvent.click(await screen.findByRole("button", { name: "Xóa môn Phân tích quy trình" }));
    const dlg = dialog("Xóa");
    expect(dlg.getByText(/không hoàn tác được/)).toBeInTheDocument();
    expect(dlg.getByText("2 tài liệu")).toBeInTheDocument();
    expect(dlg.getByText("3 quiz")).toBeInTheDocument();

    await userEvent.click(dlg.getByRole("button", { name: "Giữ lại" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(api.count("DELETE /courses/c1")).toBe(0);
    expect(screen.getByRole("link", { name: "Phân tích quy trình" })).toBeInTheDocument();
  });

  it("xác nhận xóa: gọi API, môn biến mất khỏi danh sách", async () => {
    const api = backend([C({ documentCount: 2, quizCount: 3 })]);
    renderApp("/app");
    await userEvent.click(await screen.findByRole("button", { name: "Xóa môn Phân tích quy trình" }));
    await userEvent.click(dialog("Xóa").getByRole("button", { name: "Xóa môn và 5 mục" }));
    expect(await screen.findByText("Chưa có môn học nào")).toBeInTheDocument();
    expect(api.count("DELETE /courses/c1")).toBe(1);
  });

  it("xóa thất bại: báo lỗi trong hộp thoại và giữ nguyên môn", async () => {
    backend([C()], { "DELETE /courses/c1": () => err(500, "internal", "Lỗi máy chủ.") });
    renderApp("/app");
    await userEvent.click(await screen.findByRole("button", { name: "Xóa môn Phân tích quy trình" }));
    expect(dialog("Xóa").getByText(/Môn này chưa có tài liệu hay quiz/)).toBeInTheDocument();
    await userEvent.click(dialog("Xóa").getByRole("button", { name: "Xóa môn" }));
    expect(await dialog("Xóa").findByText("Lỗi máy chủ.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Phân tích quy trình" })).toBeInTheDocument();
  });

  it("đăng xuất rồi đăng nhập người khác: không thấy dữ liệu của người trước (cache bị xóa)", async () => {
    let who: "A" | "B" = "A";
    session.setRefresh("ref-1");
    mockApi({
      "POST /auth/refresh": () => ({ json: tokens(2) }),
      "GET /me": () => ({ json: USER }),
      "GET /courses": () => ({ json: who === "A" ? [C({ name: "Môn của A" })] : [C({ id: "b1", name: "Môn của B" })] }),
      "POST /auth/logout": () => ({ status: 204 }),
      "POST /auth/login": () => ({ json: tokens(3) }),
    });
    renderApp("/app");
    expect(await screen.findByRole("link", { name: "Môn của A" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Đăng xuất" }));
    await screen.findByRole("heading", { name: "Đăng nhập" });

    who = "B";
    await userEvent.type(screen.getByLabelText("Email"), "b@example.test");
    await userEvent.type(screen.getByLabelText("Mật khẩu"), "mat-khau-thu-123");
    await userEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));
    expect(await screen.findByRole("link", { name: "Môn của B" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Môn của A" })).not.toBeInTheDocument();
  });
});

describe("chi tiết môn học", () => {
  it("hiện thông tin môn và đường dẫn quay lại", async () => {
    backend([], { "GET /courses/c1": () => ({ json: C({ examDate: "2027-01-12", documentCount: 4, quizCount: 1 }) }) });
    renderApp("/app/courses/c1");
    expect(await screen.findByRole("heading", { name: "Phân tích quy trình" })).toBeInTheDocument();
    expect(screen.getByText("IS201 · HK1 · Thi ngày 12/01")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Môn học" })).toHaveAttribute("href", "/app");
  });

  it("môn không tồn tại (hoặc của người khác): báo không tìm thấy, không thử lại", async () => {
    const api = backend([], { "GET /courses/zzz": () => err(404, "not_found", "Không tìm thấy môn học.") });
    renderApp("/app/courses/zzz");
    expect(await screen.findByRole("alert")).toHaveTextContent("Không tìm thấy môn học này.");
    expect(api.count("GET /courses/zzz")).toBe(1);
  });
});

vi.setConfig({ testTimeout: 15_000 });
