import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { session } from "src/helpers/session";
import { err, mockApi, tokens, USER, type Handler } from "src/test/mockApi";
import { FakeXHR, installFakeXhr } from "src/test/fakeXhr";
import { renderApp } from "src/test/renderApp";

// Hỏi lại trạng thái nhanh để test không phải chờ 2 giây.
vi.mock("src/constants/upload", async (orig) => ({ ...(await orig<typeof import("src/constants/upload")>()), POLL_MS: 50 }));

const COURSE: Course = { id: "c1", name: "Phân tích quy trình", code: "IS201", term: "HK1", examDate: null, createdAt: "2026-11-01T00:00:00Z", documentCount: 0, quizCount: 0 };
const D = (o: Partial<CourseDocument> = {}): CourseDocument => ({
  id: "d1",
  courseId: "c1",
  name: "Slide BPMN – Tuần 3.pdf",
  sizeBytes: 3355443,
  status: "ready",
  error: null,
  pages: 24,
  emptyPages: 0,
  createdAt: new Date(2026, 10, 2, 9).toISOString(),
  warning: null,
  ...o,
});
const pdf = (name: string, size?: number) => {
  const f = new File(["%PDF-1.4 test"], name, { type: "application/pdf" });
  if (size !== undefined) Object.defineProperty(f, "size", { value: size });
  return f;
};

function backend(initial: CourseDocument[], extra: Record<string, Handler> = {}) {
  session.setRefresh("ref-1");
  let docs = [...initial];
  const api = mockApi({
    "POST /auth/refresh": () => ({ json: tokens(2) }),
    "GET /me": () => ({ json: USER }),
    "GET /courses": () => ({ json: [COURSE] }),
    "GET /courses/c1": () => ({ json: COURSE }),
    "GET /documents?courseId=c1": () => ({ json: docs }),
    "PATCH /documents/d1": ({ body }) => {
      docs = docs.map((d) => (d.id === "d1" ? { ...d, name: body.name } : d));
      return { json: docs.find((d) => d.id === "d1") };
    },
    "DELETE /documents/d1": () => {
      docs = docs.filter((d) => d.id !== "d1");
      return { status: 204 };
    },
    "POST /documents/d3/retry": () => {
      docs = docs.map((d) => (d.id === "d3" ? { ...d, status: "processing", error: null } : d));
      return { status: 202, json: docs.find((d) => d.id === "d3") };
    },
    ...extra,
  });
  return { api, setDocs: (d: CourseDocument[]) => (docs = d) };
}
const fileInput = () => document.querySelector<HTMLInputElement>('input[type="file"]')!;
const waitInstances = (n: number) => waitFor(() => expect(FakeXHR.instances.length).toBe(n));

describe("danh sách tài liệu", () => {
  it("hiện từng trạng thái: sẵn sàng, cảnh báo trang trống, đang xử lý, lỗi có Thử lại", async () => {
    backend([
      D(),
      D({ id: "d2", name: "Scan.pdf", status: "ready", pages: 38, emptyPages: 3, warning: "3/38 trang không có chữ (có thể là ảnh scan). Phần đó chưa tìm kiếm được." }),
      D({ id: "d3", name: "Hỏng.pdf", status: "failed", pages: 0, error: "Không đọc được PDF. Tệp có thể bị hỏng." }),
      D({ id: "d4", name: "Mới.pdf", status: "processing", pages: 0 }),
    ]);
    renderApp("/app/courses/c1");
    expect(await screen.findByRole("heading", { name: "Tài liệu (4)" })).toBeInTheDocument();
    expect(screen.getByText("24 trang · 3,2 MB · tải ngày 02/11")).toBeInTheDocument();
    expect(screen.getAllByText("Sẵn sàng", { selector: ".badge" })).toHaveLength(2);
    expect(screen.getByText("3 trang trống")).toBeInTheDocument();
    expect(screen.getByText(/3\/38 trang không có chữ/)).toBeInTheDocument();
    expect(screen.getByText("Đang xử lý")).toBeInTheDocument();
    expect(screen.getByText(/Không đọc được PDF. Tệp có thể bị hỏng./)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
  });

  it("chưa có tài liệu: nhắc kéo thả; luôn nhắc chỉ tải tài liệu có quyền sử dụng", async () => {
    backend([]);
    renderApp("/app/courses/c1");
    expect(await screen.findByText(/Chưa có tài liệu nào/)).toBeInTheDocument();
    expect(screen.getByText(/Chỉ tải tài liệu bạn có quyền sử dụng/)).toBeInTheDocument();
    expect(screen.getByText(/tối đa 50 MB mỗi tệp/)).toBeInTheDocument();
  });

  it("tự hỏi lại trạng thái khi còn tài liệu đang xử lý và cập nhật khi xong", async () => {
    const { setDocs, api } = backend([D({ status: "processing", pages: 0 })]);
    renderApp("/app/courses/c1");
    expect(await screen.findByText("Đang xử lý")).toBeInTheDocument();
    setDocs([D({ status: "ready", pages: 24 })]);
    expect(await screen.findByText("Sẵn sàng", { selector: ".badge" })).toBeInTheDocument();
    const polls = api.count("GET /documents?courseId=c1");
    await new Promise((r) => setTimeout(r, 250));
    expect(api.count("GET /documents?courseId=c1")).toBe(polls); // đã xong thì ngừng hỏi lại
  });

  it("lỗi tải danh sách: báo lỗi và thử lại được", async () => {
    let ok = false;
    backend([D()], { "GET /documents?courseId=c1": () => (ok ? { json: [D()] } : err(500, "internal", "x")) });
    renderApp("/app/courses/c1");
    expect(await screen.findByText("Không tải được danh sách tài liệu.")).toBeInTheDocument();
    ok = true;
    await userEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(await screen.findByText("Slide BPMN – Tuần 3.pdf")).toBeInTheDocument();
  });
});

describe("tải lên", () => {
  it("nhiều tệp: tối đa 2 tệp cùng lúc, mỗi tệp có tiến độ riêng, tệp xong thì danh sách được làm mới", async () => {
    installFakeXhr();
    const { api, setDocs } = backend([]);
    renderApp("/app/courses/c1");
    await screen.findByText(/Chưa có tài liệu nào/);
    await userEvent.upload(fileInput(), [pdf("a.pdf"), pdf("b.pdf"), pdf("c.pdf")]);

    await waitInstances(2);
    expect(screen.getByText(/c\.pdf/).closest(".doc-row")).toHaveTextContent("Đang chờ tới lượt");
    const [a, b] = FakeXHR.instances as [FakeXHR, FakeXHR];
    expect(a.method).toBe("POST");
    expect(a.url).toMatch(/\/documents$/);
    expect(a.headers["authorization"]).toBe("Bearer acc-2");
    expect(a.body?.get("courseId")).toBe("c1");
    expect((a.body?.get("file") as File).name).toBe("a.pdf");

    act(() => a.progress(50, 100));
    expect(screen.getByRole("progressbar", { name: "Tiến độ tải lên a.pdf" })).toHaveAttribute("aria-valuenow", "50");
    act(() => b.progress(10, 100));
    expect(screen.getByRole("progressbar", { name: "Tiến độ tải lên b.pdf" })).toHaveAttribute("aria-valuenow", "10");

    setDocs([D({ id: "n1", name: "a.pdf", status: "processing", pages: 0 })]);
    act(() => a.respond(202, D({ id: "n1", name: "a.pdf", status: "processing", pages: 0 })));
    await waitInstances(3); // tệp c bắt đầu khi a xong
    expect(screen.queryByRole("progressbar", { name: "Tiến độ tải lên a.pdf" })).not.toBeInTheDocument();
    expect(await screen.findByText("Đang xử lý")).toBeInTheDocument(); // a.pdf hiện trong danh sách
    expect(api.count("GET /documents?courseId=c1")).toBeGreaterThan(1);
  });

  it("tải tệp giống hệt tài liệu đã có: báo cho người dùng và cho xóa bản mới", async () => {
    installFakeXhr();
    const { api } = backend([D()], { "DELETE /documents/n1": () => ({ status: 204 }) });
    renderApp("/app/courses/c1");
    await screen.findByText("Slide BPMN – Tuần 3.pdf");
    await userEvent.upload(fileInput(), pdf("copy.pdf"));
    await waitInstances(1);
    act(() => FakeXHR.instances[0]!.respond(202, { ...D({ id: "n1", name: "copy.pdf", status: "processing", pages: 0 }), duplicateOf: { id: "d1", name: "Slide BPMN – Tuần 3.pdf" } }));
    expect(await screen.findByText(/"copy.pdf" giống hệt "Slide BPMN – Tuần 3.pdf"/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Xóa bản mới" }));
    await waitFor(() => expect(api.count("DELETE /documents/n1")).toBe(1));
  });

  it("từ chối ngay tệp không phải PDF hoặc quá 50 MB, không gửi gì lên máy chủ (FR-DOC-01)", async () => {
    installFakeXhr();
    backend([]);
    renderApp("/app/courses/c1");
    await screen.findByText(/Chưa có tài liệu nào/);
    const user = userEvent.setup({ applyAccept: false });
    await user.upload(fileInput(), [new File(["x"], "ghi-chu.txt", { type: "text/plain" }), pdf("khong-lo.pdf", 51 * 1024 * 1024)]);
    expect(await screen.findByText("Không phải PDF. Hãy chọn tệp .pdf.")).toBeInTheDocument();
    expect(screen.getByText(/Lớn hơn 50 MB \(tệp này 51 MB\)/)).toBeInTheDocument();
    expect(FakeXHR.instances.length).toBe(0);
    expect(screen.queryByRole("button", { name: /Thử lại/ })).not.toBeInTheDocument(); // tệp bị từ chối thì không thử lại được
    await userEvent.click(screen.getByRole("button", { name: "Bỏ qua ghi-chu.txt" }));
    expect(screen.queryByText("Không phải PDF. Hãy chọn tệp .pdf.")).not.toBeInTheDocument();
  });

  it("máy chủ từ chối (422) hoặc quá lớn (413): hiện lý do, bấm Thử lại thì gửi lại", async () => {
    installFakeXhr();
    backend([]);
    renderApp("/app/courses/c1");
    await screen.findByText(/Chưa có tài liệu nào/);
    await userEvent.upload(fileInput(), pdf("hong.pdf"));
    await waitInstances(1);
    act(() => FakeXHR.instances[0]!.respond(422, { error: { code: "not_pdf", message: "Tệp này không phải PDF. Hãy chọn tệp .pdf." } }));
    const row = (await screen.findByText(/Tệp này không phải PDF/)).closest(".doc-row") as HTMLElement;
    await userEvent.click(within(row).getByRole("button", { name: "Thử lại" }));
    await waitInstances(2);
    act(() => FakeXHR.instances[1]!.respond(413, { error: { code: "file_too_large", message: "Tệp lớn hơn giới hạn cho phép (50 MB)." } }));
    expect(await screen.findByText(/Tệp lớn hơn giới hạn cho phép/)).toBeInTheDocument();
  });

  it("mất mạng giữa chừng: báo lỗi trên đúng tệp và cho thử lại", async () => {
    installFakeXhr();
    backend([]);
    renderApp("/app/courses/c1");
    await screen.findByText(/Chưa có tài liệu nào/);
    await userEvent.upload(fileInput(), pdf("a.pdf"));
    await waitInstances(1);
    act(() => FakeXHR.instances[0]!.networkError());
    expect(await screen.findByText(/Mất kết nối/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
  });

  it("hủy tệp đang tải: ngắt kết nối và bỏ khỏi danh sách", async () => {
    installFakeXhr();
    backend([]);
    renderApp("/app/courses/c1");
    await screen.findByText(/Chưa có tài liệu nào/);
    await userEvent.upload(fileInput(), pdf("a.pdf"));
    await waitInstances(1);
    await userEvent.click(screen.getByRole("button", { name: "Hủy tải a.pdf" }));
    expect(FakeXHR.instances[0]!.aborted).toBe(true);
    await waitFor(() => expect(screen.queryByText("a.pdf")).not.toBeInTheDocument());
  });

  it("access token hết hạn lúc tải lên: refresh một lần rồi tải lại bằng token mới", async () => {
    installFakeXhr();
    const { api } = backend([]);
    renderApp("/app/courses/c1");
    await screen.findByText(/Chưa có tài liệu nào/);
    await userEvent.upload(fileInput(), pdf("a.pdf"));
    await waitInstances(1);
    const refreshesBefore = api.count("POST /auth/refresh");
    act(() => FakeXHR.instances[0]!.respond(401, { error: { code: "unauthorized", message: "x" } }));
    await waitInstances(2);
    expect(api.count("POST /auth/refresh")).toBe(refreshesBefore + 1);
    expect(FakeXHR.instances[1]!.headers["authorization"]).toBe("Bearer acc-2");
    act(() => FakeXHR.instances[1]!.respond(202, D({ id: "n1", name: "a.pdf", status: "processing", pages: 0 })));
    await waitFor(() => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument());
  });

  it("kéo thả tệp vào vùng tải lên", async () => {
    installFakeXhr();
    backend([]);
    renderApp("/app/courses/c1");
    const zone = (await screen.findByText("Kéo thả PDF vào đây")).closest("label") as HTMLElement;
    fireEvent.dragOver(zone);
    expect(zone).toHaveClass("drag");
    fireEvent.drop(zone, { dataTransfer: { files: [pdf("keo-tha.pdf")] } });
    expect(zone).not.toHaveClass("drag");
    await waitInstances(1);
    expect((FakeXHR.instances[0]!.body?.get("file") as File).name).toBe("keo-tha.pdf");
  });

  it("đang tải lên thì trình duyệt cảnh báo khi đóng trang", async () => {
    installFakeXhr();
    backend([]);
    renderApp("/app/courses/c1");
    await screen.findByText(/Chưa có tài liệu nào/);
    await userEvent.upload(fileInput(), pdf("a.pdf"));
    await waitInstances(1);
    const e = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(true);
  });
});

describe("đổi tên, xóa, thử lại", () => {
  it("đổi tên: form điền sẵn tên cũ, lưu thì danh sách đổi", async () => {
    const { api } = backend([D()]);
    renderApp("/app/courses/c1");
    await userEvent.click(await screen.findByRole("button", { name: "Đổi tên Slide BPMN – Tuần 3.pdf" }));
    const dlg = within(screen.getByRole("dialog", { name: "Đổi tên tài liệu" }));
    expect(dlg.getByLabelText("Tên tài liệu")).toHaveValue("Slide BPMN – Tuần 3.pdf");
    await userEvent.clear(dlg.getByLabelText("Tên tài liệu"));
    await userEvent.click(dlg.getByRole("button", { name: "Lưu" }));
    expect(dlg.getByText("Tên tài liệu không được để trống.")).toBeInTheDocument();
    expect(api.count("PATCH /documents/d1")).toBe(0);
    await userEvent.type(dlg.getByLabelText("Tên tài liệu"), "  BPMN tuần 3.pdf ");
    await userEvent.click(dlg.getByRole("button", { name: "Lưu" }));
    expect(await screen.findByText("BPMN tuần 3.pdf")).toBeInTheDocument();
    expect(api.calls.find((c) => c.method === "PATCH")?.body).toEqual({ name: "BPMN tuần 3.pdf" });
  });

  it("xóa: hộp xác nhận nêu rõ hậu quả; Giữ lại thì không xóa; xác nhận thì tài liệu biến mất", async () => {
    const { api } = backend([D()]);
    renderApp("/app/courses/c1");
    await userEvent.click(await screen.findByRole("button", { name: "Xóa Slide BPMN – Tuần 3.pdf" }));
    const dlg = within(screen.getByRole("alertdialog"));
    expect(dlg.getByText(/tệp PDF gốc và chỉ mục tìm kiếm/)).toBeInTheDocument();
    expect(dlg.getByText(/Quiz và nguồn trích dẫn đã tạo/)).toBeInTheDocument();
    await userEvent.click(dlg.getByRole("button", { name: "Giữ lại" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(api.count("DELETE /documents/d1")).toBe(0);

    await userEvent.click(screen.getByRole("button", { name: "Xóa Slide BPMN – Tuần 3.pdf" }));
    await userEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Xóa tài liệu" }));
    expect(await screen.findByText(/Chưa có tài liệu nào/)).toBeInTheDocument();
    expect(api.count("DELETE /documents/d1")).toBe(1);
  });

  it("xóa thất bại: báo lỗi trong hộp thoại và giữ tài liệu", async () => {
    backend([D()], { "DELETE /documents/d1": () => err(500, "internal", "Lỗi máy chủ.") });
    renderApp("/app/courses/c1");
    await userEvent.click(await screen.findByRole("button", { name: "Xóa Slide BPMN – Tuần 3.pdf" }));
    await userEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Xóa tài liệu" }));
    expect(await within(screen.getByRole("alertdialog")).findByText("Lỗi máy chủ.")).toBeInTheDocument();
    expect(screen.getAllByText("Slide BPMN – Tuần 3.pdf").length).toBeGreaterThan(0);
  });

  it("tài liệu lỗi: bấm Thử lại thì chuyển sang đang xử lý", async () => {
    const { api } = backend([D({ id: "d3", name: "Hỏng.pdf", status: "failed", pages: 0, error: "Không đọc được PDF." })]);
    renderApp("/app/courses/c1");
    await userEvent.click(await screen.findByRole("button", { name: "Thử lại" }));
    expect(await screen.findByText("Đang xử lý")).toBeInTheDocument();
    expect(api.count("POST /documents/d3/retry")).toBe(1);
  });
});
