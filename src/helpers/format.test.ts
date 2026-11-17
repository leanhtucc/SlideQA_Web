import { describe, expect, it } from "vitest";
import { formatBytes, formatDayMonthFromIso } from "./format";

describe("format", () => {
  it("formatBytes", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1023)).toBe("1023 B");
    expect(formatBytes(1536)).toBe("1,5 KB");
    expect(formatBytes(1024 * 1024)).toBe("1 MB");
    expect(formatBytes(3355443)).toBe("3,2 MB");
    expect(formatBytes(50 * 1024 * 1024)).toBe("50 MB");
  });
  it("formatDayMonthFromIso theo giờ địa phương", () => {
    expect(formatDayMonthFromIso(new Date(2026, 10, 2, 9, 30).toISOString())).toBe("02/11");
  });
});
