import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { session } from "src/helpers/session";
import { err, mockApi, tokens, USER, type Handler } from "src/test/mockApi";
import { renderApp } from "src/test/renderApp";

function backend(consented: boolean, extra: Record<string, Handler> = {}) {
  session.setRefresh("ref-1");
  return mockApi({
    "POST /auth/refresh": () => ({ json: tokens(2) }),
    "GET /me": () => ({ json: { ...USER, llmConsentAt: consented ? "2026-11-01T00:00:00Z" : null } }),
    "PUT /me/llm-consent": ({ body }) => ({ json: { llmConsentAt: body.granted ? "2026-11-02T00:00:00Z" : null } }),
    ...extra,
  });
}

describe("cài đặt đồng ý gửi dữ liệu cho AI", () => {
  it("rút lại đồng ý: gọi API với granted=false và đổi trạng thái", async () => {
    const api = backend(true);
    renderApp("/app/settings");
    expect(await screen.findByText("Đã đồng ý")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Rút lại đồng ý" }));
    expect(await screen.findByText("Chưa đồng ý")).toBeInTheDocument();
    expect(api.calls.find((c) => c.path === "/me/llm-consent")?.body).toEqual({ granted: false });
  });

  it("cấp đồng ý: phải tick xác nhận trong hộp thoại rồi mới lưu", async () => {
    const api = backend(false);
    renderApp("/app/settings");
    await userEvent.click(await screen.findByRole("button", { name: "Đồng ý gửi dữ liệu" }));
    const confirm = await screen.findByRole("button", { name: "Đồng ý và tiếp tục" });
    expect(confirm).toBeDisabled();
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(confirm);
    expect(await screen.findByText("Đã đồng ý")).toBeInTheDocument();
    expect(api.calls.find((c) => c.path === "/me/llm-consent")?.body).toEqual({ granted: true });
  });

  it("lưu lỗi: báo rõ và giữ nguyên trạng thái cũ", async () => {
    backend(true, { "PUT /me/llm-consent": () => err(500, "server_error", "Máy chủ đang bận.") });
    renderApp("/app/settings");
    await userEvent.click(await screen.findByRole("button", { name: "Rút lại đồng ý" }));
    expect(await screen.findByText("Máy chủ đang bận.")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Đã đồng ý")).toBeInTheDocument());
  });
});
