import { afterEach, describe, expect, it, vi } from "vitest";
import { applyTheme, getThemeMode, setThemeMode } from "./theme";

const root = document.documentElement;
afterEach(() => {
  localStorage.clear();
  root.classList.remove("dark");
  vi.unstubAllGlobals();
});

describe("giao diện sáng/tối", () => {
  it("mặc định theo hệ thống; chọn tối hoặc sáng thì lưu và áp ngay", () => {
    expect(getThemeMode()).toBe("system");
    setThemeMode("dark");
    expect(getThemeMode()).toBe("dark");
    expect(root.classList.contains("dark")).toBe(true);
    setThemeMode("light");
    expect(root.classList.contains("dark")).toBe(false);
    setThemeMode("system");
    expect(localStorage.getItem("slideqa-theme")).toBeNull();
  });

  it("theo hệ thống: hệ thống đang tối thì bật lớp dark", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener: () => {} }));
    applyTheme("system");
    expect(root.classList.contains("dark")).toBe(true);
  });

  it("không lưu được (bị chặn lưu trữ) thì vẫn áp cho phiên này, không báo lỗi", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => setThemeMode("dark")).not.toThrow();
    expect(root.classList.contains("dark")).toBe(true);
    vi.restoreAllMocks();
  });
});
