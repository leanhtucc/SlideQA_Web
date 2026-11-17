import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Stats as StatsData } from "src/apis/stats.api";
import { session } from "src/helpers/session";
import { err, mockApi, tokens, USER, type Handler } from "src/test/mockApi";
import { renderApp } from "src/test/renderApp";

const DATA: StatsData = {
  documents: 3,
  questions: 12,
  quizzes: 4,
  attempts: 5,
  averageScorePct: 72,
  flashcards: { total: 9, due: 2 },
  courses: [
    { id: "c1", name: "Quy trình", documents: 2, quizzes: 3, attempts: 4, averageScorePct: 80 },
    { id: "c2", name: "Cơ sở dữ liệu", documents: 1, quizzes: 1, attempts: 0, averageScorePct: null },
  ],
  weakTopics: [{ documentId: "d1", documentName: "Slide BPMN.pdf", page: 7, wrong: 3 }],
};

function backend(stats: Handler) {
  session.setRefresh("ref-1");
  mockApi({ "POST /auth/refresh": () => ({ json: tokens(2) }), "GET /me": () => ({ json: USER }), "GET /stats": stats });
}

describe("thống kê", () => {
  it("hiện số liệu tổng quan, điểm theo môn và chỗ hay sai", async () => {
    backend(() => ({ json: DATA }));
    renderApp("/app/stats");
    expect(await screen.findByText("Điểm trung bình")).toBeInTheDocument();
    expect(screen.getByText("72%")).toBeInTheDocument();
    expect(screen.getByText("2/9")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Quy trình" })).toBeInTheDocument();
    expect(screen.getByLabelText("Điểm trung bình môn Quy trình")).toHaveTextContent("80%");
    expect(screen.getByLabelText("Điểm trung bình môn Cơ sở dữ liệu")).toHaveTextContent("Chưa có");
    expect(screen.getByText("Slide BPMN.pdf, trang 7")).toBeInTheDocument();
    expect(screen.getByText("Sai 3 lần")).toBeInTheDocument();
  });

  it("người dùng mới: trạng thái trống rõ ràng, không có điểm", async () => {
    backend(() => ({ json: { ...DATA, documents: 0, questions: 0, quizzes: 0, attempts: 0, averageScorePct: null, flashcards: { total: 0, due: 0 }, courses: [], weakTopics: [] } }));
    renderApp("/app/stats");
    expect(await screen.findByText("Chưa có môn học nào")).toBeInTheDocument();
    expect(screen.getByText(/Chưa có câu nào sai/)).toBeInTheDocument();
    expect(screen.getByText("Chưa có")).toBeInTheDocument();
  });

  it("lỗi máy chủ: báo lỗi và cho thử lại", async () => {
    backend(() => err(500, "internal", "x"));
    renderApp("/app/stats");
    expect(await screen.findByText("Không tải được thống kê.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Thử lại/ })).toBeInTheDocument();
  });
});
