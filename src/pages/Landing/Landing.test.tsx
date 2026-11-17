import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { session } from "src/helpers/session";
import { mockApi, tokens, USER } from "src/test/mockApi";
import { renderApp } from "src/test/renderApp";

describe("trang giới thiệu", () => {
  it("khách vào / thấy trang giới thiệu có nút đăng ký, đăng nhập và link chính sách", async () => {
    mockApi({});
    renderApp("/");
    expect(await screen.findByRole("heading", { level: 1, name: /Hỏi slide của bạn/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Bắt đầu miễn phí" })).toHaveAttribute("href", "/register");
    expect(screen.getByRole("link", { name: "Đăng nhập" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "Điều khoản sử dụng" })).toHaveAttribute("href", "/terms");
  });

  it("đã đăng nhập thì / chuyển thẳng vào ứng dụng", async () => {
    session.setRefresh("ref-1");
    mockApi({ "POST /auth/refresh": () => ({ json: tokens(2) }), "GET /me": () => ({ json: USER }), "GET /courses": () => ({ json: [] }), "GET /documents": () => ({ json: [] }), "GET /quizzes": () => ({ json: [] }) });
    renderApp("/");
    expect(await screen.findByText(/hôm nay ôn gì/)).toBeInTheDocument();
  });
});
