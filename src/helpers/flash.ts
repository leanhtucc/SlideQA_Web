/**
 * Thông báo một lần cho trang kế tiếp (ví dụ "Đã đổi mật khẩu" trên trang đăng nhập).
 * Không dùng router state vì khi đăng xuất, guard tự chuyển hướng và ghi đè state đó.
 */
let message: string | null = null;

export const flash = {
  set(m: string) {
    message = m;
  },
  take(): string | null {
    const m = message;
    message = null;
    return m;
  },
};
