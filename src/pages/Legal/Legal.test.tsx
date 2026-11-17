import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LEGAL } from "src/pages/Legal/Legal";
import { renderApp } from "src/test/renderApp";

describe("văn bản pháp lý", () => {
  it("Chính sách bảo vệ dữ liệu: công khai (chưa đăng nhập), nêu bên nhận dữ liệu, thời hạn quyền, và chỗ chủ dự án phải điền", async () => {
    renderApp("/privacy");
    expect(await screen.findByRole("heading", { name: "Chính sách bảo vệ dữ liệu cá nhân" })).toBeInTheDocument();
    expect(screen.getAllByText(/Gemini API/).length).toBeGreaterThan(0);
    expect(screen.getByText(/chỉ khi bạn đã đồng ý/)).toBeInTheDocument();
    expect(screen.getByText(/trong 2 ngày làm việc/)).toBeInTheDocument();
    expect(screen.getAllByText(LEGAL.email).length).toBeGreaterThan(0); // email liên hệ (hoặc chỗ [ĐIỀN: …] nếu chưa cấu hình) luôn hiện, không được giấu
  });

  it("Điều khoản sử dụng: công khai, nói rõ AI có thể sai và quyền với tài liệu tải lên", async () => {
    renderApp("/terms");
    expect(await screen.findByRole("heading", { name: "Điều khoản sử dụng" })).toBeInTheDocument();
    expect(screen.getByText(/có thể sai hoặc thiếu/)).toBeInTheDocument();
    expect(screen.getByText(/có quyền sử dụng/)).toBeInTheDocument();
  });
});
