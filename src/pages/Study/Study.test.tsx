import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { session } from "src/helpers/session";
import { err, mockApi, tokens, USER, type Handler } from "src/test/mockApi";
import { renderApp } from "src/test/renderApp";

// pdf.js cần canvas/worker nên thay bằng khung giả chỉ phơi ra trang và đoạn tô sáng.
vi.mock("src/components/PdfViewer/PdfViewer", () => ({
  default: (p: { page: number; highlight?: string }) => (
    <div data-testid="pdf" data-page={p.page} data-hl={p.highlight ?? ""}>
      pdf
    </div>
  ),
}));

const DOC = (id: string, name: string): CourseDocument => ({
  id,
  courseId: "c1",
  name,
  sizeBytes: 1000,
  status: "ready",
  error: null,
  pages: 5,
  emptyPages: 0,
  createdAt: "2026-11-02T00:00:00Z",
  warning: null,
});
const SRC: MessageSource = {
  n: 1,
  documentId: "d2",
  documentName: "B.pdf",
  page: 4,
  snippet: "Gateway XOR chọn một luồng",
  documentDeleted: false,
};
const CONV: ConversationDetail = {
  id: "v1",
  title: "Hội thoại mới",
  courseId: "c1",
  scopeDocumentIds: [],
  createdAt: "2026-11-02T00:00:00Z",
  updatedAt: "2026-11-02T00:00:00Z",
  messages: [],
};
const ANSWER: ChatMessage = {
  id: "m2",
  role: "assistant",
  content: "Gateway XOR chọn một luồng [1]",
  mode: "llm",
  feedback: null,
  searchQuery: null,
  createdAt: "2026-11-02T00:00:01Z",
  sources: [SRC],
};

function backend(consented: boolean, extra: Record<string, Handler> = {}, answer: ChatMessage = ANSWER) {
  session.setRefresh("ref-1");
  let messages: ChatMessage[] = [];
  return mockApi({
    "POST /auth/refresh": () => ({ json: tokens(2) }),
    "GET /me": () => ({
      json: {
        ...USER,
        llmConsentAt: consented ? "2026-11-01T00:00:00Z" : null,
      },
    }),
    "GET /conversations/v1": () => ({ json: { ...CONV, messages } }),
    "GET /documents?courseId=c1": () => ({
      json: [DOC("d1", "A.pdf"), DOC("d2", "B.pdf")],
    }),
    "GET /documents/d1/file": () => ({ json: {} }),
    "GET /documents/d2/file": () => ({ json: {} }),
    "POST /conversations/v1/messages": ({ body }) => {
      messages = [
        {
          ...ANSWER,
          id: "m1",
          role: "user",
          content: body.question,
          mode: null,
          sources: [],
        },
        answer,
      ];
      return { json: answer };
    },
    "PUT /me/llm-consent": ({ body }) => ({
      json: { llmConsentAt: body.granted ? "2026-11-02T00:00:00Z" : null },
    }),
    ...extra,
  });
}
const ask = async (text: string) => {
  const box = await screen.findByPlaceholderText(/Hỏi về nội dung slide/);
  await userEvent.type(box, text);
  await userEvent.click(screen.getByRole("button", { name: "Gửi câu hỏi" }));
};

describe("không gian học", () => {
  it("mở sẵn tài liệu đầu tiên; bấm nguồn [1] thì PDF nhảy trang và tô đoạn gốc", async () => {
    backend(true);
    renderApp("/app/study/v1");
    await waitFor(() => expect(screen.getByTestId("pdf")).toBeInTheDocument());
    expect(screen.getByTestId("pdf")).toHaveAttribute("data-page", "1");

    await ask("Gateway XOR là gì?");
    await userEvent.click(await screen.findByRole("button", { name: "Nguồn 1: B.pdf, trang 4" }));
    await waitFor(() => expect(screen.getByTestId("pdf")).toHaveAttribute("data-page", "4"));
    expect(screen.getByTestId("pdf")).toHaveAttribute("data-hl", SRC.snippet);
  });

  it("chưa đồng ý: hiện hộp thoại, đồng ý rồi mới gửi câu hỏi", async () => {
    const api = backend(false);
    renderApp("/app/study/v1");
    await ask("Gateway XOR là gì?");
    const agree = await screen.findByRole("checkbox");
    expect(api.count("POST /conversations/v1/messages")).toBe(0);
    await userEvent.click(agree);
    await userEvent.click(screen.getByRole("button", { name: "Đồng ý và tiếp tục" }));
    await waitFor(() => expect(api.count("PUT /me/llm-consent")).toBe(1));
    await waitFor(() => expect(api.count("POST /conversations/v1/messages")).toBe(1));
  });

  it("lỗi mạng khi gửi: giữ lại nội dung đã gõ để gửi lại", async () => {
    backend(true, {
      "POST /conversations/v1/messages": () => err(503, "unavailable", "Máy chủ đang bận."),
    });
    renderApp("/app/study/v1");
    await ask("Câu hỏi quan trọng");
    expect(await screen.findByText(/Máy chủ đang bận/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Hỏi về nội dung slide/)).toHaveValue("Câu hỏi quan trọng");
  });

  it("AI từ chối (không trích nguồn nào): không hiện chip nguồn và không có nút lưu thẻ", async () => {
    backend(true, {}, { ...ANSWER, content: "Tài liệu không có thông tin này.", sources: [SRC] });
    renderApp("/app/study/v1");
    await ask("Diện tích hình tròn?");
    expect(await screen.findByText("Tài liệu không có thông tin này.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /B.pdf/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Lưu thành thẻ" })).not.toBeInTheDocument();
  });

  it("từ chối đồng ý: vẫn gửi câu hỏi (chế độ đoạn gốc) và không hỏi lại ở câu sau", async () => {
    const api = backend(false);
    renderApp("/app/study/v1");
    await ask("Câu một");
    await userEvent.click(await screen.findByRole("button", { name: "Không, chỉ xem đoạn gốc" }));
    await waitFor(() => expect(api.count("POST /conversations/v1/messages")).toBe(1));
    expect(api.calls.find((c) => c.path === "/me/llm-consent")?.body).toEqual({ granted: false });
    await ask("Câu hai");
    await waitFor(() => expect(api.count("POST /conversations/v1/messages")).toBe(2));
    expect(api.count("PUT /me/llm-consent")).toBe(1);
  });

  it("mất mạng giữa chừng: báo mất kết nối, giữ nháp, gửi lại được khi có mạng", async () => {
    let online = false;
    const api = backend(true, {
      "POST /conversations/v1/messages": ({ body }) => {
        if (!online) throw new TypeError("Failed to fetch");
        return { json: { ...ANSWER, content: `Đã nhận: ${body.question}` } };
      },
    });
    renderApp("/app/study/v1");
    await ask("Câu hỏi dài mà tôi không muốn gõ lại");
    expect(await screen.findByText(/Mất kết nối/)).toBeInTheDocument();
    const box = screen.getByPlaceholderText(/Hỏi về nội dung slide/);
    expect(box).toHaveValue("Câu hỏi dài mà tôi không muốn gõ lại");
    online = true;
    await userEvent.click(screen.getByRole("button", { name: "Gửi câu hỏi" }));
    await waitFor(() => expect(api.count("POST /conversations/v1/messages")).toBe(2));
    await waitFor(() => expect(box).toHaveValue(""));
  });

  it('câu nối tiếp được AI hiểu lại: hiện "Đã hiểu câu hỏi là…" dưới câu trả lời, câu thường thì không', async () => {
    backend(true, {}, { ...ANSWER, searchQuery: "Pool và lane dùng để làm gì trong BPMN?" });
    renderApp("/app/study/v1");
    await ask("Chúng dùng để làm gì?");
    expect(await screen.findByText("Pool và lane dùng để làm gì trong BPMN?")).toBeInTheDocument();
    expect(screen.getByText(/Đã hiểu câu hỏi là/)).toBeInTheDocument();
  });

  it('câu hỏi thường không có dòng "Đã hiểu câu hỏi là"', async () => {
    backend(true);
    renderApp("/app/study/v1");
    await ask("Gateway XOR là gì?");
    await screen.findByRole("button", { name: "Nguồn 1: B.pdf, trang 4" });
    expect(screen.queryByText(/Đã hiểu câu hỏi là/)).not.toBeInTheDocument();
  });

  it("đánh giá câu trả lời: 👍 gửi API, bấm lại để bỏ đánh giá", async () => {
    const api = backend(true, { "PUT /conversations/v1/messages/m2/feedback": ({ body }) => ({ json: { feedback: body.value } }) });
    renderApp("/app/study/v1");
    await ask("Gateway XOR là gì?");
    const up = await screen.findByRole("button", { name: /Hữu ích/ });
    await userEvent.click(up);
    await waitFor(() => expect(up).toHaveAttribute("aria-pressed", "true"));
    await userEvent.click(up);
    await waitFor(() => expect(up).toHaveAttribute("aria-pressed", "false"));
    const bodies = api.calls.filter((c) => c.path === "/conversations/v1/messages/m2/feedback").map((c) => c.body);
    expect(bodies).toEqual([{ value: 1 }, { value: null }]);
  });

  it("đánh giá lỗi: hiện thông báo và giữ trạng thái cũ", async () => {
    backend(true, { "PUT /conversations/v1/messages/m2/feedback": () => err(500, "internal", "x") });
    renderApp("/app/study/v1");
    await ask("Gateway XOR là gì?");
    const down = await screen.findByRole("button", { name: /Chưa tốt/ });
    await userEvent.click(down);
    await waitFor(() => expect(down).not.toBeDisabled());
    expect(down).toHaveAttribute("aria-pressed", "false");
  });

  it("hội thoại không tồn tại: báo rõ và có đường về", async () => {
    backend(true, {
      "GET /conversations/v1": () => err(404, "not_found", "x"),
    });
    renderApp("/app/study/v1");
    expect(await screen.findByText("Không tìm thấy hội thoại này.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Về tổng quan" })).toBeInTheDocument();
  });

  it("lưu câu trả lời thành thẻ: mặt trước là câu hỏi, mặt sau là câu trả lời, kèm tài liệu và trang nguồn", async () => {
    const api = backend(true, { "POST /flashcards": () => ({ status: 201, json: {} }) });
    renderApp("/app/study/v1");
    await ask("Gateway XOR là gì?");
    await userEvent.click(await screen.findByRole("button", { name: "Lưu thành thẻ" }));
    await waitFor(() => expect(api.count("POST /flashcards")).toBe(1));
    expect(api.calls.find((c) => c.path === "/flashcards")?.body).toEqual({ front: "Gateway XOR là gì?", back: ANSWER.content, page: 4, documentId: "d2" });
  });

  it("Ctrl+K nhảy vào ô câu hỏi; Shift+Enter xuống dòng, Enter gửi", async () => {
    const api = backend(true);
    renderApp("/app/study/v1");
    const box = await screen.findByPlaceholderText(/Hỏi về nội dung slide/);
    expect(box).not.toHaveFocus();
    await userEvent.keyboard("{Control>}k{/Control}");
    expect(box).toHaveFocus();
    await userEvent.type(box, "dòng 1{Shift>}{Enter}{/Shift}dòng 2");
    expect(box).toHaveValue("dòng 1\ndòng 2");
    expect(api.count("POST /conversations/v1/messages")).toBe(0);
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(api.count("POST /conversations/v1/messages")).toBe(1));
  });

  it("Chép trích dẫn: đưa tên tài liệu và trang vào bộ nhớ tạm", async () => {
    backend(true);
    renderApp("/app/study/v1");
    await ask("Gateway XOR là gì?");
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    await userEvent.click(await screen.findByRole("button", { name: "Chép trích dẫn" }));
    expect(writeText).toHaveBeenCalledWith("[1] B.pdf, trang 4");
    expect(await screen.findByText("Đã chép trích dẫn.")).toBeInTheDocument();
  });
});
