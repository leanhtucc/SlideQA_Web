// Quy tắc khớp với backend (auth.schema.ts) để báo lỗi sớm; backend vẫn là nơi quyết định.
export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

/** bcrypt chỉ dùng 72 byte đầu nên backend từ chối mật khẩu dài hơn. */
export const passwordTooLong = (s: string) => new TextEncoder().encode(s).length > 72;

export interface Strength {
  /** 0 = chưa đủ độ dài, 1 = yếu, 2 = trung bình, 3 = mạnh */
  level: 0 | 1 | 2 | 3;
  label: string;
}

export function passwordStrength(pw: string): Strength {
  if (pw.length < 8) return { level: 0, label: "chưa đủ 8 ký tự" };
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length;
  if (pw.length >= 12 && kinds >= 3) return { level: 3, label: "mạnh" };
  if (pw.length >= 10 || kinds >= 3) return { level: 2, label: "trung bình" };
  return { level: 1, label: "yếu" };
}
