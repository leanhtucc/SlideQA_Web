/** Kết quả đăng ký/đăng nhập của backend (SRS mục 10). */
interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/** Thân lỗi chuẩn của backend. */
interface ApiErrorBody {
  error?: { code?: string; message?: string; fields?: Record<string, string> };
}
