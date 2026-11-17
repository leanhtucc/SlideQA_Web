import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "src/apis/client";
import Button from "src/components/Button/Button";
import ErrorBoundary from "src/components/ErrorBoundary/ErrorBoundary";
import OfflineBanner from "src/components/OfflineBanner/OfflineBanner";
import { EmptyState, ErrorState } from "src/components/State/State";
import Toaster from "src/components/Toaster/Toaster";
import { describeError, errorMessage } from "src/helpers/errors";
import { toast } from "src/helpers/toast";

describe("Button", () => {
  it("đang xử lý: khóa nút, hiện nhãn đang xử lý, báo aria-busy và không bấm được", async () => {
    const onClick = vi.fn();
    const { rerender } = render(
      <Button onClick={onClick} loading={false} loadingText="Đang lưu…">
        Lưu
      </Button>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Lưu" }));
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(
      <Button onClick={onClick} loading loadingText="Đang lưu…">
        Lưu
      </Button>,
    );
    const busy = screen.getByRole("button", { name: "Đang lưu…" });
    expect(busy).toBeDisabled();
    expect(busy).toHaveAttribute("aria-busy", "true");
    await userEvent.click(busy);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("loading mà không có loadingText thì giữ nguyên nhãn (nút không đổi kích thước)", () => {
    render(<Button loading>Gửi</Button>);
    expect(screen.getByRole("button", { name: "Gửi" })).toBeDisabled();
  });
});

describe("toast", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("thành công dùng role=status, lỗi dùng role=alert; tự đóng sau thời gian của từng loại", () => {
    render(<Toaster />);
    act(() => {
      toast.success("Đã lưu.");
      toast.error("Lưu thất bại.");
    });
    expect(screen.getByRole("status")).toHaveTextContent("Đã lưu.");
    expect(screen.getByRole("alert")).toHaveTextContent("Lưu thất bại.");
    act(() => void vi.advanceTimersByTime(4100));
    expect(screen.queryByText("Đã lưu.")).not.toBeInTheDocument();
    expect(screen.getByText("Lưu thất bại.")).toBeInTheDocument(); // lỗi ở lại lâu hơn
    act(() => void vi.advanceTimersByTime(4000));
    expect(screen.queryByText("Lưu thất bại.")).not.toBeInTheDocument();
  });

  it("rê chuột vào thì tạm dừng đếm giờ, rời ra thì đếm tiếp", () => {
    render(<Toaster />);
    act(() => toast.info("Đọc kỹ nhé"));
    const el = screen.getByText("Đọc kỹ nhé").closest(".toast")!;
    fireEvent.mouseEnter(el);
    act(() => void vi.advanceTimersByTime(20_000));
    expect(screen.getByText("Đọc kỹ nhé")).toBeInTheDocument();
    fireEvent.mouseLeave(el);
    act(() => void vi.advanceTimersByTime(5100));
    expect(screen.queryByText("Đọc kỹ nhé")).not.toBeInTheDocument();
  });

  it("nút đóng, nút hành động, không chồng toast trùng và chỉ giữ tối đa 3 toast", () => {
    render(<Toaster />);
    const undo = vi.fn();
    act(() => {
      toast.success("Đã xóa.", { action: { label: "Hoàn tác", onClick: undo } });
      toast.success("Đã xóa.");
    });
    expect(screen.getAllByText("Đã xóa.")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Hoàn tác" }));
    expect(undo).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Đã xóa.")).not.toBeInTheDocument();

    act(() => ["a", "b", "c", "d"].forEach((m) => toast.info(m)));
    expect(screen.queryByText("a")).not.toBeInTheDocument();
    expect(screen.getAllByRole("status")).toHaveLength(3);
    fireEvent.click(screen.getAllByRole("button", { name: "Đóng thông báo" })[0]!);
    expect(screen.getAllByRole("status")).toHaveLength(2);
  });
});

describe("describeError / ErrorState / EmptyState", () => {
  it("phân loại lỗi: mất mạng, không tìm thấy, quyền, quá nhanh, máy chủ, chung", () => {
    expect(describeError(new ApiError(0, "network", "x")).kind).toBe("offline");
    expect(describeError(new ApiError(404, "not_found", "x")).kind).toBe("notfound");
    expect(describeError(new ApiError(403, "forbidden", "Không được.")).message).toBe("Không được.");
    expect(describeError(new ApiError(429, "rate", "Hãy đợi 30 giây.")).kind).toBe("busy");
    expect(describeError(new ApiError(503, "x", "x")).kind).toBe("server");
    expect(describeError(new Error("boom"), "Ngữ cảnh.")).toMatchObject({ kind: "generic", message: "Ngữ cảnh." });
  });

  it("errorMessage: câu chuẩn cho mất mạng/máy chủ, còn lại dùng thông điệp của máy chủ hoặc dự phòng", () => {
    expect(errorMessage(new ApiError(0, "network", "x"), "dự phòng")).toMatch(/kiểm tra mạng/);
    expect(errorMessage(new ApiError(500, "x", "chi tiết kỹ thuật"), "dự phòng")).not.toMatch(/chi tiết kỹ thuật/);
    expect(errorMessage(new ApiError(409, "x", "Email đã dùng."), "dự phòng")).toBe("Email đã dùng.");
    expect(errorMessage(new Error("boom"), "dự phòng")).toBe("dự phòng");
  });

  it("ErrorState mất mạng: tiêu đề, câu ngữ cảnh, lời khuyên và nút Thử lại gọi lại", async () => {
    const retry = vi.fn();
    render(<ErrorState error={new ApiError(0, "network", "x")} message="Không tải được danh sách môn học." onRetry={retry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Mất kết nối");
    expect(screen.getByText("Không tải được danh sách môn học.")).toBeInTheDocument();
    expect(screen.getByText(/Hãy kiểm tra mạng/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("ErrorState đang thử lại: nút khóa lại", () => {
    render(<ErrorState error={new ApiError(500, "x", "x")} message="Không tải được." onRetry={() => undefined} retrying />);
    expect(screen.getByRole("button", { name: /Thử lại/ })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("Máy chủ đang gặp sự cố");
  });

  it("EmptyState: tiêu đề, hướng dẫn và nút hành động", () => {
    render(<EmptyState art="quiz" title="Chưa có quiz nào" message="Bấm Tạo quiz mới." action={<button>Tạo quiz mới</button>} />);
    expect(screen.getByRole("heading", { name: "Chưa có quiz nào" })).toBeInTheDocument();
    expect(screen.getByText("Bấm Tạo quiz mới.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tạo quiz mới" })).toBeInTheDocument();
  });
});

describe("OfflineBanner", () => {
  it("hiện dải cảnh báo khi mất mạng; có mạng lại thì ẩn và báo bằng toast", () => {
    render(
      <>
        <OfflineBanner />
        <Toaster />
      </>,
    );
    expect(screen.queryByText(/đang offline/)).not.toBeInTheDocument();
    act(() => void window.dispatchEvent(new Event("offline")));
    expect(screen.getByRole("status")).toHaveTextContent(/đang offline/);
    act(() => void window.dispatchEvent(new Event("online")));
    expect(screen.queryByText(/đang offline/)).not.toBeInTheDocument();
    expect(screen.getByText("Đã kết nối lại.")).toBeInTheDocument();
  });
});

describe("ErrorBoundary", () => {
  it("lỗi khi vẽ giao diện: hiện màn xin lỗi có nút tải lại thay vì trang trắng", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const Bomb = () => {
      throw new Error("boom");
    };
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Ứng dụng gặp lỗi bất ngờ");
    expect(screen.getByRole("button", { name: /Tải lại trang/ })).toBeInTheDocument();
    spy.mockRestore();
  });
});
