import { describe, expect, it } from "vitest";
import { daysUntil, formatDayMonth } from "./date";

describe("date", () => {
  const now = new Date(2026, 10, 16, 23, 59); // 16/11/2026 gần nửa đêm
  it("daysUntil tính theo ngày lịch, không theo giờ", () => {
    expect(daysUntil("2026-11-16", now)).toBe(0);
    expect(daysUntil("2026-11-17", now)).toBe(1);
    expect(daysUntil("2027-01-12", now)).toBe(57);
    expect(daysUntil("2026-11-15", now)).toBe(-1);
  });
  it("đúng khi băng qua ngày chuyển giờ mùa hè", () => {
    expect(daysUntil("2026-04-02", new Date(2026, 2, 29, 12))).toBe(4);
  });
  it("formatDayMonth", () => {
    expect(formatDayMonth("2027-01-12")).toBe("12/01");
  });
});
