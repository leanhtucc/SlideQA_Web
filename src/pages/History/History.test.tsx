import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { session } from "src/helpers/session";
import { mockApi, tokens, USER } from "src/test/mockApi";
import { renderApp } from "src/test/renderApp";

const C = (id: string, title: string): Conversation => ({ id, title, courseId: "c1", scopeDocumentIds: [], createdAt: "2026-11-01T00:00:00Z", updatedAt: "2026-11-02T00:00:00Z" });

function backend(initial: Conversation[]) {
  session.setRefresh("ref-1");
  let list = [...initial];
  const searches: string[] = [];
  const api = mockApi({
    "POST /auth/refresh": () => ({ json: tokens(2) }),
    "GET /me": () => ({ json: USER }),
    "GET /conversations": () => ({ json: list }),
    "GET /conversations?q=XOR": () => {
      searches.push("XOR");
      return { json: list.filter((c) => c.title.includes("XOR")) };
    },
    "PATCH /conversations/a": ({ body }) => {
      list = list.map((c) => (c.id === "a" ? { ...c, title: body.title } : c));
      return { json: list[0] };
    },
    "DELETE /conversations/b": () => {
      list = list.filter((c) => c.id !== "b");
      return { status: 204 };
    },
  });
  return { api, searches };
}

describe("lịch sử hội thoại", () => {
  it("liệt kê, tìm theo từ khóa, đổi tên và xóa có xác nhận", async () => {
    const { searches } = backend([C("a", "Ôn Gateway"), C("b", "Hỏi XOR")]);
    renderApp("/app/history");
    expect(await screen.findByRole("link", { name: "Ôn Gateway" })).toHaveAttribute("href", "/app/study/a");

    await userEvent.type(screen.getByLabelText("Tìm hội thoại"), "XOR");
    await waitFor(() => expect(screen.queryByRole("link", { name: "Ôn Gateway" })).not.toBeInTheDocument());
    expect(searches).toEqual(["XOR"]);
    await userEvent.clear(screen.getByLabelText("Tìm hội thoại"));
    expect(await screen.findByRole("link", { name: "Ôn Gateway" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Đổi tên Ôn Gateway" }));
    const input = await screen.findByLabelText("Tên hội thoại");
    await userEvent.clear(input);
    await userEvent.type(input, "Gateway tuần 3");
    await userEvent.click(screen.getByRole("button", { name: "Lưu" }));
    expect(await screen.findByRole("link", { name: "Gateway tuần 3" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Xóa Hỏi XOR" }));
    const dlg = await screen.findByRole("alertdialog");
    expect(within(dlg).getByText(/không hoàn tác được/)).toBeInTheDocument();
    await userEvent.click(within(dlg).getByRole("button", { name: "Xóa hội thoại" }));
    await waitFor(() => expect(screen.queryByRole("link", { name: "Hỏi XOR" })).not.toBeInTheDocument());
  });

  it("chưa có hội thoại: hướng dẫn bắt đầu", async () => {
    backend([]);
    renderApp("/app/history");
    expect(await screen.findByText(/Chưa có hội thoại nào/)).toBeInTheDocument();
  });

  it("tên rỗng bị chặn ở form đổi tên", async () => {
    backend([C("a", "Ôn Gateway")]);
    renderApp("/app/history");
    await userEvent.click(await screen.findByRole("button", { name: "Đổi tên Ôn Gateway" }));
    await userEvent.clear(await screen.findByLabelText("Tên hội thoại"));
    await userEvent.click(screen.getByRole("button", { name: "Lưu" }));
    expect(await screen.findByText("Tên hội thoại không được để trống.")).toBeInTheDocument();
  });
});
