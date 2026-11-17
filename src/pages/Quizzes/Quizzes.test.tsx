import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { session } from "src/helpers/session";
import { err, mockApi, tokens, USER, type Handler } from "src/test/mockApi";
import { renderApp } from "src/test/renderApp";

// pdf.js cần canvas/worker nên thay bằng khung giả chỉ phơi ra trang đang mở.
vi.mock("src/components/PdfViewer/PdfViewer", () => ({ default: (p: { page: number }) => <div data-testid="pdf" data-page={p.page} /> }));

const DOC: CourseDocument = {
  id: "d1",
  courseId: "c1",
  name: "Slide BPMN.pdf",
  sizeBytes: 1000,
  status: "ready",
  error: null,
  pages: 10,
  emptyPages: 0,
  createdAt: "2026-11-02T00:00:00Z",
  warning: null,
};
const QUIZ: QuizSummary = {
  id: "q1",
  documentId: "d1",
  courseId: "c1",
  documentName: "Slide BPMN.pdf",
  courseName: "Quy trình",
  fromPage: 1,
  toPage: 10,
  count: 2,
  createdAt: "2026-11-03T00:00:00Z",
  attemptCount: 1,
  bestScore: 1,
};

const item = (n: number, extra: Partial<AttemptItem> = {}): AttemptItem => ({
  id: `i${n}`,
  position: n - 1,
  question: `Câu hỏi ${n}?`,
  options: ["Một", "Hai", "Ba", "Bốn"],
  page: n + 2,
  documentId: "d1",
  chosenIndex: null,
  isCorrect: null,
  ...extra,
});

function backend(consented: boolean, extra: Record<string, Handler> = {}) {
  session.setRefresh("ref-1");
  let items = [item(1), item(2)];
  let finished = false;
  const view = (): Attempt => ({
    id: "a1",
    quizId: "q1",
    score: finished ? items.filter((i) => i.isCorrect).length : null,
    total: 2,
    durationS: finished ? 90 : null,
    startedAt: "2026-11-03T00:00:00Z",
    finishedAt: finished ? "2026-11-03T00:01:30Z" : null,
    items: finished ? items.map((i) => ({ ...i, correctIndex: 1, explanation: `Giải thích ${i.position + 1}` })) : items,
  });
  const api = mockApi({
    "POST /auth/refresh": () => ({ json: tokens(2) }),
    "GET /me": () => ({ json: { ...USER, llmConsentAt: consented ? "2026-11-01T00:00:00Z" : null } }),
    "GET /quizzes": () => ({ json: [QUIZ] }),
    "GET /documents": () => ({ json: [DOC] }),
    "POST /quizzes": () => ({ status: 201, json: { id: "q1" } }),
    "PUT /me/llm-consent": () => ({ json: { llmConsentAt: "2026-11-02T00:00:00Z" } }),
    "POST /quizzes/q1/attempts": () => ({ status: 201, json: view() }),
    "GET /attempts/a1": () => ({ json: view() }),
    "PUT /attempts/a1/answers/i1": ({ body }) => {
      const ok = body.chosenIndex === 1;
      items = items.map((i) => (i.id === "i1" ? { ...i, chosenIndex: body.chosenIndex, isCorrect: ok, correctIndex: 1, explanation: "Vì hai là đáp án." } : i));
      return { json: { isCorrect: ok } };
    },
    "PUT /attempts/a1/answers/i2": ({ body }) => {
      items = items.map((i) => (i.id === "i2" ? { ...i, chosenIndex: body.chosenIndex, isCorrect: true, correctIndex: 1, explanation: "Đúng rồi." } : i));
      return { json: { isCorrect: true } };
    },
    "POST /attempts/a1/finish": () => {
      finished = true;
      return { json: view() };
    },
    ...extra,
  });
  return api;
}

describe("quiz", () => {
  it("liệt kê quiz kèm điểm tốt nhất", async () => {
    backend(true);
    renderApp("/app/quizzes");
    expect(await screen.findByText("Slide BPMN.pdf")).toBeInTheDocument();
    expect(screen.getByText(/Tốt nhất 1\/2 · 1 lần/)).toBeInTheDocument();
  });

  it("làm trọn một quiz: chấm ngay kèm giải thích, nộp bài, xem điểm", async () => {
    const api = backend(true);
    renderApp("/app/attempts/a1");
    expect(await screen.findByRole("heading", { name: "Câu hỏi 1?" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Một/ })); // sai
    expect(await screen.findByText(/Chưa đúng, đáp án là B/)).toBeInTheDocument();
    expect(screen.getByText(/Vì hai là đáp án/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Hai/ })).toBeDisabled(); // chấm rồi thì khóa

    await userEvent.click(screen.getByRole("button", { name: "Câu sau" }));
    await userEvent.click(await screen.findByRole("button", { name: /Hai/ }));
    expect(await screen.findByText("Đúng.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Nộp bài" }));
    expect(await screen.findByText("1/2")).toBeInTheDocument();
    expect(screen.getByText(/khoảng 2 phút/)).toBeInTheDocument();
    expect(screen.getByText("Giải thích 1")).toBeInTheDocument();
    expect(api.count("POST /attempts/a1/finish")).toBe(1);
  });

  it("nộp khi còn câu chưa làm: báo rõ và tính là sai", async () => {
    backend(true);
    renderApp("/app/attempts/a1");
    await userEvent.click(await screen.findByRole("button", { name: "Câu sau" }));
    expect(await screen.findByRole("button", { name: "Nộp bài (còn 2 câu chưa làm)" })).toBeInTheDocument();
  });

  it("kết quả: bấm Xem slide trang N mở không gian học đúng trang", async () => {
    backend(true, {
      "POST /conversations": () => ({ status: 201, json: { id: "v9" } }),
      "GET /conversations/v9": () => ({
        json: { id: "v9", title: "Hội thoại mới", courseId: null, scopeDocumentIds: ["d1"], createdAt: "2026-11-02T00:00:00Z", updatedAt: "2026-11-02T00:00:00Z", messages: [] },
      }),
    });
    renderApp("/app/attempts/a1");
    await userEvent.click(await screen.findByRole("button", { name: /Một/ }));
    await userEvent.click(await screen.findByRole("button", { name: "Câu sau" }));
    await userEvent.click(await screen.findByRole("button", { name: /Hai/ }));
    await userEvent.click(await screen.findByRole("button", { name: "Nộp bài" }));
    const list = await screen.findByRole("list");
    await userEvent.click(within(list).getByRole("button", { name: "Xem slide trang 3" }));
    await waitFor(() => expect(screen.getByTestId("pdf")).toHaveAttribute("data-page", "3"));
  });

  it("tạo quiz khi chưa đồng ý: hỏi đồng ý trước, rồi tạo và vào làm bài", async () => {
    const api = backend(false);
    renderApp("/app/quizzes");
    await userEvent.click(await screen.findByRole("button", { name: "Tạo quiz mới" }));
    await userEvent.click(await screen.findByRole("button", { name: "Tạo quiz" }));
    await userEvent.click(await screen.findByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: "Đồng ý và tiếp tục" }));
    await waitFor(() => expect(api.count("POST /quizzes")).toBe(1));
    expect(api.calls.find((c) => c.method === "POST" && c.path === "/quizzes")?.body).toMatchObject({ documentId: "d1", count: 5 });
    expect(await screen.findByRole("heading", { name: "Câu hỏi 1?" })).toBeInTheDocument();
  });

  it("kiểm tra khoảng trang trước khi gọi API", async () => {
    const api = backend(true);
    renderApp("/app/quizzes");
    await userEvent.click(await screen.findByRole("button", { name: "Tạo quiz mới" }));
    await userEvent.type(await screen.findByLabelText("Từ trang"), "8");
    await userEvent.type(screen.getByLabelText("Đến trang"), "3");
    await userEvent.click(screen.getByRole("button", { name: "Tạo quiz" }));
    expect(await screen.findByText(/Trang kết thúc phải lớn hơn/)).toBeInTheDocument();
    expect(api.count("POST /quizzes")).toBe(0);
  });

  it("lỗi từ máy chủ khi tạo quiz hiện rõ trong hộp thoại", async () => {
    backend(true, { "POST /quizzes": () => err(502, "llm_failed", "Không tạo được quiz lúc này. Hãy thử lại sau.") });
    renderApp("/app/quizzes");
    await userEvent.click(await screen.findByRole("button", { name: "Tạo quiz mới" }));
    await userEvent.click(await screen.findByRole("button", { name: "Tạo quiz" }));
    expect(await screen.findByText("Không tạo được quiz lúc này. Hãy thử lại sau.")).toBeInTheDocument();
  });

  it("kết quả: báo câu có vấn đề gọi API và tải lại kết quả", async () => {
    let flagged = false;
    const api = backend(true, {
      "PUT /quizzes/q1/items/i1/flag": () => {
        flagged = true;
        return { json: { flagged: true } };
      },
    });
    renderApp("/app/attempts/a1");
    await userEvent.click(await screen.findByRole("button", { name: /Một/ }));
    await userEvent.click(await screen.findByRole("button", { name: "Câu sau" }));
    await userEvent.click(await screen.findByRole("button", { name: /Hai/ }));
    await userEvent.click(await screen.findByRole("button", { name: "Nộp bài" }));
    await userEvent.click(await screen.findByRole("button", { name: "Báo câu 1 có vấn đề" }));
    await waitFor(() => expect(flagged).toBe(true));
    expect(api.calls.find((c) => c.path === "/quizzes/q1/items/i1/flag")?.body).toEqual({ flagged: true });
    expect(await screen.findByText(/Đã báo câu này/)).toBeInTheDocument();
  });

  it("kết quả: Làm lại câu sai tạo quiz mới rồi vào làm bài; đúng hết thì không có nút", async () => {
    const api = backend(true, {
      "POST /attempts/a1/retry-wrong": () => ({ status: 201, json: { id: "q2" } }),
      "POST /quizzes/q2/attempts": () => ({ status: 201, json: { id: "a2", quizId: "q2", score: null, total: 1, durationS: null, startedAt: "2026-11-03T00:00:00Z", finishedAt: null, items: [item(1, { id: "r1", question: "Câu làm lại?" })] } }),
      "GET /attempts/a2": () => ({ json: { id: "a2", quizId: "q2", score: null, total: 1, durationS: null, startedAt: "2026-11-03T00:00:00Z", finishedAt: null, items: [item(1, { id: "r1", question: "Câu làm lại?" })] } }),
    });
    renderApp("/app/attempts/a1");
    await userEvent.click(await screen.findByRole("button", { name: /Một/ })); // sai
    await userEvent.click(await screen.findByRole("button", { name: "Câu sau" }));
    await userEvent.click(await screen.findByRole("button", { name: /Hai/ }));
    await userEvent.click(await screen.findByRole("button", { name: "Nộp bài" }));
    await userEvent.click(await screen.findByRole("button", { name: "Làm lại 1 câu sai" }));
    expect(await screen.findByRole("heading", { name: "Câu làm lại?" })).toBeInTheDocument();
    expect(api.count("POST /attempts/a1/retry-wrong")).toBe(1);
  });

  it("tạo quiz cả môn: chọn phạm vi cả môn thì gửi courseId, không gửi trang", async () => {
    const api = backend(true, {
      "GET /courses": () => ({ json: [{ id: "c1", name: "Quy trình", code: null, term: null, examDate: null, createdAt: "2026-11-01T00:00:00Z", documentCount: 1, quizCount: 0 }] }),
    });
    renderApp("/app/quizzes");
    await userEvent.click(await screen.findByRole("button", { name: "Tạo quiz mới" }));
    await userEvent.selectOptions(await screen.findByLabelText("Phạm vi"), "course");
    expect(screen.queryByLabelText("Từ trang")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Tạo quiz" }));
    await waitFor(() => expect(api.count("POST /quizzes")).toBe(1));
    expect(api.calls.find((c) => c.method === "POST" && c.path === "/quizzes")?.body).toEqual({ courseId: "c1", count: 5 });
  });

  it("quiz cả môn hiện tên môn trong danh sách", async () => {
    backend(true, { "GET /quizzes": () => ({ json: [{ ...QUIZ, documentId: null, documentName: null, fromPage: null, toPage: null }] }) });
    renderApp("/app/quizzes");
    expect(await screen.findByText("Cả môn Quy trình")).toBeInTheDocument();
    expect(screen.queryByText(/Trang null/)).not.toBeInTheDocument();
  });

  it("kết quả: Lưu câu sai thành thẻ gọi API và báo số thẻ đã tạo", async () => {
    const api = backend(true, { "POST /flashcards/from-attempt/a1": () => ({ status: 201, json: { created: 1, skipped: 0 } }) });
    renderApp("/app/attempts/a1");
    await userEvent.click(await screen.findByRole("button", { name: /Một/ }));
    await userEvent.click(await screen.findByRole("button", { name: "Câu sau" }));
    await userEvent.click(await screen.findByRole("button", { name: /Hai/ }));
    await userEvent.click(await screen.findByRole("button", { name: "Nộp bài" }));
    await userEvent.click(await screen.findByRole("button", { name: "Lưu câu sai thành thẻ" }));
    expect(await screen.findByText("Đã tạo 1 thẻ ghi nhớ.")).toBeInTheDocument();
    expect(api.count("POST /flashcards/from-attempt/a1")).toBe(1);
  });
});
