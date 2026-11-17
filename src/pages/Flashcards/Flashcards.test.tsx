import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { session } from "src/helpers/session";
import { err, mockApi, tokens, USER, type Handler } from "src/test/mockApi";
import { renderApp } from "src/test/renderApp";

const card = (n: number, over: Partial<Flashcard> = {}): Flashcard => ({
  id: `f${n}`,
  documentId: "d1",
  front: `Câu ${n}?`,
  back: `Đáp án ${n}`,
  page: n,
  intervalDays: 1,
  dueAt: "2020-01-01T00:00:00Z",
  createdAt: "2020-01-01T00:00:00Z",
  ...over,
});

function backend(cards: Flashcard[], extra: Record<string, Handler> = {}) {
  session.setRefresh("ref-1");
  return mockApi({
    "POST /auth/refresh": () => ({ json: tokens(2) }),
    "GET /me": () => ({ json: USER }),
    "GET /flashcards": () => ({ json: cards }),
    ...extra,
  });
}

describe("thẻ ghi nhớ", () => {
  it("đếm thẻ đến hạn; thẻ chưa đến hạn không tính", async () => {
    backend([card(1), card(2), card(3, { dueAt: "2999-01-01T00:00:00Z", intervalDays: 7 })]);
    renderApp("/app/flashcards");
    expect(await screen.findByText("Cần ôn hôm nay")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText(/khoảng cách 7 ngày/)).toBeInTheDocument();
  });

  it("ôn thẻ: xem đáp án rồi chọn Nhớ/Quên, gửi đúng kết quả, hết thẻ thì báo xong", async () => {
    const api = backend([card(1), card(2)], {
      "POST /flashcards/f1/review": () => ({ json: card(1, { intervalDays: 3 }) }),
      "POST /flashcards/f2/review": () => ({ json: card(2) }),
    });
    renderApp("/app/flashcards");
    await userEvent.click(await screen.findByRole("button", { name: "Bắt đầu ôn" }));
    expect(screen.getByRole("heading", { name: "Câu 1?" })).toBeInTheDocument();
    expect(screen.queryByText("Đáp án 1")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Xem đáp án" }));
    expect(screen.getByText("Đáp án 1")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Nhớ" }));

    expect(await screen.findByRole("heading", { name: "Câu 2?" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Xem đáp án" }));
    await userEvent.click(screen.getByRole("button", { name: "Quên" }));

    expect(await screen.findByText("Xong rồi!")).toBeInTheDocument();
    expect(api.calls.filter((c) => c.path.endsWith("/review")).map((c) => [c.path, c.body])).toEqual([
      ["/flashcards/f1/review", { result: "remember" }],
      ["/flashcards/f2/review", { result: "forgot" }],
    ]);
  });

  it("lỗi khi lưu kết quả: báo lỗi và ở lại thẻ hiện tại", async () => {
    backend([card(1)], { "POST /flashcards/f1/review": () => err(503, "unavailable", "Máy chủ đang bận.") });
    renderApp("/app/flashcards");
    await userEvent.click(await screen.findByRole("button", { name: "Bắt đầu ôn" }));
    await userEvent.click(screen.getByRole("button", { name: "Xem đáp án" }));
    await userEvent.click(screen.getByRole("button", { name: "Nhớ" }));
    expect(await screen.findByText("Máy chủ đang bận.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Câu 1?" })).toBeInTheDocument();
  });

  it("không có thẻ: hiện trạng thái trống; thêm thẻ thủ công gửi đúng nội dung", async () => {
    const api = backend([], { "POST /flashcards": () => ({ status: 201, json: card(9) }) });
    renderApp("/app/flashcards");
    expect(await screen.findByText("Chưa có thẻ nào")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Thêm thẻ" }));
    await userEvent.type(await screen.findByLabelText(/Mặt trước/), "XOR là gì?");
    await userEvent.type(screen.getByLabelText(/Mặt sau/), "Chọn một luồng");
    await userEvent.click(screen.getAllByRole("button", { name: "Thêm thẻ" }).at(-1)!);
    await waitFor(() => expect(api.count("POST /flashcards")).toBe(1));
    expect(api.calls.find((c) => c.method === "POST" && c.path === "/flashcards")?.body).toEqual({ front: "XOR là gì?", back: "Chọn một luồng" });
  });

  it("xóa thẻ gọi API", async () => {
    const api = backend([card(1)], { "DELETE /flashcards/f1": () => ({ status: 204 }) });
    renderApp("/app/flashcards");
    await userEvent.click(await screen.findByRole("button", { name: "Xóa thẻ: Câu 1?" }));
    await waitFor(() => expect(api.count("DELETE /flashcards/f1")).toBe(1));
  });
});
