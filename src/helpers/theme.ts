/** Giao diện sáng, tối hoặc theo hệ thống (FR-SET-02). Lựa chọn lưu trong trình duyệt này; token tối nằm ở lớp `.dark` trên <html>. */
export type ThemeMode = "light" | "dark" | "system";

const KEY = "slideqa-theme";
const query = () => (typeof window.matchMedia === "function" ? window.matchMedia("(prefers-color-scheme: dark)") : null);

export function getThemeMode(): ThemeMode {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system"; // chế độ riêng tư hoặc bị chặn lưu trữ
  }
}

export function applyTheme(mode: ThemeMode = getThemeMode()) {
  const dark = mode === "dark" || (mode === "system" && !!query()?.matches);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

export function setThemeMode(mode: ThemeMode) {
  try {
    if (mode === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, mode);
  } catch {
    /* không lưu được thì vẫn áp dụng cho phiên này */
  }
  applyTheme(mode);
}

/** Gọi một lần khi khởi động: áp giao diện đã chọn và theo dõi đổi giao diện của hệ điều hành khi đang ở chế độ "theo hệ thống". */
export function initTheme() {
  applyTheme();
  query()?.addEventListener("change", () => {
    if (getThemeMode() === "system") applyTheme("system");
  });
}
