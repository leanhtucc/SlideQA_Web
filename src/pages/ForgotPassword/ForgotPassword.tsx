import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "src/apis/account.api";
import { ApiError } from "src/apis/client";
import Alert from "src/components/Alert/Alert";
import Field from "src/components/Field/Field";
import { PATH } from "src/constants/paths";
import { isEmail } from "src/helpers/validate";
import AuthLayout from "src/layouts/AuthLayout";

/** Quên mật khẩu: nhập email để nhận liên kết đặt lại (hết hạn sau 30 phút). Luôn báo giống nhau để không lộ email nào đã đăng ký. */
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isEmail(email)) return setFieldError("Email chưa đúng định dạng.");
    setFieldError(undefined);
    setBusy(true);
    try {
      await forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Có lỗi xảy ra, hãy thử lại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout aside={<h2 style={{ fontSize: 28, lineHeight: 1.25, fontWeight: 700, margin: 0 }}>Quên mật khẩu cũng không sao, đặt lại chỉ mất một phút.</h2>}>
      <div className="stack" style={{ gap: 20 }}>
        <div className="stack" style={{ gap: 6 }}>
          <h1 className="h1">Quên mật khẩu</h1>
          <p className="muted">Nhập email đã đăng ký, chúng tôi gửi liên kết để đặt mật khẩu mới.</p>
        </div>

        {sent ? (
          <Alert kind="ok">
            Nếu email này đã đăng ký, một liên kết đặt lại mật khẩu vừa được gửi. Liên kết hết hạn sau 30 phút và chỉ dùng được một lần. Hãy kiểm tra cả thư mục spam.
          </Alert>
        ) : (
          <form className="stack" style={{ gap: 20 }} onSubmit={onSubmit} noValidate>
            {error && <Alert>{error}</Alert>}
            <Field
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="ban@truong.edu.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={fieldError}
              autoFocus
            />
            <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
              {busy ? "Đang gửi…" : "Gửi liên kết đặt lại"}
            </button>
          </form>
        )}

        <p className="small muted center">
          <Link to={PATH.LOGIN} className="link-strong">
            Quay lại đăng nhập
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
