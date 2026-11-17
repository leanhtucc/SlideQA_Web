/** Bỏ dấu, chữ thường, gộp khoảng trắng: để so khớp chữ trên PDF với đoạn trích dù khác dấu hay xuống dòng. */
export function fold(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Với mỗi đoạn chữ (span) trong lớp chữ của trang PDF, cho biết có nằm trong đoạn trích nguồn hay không.
 * shortcut: so khớp theo chuỗi con, không theo vị trí; chữ ngắn dưới 3 ký tự bị bỏ qua để tránh tô nhầm; nâng cấp nếu cần tô chính xác từng dòng.
 */
export function matchSpans(spanTexts: string[], snippet: string): boolean[] {
  const target = fold(snippet);
  return spanTexts.map((t) => {
    const f = fold(t);
    return f.length >= 3 && target.includes(f);
  });
}
