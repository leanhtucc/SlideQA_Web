import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resetPassword } from "src/apis/account.api";
import { ApiError } from "src/apis/client";
import Alert from "src/components/Alert/Alert";
import Field from "src/components/Field/Field";
import { PATH } from "src/constants/paths";
import { passwordStrength, passwordTooLong } from "src/helpers/validate";
import AuthLayout from "src/layouts/AuthLayout";

/** Đặt mật khẩu mới từ liên kết trong email (/reset?token=...). Thành công thì mọi phiên cũ đã bị thu hồi. */
export default function ResetPassword() {
  const token = useSearchParams()[0].get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const strength = passwordStrength(password);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (password.length < 8) errs["password"] = "Mật khẩu cần ít nhất 8 ký tự.";
    else if (passwordTooLong(password)) errs["password"] = "Mật khẩu quá dài (tối đa 72 byte).";
    if (confirm !== password) errs["confirm"] = "Hai mật khẩu chưa giống nhau.";
    setErrors(errs);
    setError(null);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError && err.code === "validation_error") setErrors(err.fields);
      else setError(err instanceof ApiError ? err.message : "Có lỗi xảy ra, hãy thử lại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout aside={<h2 style={{ fontSize: 28, lineHeight: 1.25, fontWeight: 700, margin: 0 }}>Chọn mật khẩu mới, rồi tiếp tục ôn tập.</h2>}>
      <div className="stack" style={{ gap: 20 }}>
        <h1 className="h1">Đặt mật khẩu mới</h1>

        {done ? (
          <>
            <Alert kind="ok">Đã đổi mật khẩu. Hãy đăng nhập lại bằng mật khẩu mới.</Alert>
            <Link to={PATH.LOGIN} className="btn btn-primary btn-block">
              Đăng nhập
            </Link>
          </>
        ) : !token ? (
          <>
            <Alert>Liên kết không hợp lệ. Hãy yêu cầu một liên kết mới.</Alert>
            <Link to={PATH.FORGOT_PASSWORD} className="btn btn-secondary btn-block">
              Yêu cầu liên kết mới
            </Link>
          </>
        ) : (
          <form className="stack" style={{ gap: 20 }} onSubmit={onSubmit} noValidate>
            {error && (
              <Alert>
                {error}{" "}
                <Link to={PATH.FORGOT_PASSWORD} className="link-strong">
                  Yêu cầu liên kết mới
                </Link>
              </Alert>
            )}
            <div className="stack" style={{ gap: 8 }}>
              <Field
                label="Mật khẩu mới"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors["password"]}
                help="Ít nhất 8 ký tự."
                autoFocus
              />
              {password && (
                <div className={`meter level-${strength.level}`} aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </div>
              )}
            </div>
            <Field
              label="Nhập lại mật khẩu mới"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              error={errors["confirm"]}
            />
            <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
              {busy ? "Đang lưu…" : "Đặt mật khẩu"}
            </button>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}
