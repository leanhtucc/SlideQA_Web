import { ApiError } from "src/apis/client";
import type { IconName } from "src/components/Icon/Icon";

export interface ErrorInfo {
  kind: "offline" | "notfound" | "forbidden" | "busy" | "server" | "generic";
  icon: IconName;
  title: string;
  message: string;
}

/**
 * Chuyển một lỗi bất kỳ thành nội dung hiển thị thống nhất: tiêu đề ngắn + câu giải thích + icon.
 * `fallback` là câu mô tả theo ngữ cảnh ("Không tải được danh sách môn học."), dùng khi lỗi không có thông điệp riêng.
 */
export function describeError(error: unknown, fallback = "Có lỗi xảy ra, hãy thử lại."): ErrorInfo {
  if (error instanceof ApiError) {
    if (error.status === 0) return { kind: "offline", icon: "wifiOff", title: "Mất kết nối", message: "Không kết nối được tới máy chủ. Hãy kiểm tra mạng rồi thử lại." };
    if (error.status === 404) return { kind: "notfound", icon: "compass", title: "Không tìm thấy", message: fallback };
    if (error.status === 401 || error.status === 403) return { kind: "forbidden", icon: "lock", title: "Không có quyền truy cập", message: error.message || fallback };
    if (error.status === 429) return { kind: "busy", icon: "alert", title: "Bạn thao tác hơi nhanh", message: error.message || "Hãy đợi một lát rồi thử lại." };
    if (error.status >= 500) return { kind: "server", icon: "server", title: "Máy chủ đang gặp sự cố", message: "Chúng tôi chưa xử lý được yêu cầu này. Hãy thử lại sau ít phút." };
    return { kind: "generic", icon: "alert", title: "Có lỗi xảy ra", message: error.message || fallback };
  }
  return { kind: "generic", icon: "alert", title: "Có lỗi xảy ra", message: fallback };
}

/** Thông điệp ngắn cho toast / Alert từ một lỗi: mất mạng và lỗi máy chủ có câu chuẩn, còn lại dùng thông điệp của máy chủ hoặc `fallback`. */
export const errorMessage = (error: unknown, fallback: string) => {
  if (!(error instanceof ApiError)) return fallback;
  const info = describeError(error, fallback);
  return info.kind === "offline" || info.kind === "server" ? info.message : error.message || fallback;
};
