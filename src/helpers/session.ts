const REFRESH_KEY = "slideqa.refresh";

// Access token chỉ giữ trong bộ nhớ (mất khi tải lại trang, sống 15 phút).
// Refresh token lưu localStorage để F5 vẫn giữ phiên.
// shortcut: localStorage có thể bị script XSS đọc; nếu muốn chặt hơn thì chuyển refresh token sang cookie httpOnly (cần sửa backend).
let access: string | null = null;

const safe = <T,>(f: () => T, fallback: T): T => {
  try {
    return f();
  } catch {
    return fallback; // trình duyệt chặn lưu trữ (chế độ riêng tư...)
  }
};

export const session = {
  getAccess: () => access,
  setAccess: (t: string | null) => {
    access = t;
  },
  getRefresh: (): string | null => safe(() => localStorage.getItem(REFRESH_KEY), null),
  setRefresh: (t: string) => safe(() => localStorage.setItem(REFRESH_KEY, t), undefined),
  clear: () => {
    access = null;
    safe(() => localStorage.removeItem(REFRESH_KEY), undefined);
  },
};
