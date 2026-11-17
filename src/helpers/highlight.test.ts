import { describe, expect, it } from "vitest";
import { fold, matchSpans } from "./highlight";

describe("highlight", () => {
  it("fold bỏ dấu tiếng Việt, kể cả đ, và gộp khoảng trắng", () => {
    expect(fold("  Đường   đi\nđiều kiện ")).toBe("duong di dieu kien");
  });

  it("matchSpans chỉ đánh dấu các đoạn chữ nằm trong đoạn trích", () => {
    const snippet = "Gateway độc quyền (XOR) chọn đúng một luồng đi dựa trên điều kiện.";
    const spans = ["Gateway độc quyền", "(XOR) chọn", "Gateway song song (AND)", "luồng đi dựa trên", "BPMN – Tuần 3"];
    expect(matchSpans(spans, snippet)).toEqual([true, true, false, true, false]);
  });

  it("khớp không phân biệt dấu và xuống dòng", () => {
    expect(matchSpans(["chon dung mot luong"], "chọn đúng\nmột luồng đi")).toEqual([true]);
  });

  it("bỏ qua chữ quá ngắn và chuỗi rỗng", () => {
    expect(matchSpans(["và", "", "  ", "ab"], "và ab và")).toEqual([false, false, false, false]);
  });
});
