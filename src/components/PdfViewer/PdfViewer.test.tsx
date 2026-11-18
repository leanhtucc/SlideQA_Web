import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import PdfViewer from "./PdfViewer";

// pdf.js không chạy được trong jsdom: giả một tài liệu 20 trang, việc vẽ trang bị "hủy" nên không ảnh hưởng.
vi.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: {},
  TextLayer: class {},
  getDocument: () => ({
    promise: Promise.resolve({ numPages: 20, loadingTask: { destroyed: false }, getPage: () => Promise.reject(Object.assign(new Error("x"), { name: "RenderingCancelledException" })) }),
    destroy: () => Promise.resolve(),
  }),
}));
vi.mock("pdfjs-dist/build/pdf.worker.min.mjs?url", () => ({ default: "worker.js" }));
vi.mock("pdfjs-dist/web/pdf_viewer.css", () => ({}));

function Harness() {
  const [page, setPage] = useState(1);
  return <PdfViewer data={new ArrayBuffer(8)} loading={false} error={null} onRetry={() => {}} page={page} onPageChange={setPage} highlight={undefined} nonce={0} />;
}

describe("PdfViewer: nhảy tới trang", () => {
  it("gõ số trang rồi Enter thì nhảy thẳng tới đó; số quá lớn thì kẹp ở trang cuối; nhập rỗng thì giữ trang cũ", async () => {
    render(<Harness />);
    const box = await screen.findByRole("textbox", { name: "Đi tới trang" });
    await screen.findByText(/\/ 20/);

    await userEvent.clear(box);
    await userEvent.type(box, "14{Enter}");
    expect(box).toHaveValue("14");

    await userEvent.clear(box);
    await userEvent.type(box, "999{Enter}");
    expect(box).toHaveValue("20");

    await userEvent.clear(box);
    await userEvent.tab();
    expect(box).toHaveValue("20");

    await userEvent.click(screen.getByRole("button", { name: "Trang trước" }));
    expect(box).toHaveValue("19");
  });
});
