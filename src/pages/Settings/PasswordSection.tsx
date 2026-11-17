import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { changePassword } from "src/apis/account.api";
import { ApiError } from "src/apis/client";
import Alert from "src/components/Alert/Alert";
import Field from "src/components/Field/Field";
import { PATH } from "src/constants/paths";
import { flash } from "src/helpers/flash";
import { passwordTooLong } from "src/helpers/validate";
import { useAuth } from "src/hooks/useAuth";

/** Đổi mật khẩu cần mật khẩu hiện tại. Thành công thì mọi phiên bị thu hồi nên đưa về trang đăng nhập. */
export default function PasswordSection() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!current) errs["currentPassword"] = "Hãy nhập mật khẩu hiện tại.";
    if (next.length < 8) errs["newPassword"] = "Mật khẩu cần ít nhất 8 ký tự.";
    else if (passwordTooLong(next)) errs["newPassword"] = "Mật khẩu quá dài (tối đa 72 byte).";
    if (confirm !== next) errs["confirm"] = "Hai mật khẩu chưa giống nhau.";
    setErrors(errs);
    setFormError(null);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      await changePassword(current, next);
      flash.set("Đã đổi mật khẩu. Hãy đăng nhập lại bằng mật khẩu mới.");
      await logout(); // guard tự đưa về trang đăng nhập; navigate chỉ để chắc chắn khi guard chưa kịp chạy
      navigate(PATH.LOGIN, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.code === "wrong_password") setErrors({ currentPassword: err.message });
      else if (err instanceof ApiError && err.code === "validation_error") setErrors(err.fields);
      else setFormError(err instanceof ApiError ? err.message : "Không đổi được mật khẩu, hãy thử lại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card card-pad stack" aria-labelledby="pw-title">
      <h2 id="pw-title" className="h2">
        Đổi mật khẩu
      </h2>
      <form className="stack" style={{ gap: 14 }} onSubmit={submit} noValidate>
        {formError && <Alert>{formError}</Alert>}
        <Field
          label="Mật khẩu hiện tại"
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          error={errors["currentPassword"]}
        />
        <Field
          label="Mật khẩu mới"
          type="password"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          error={errors["newPassword"]}
          help="Ít nhất 8 ký tự. Đổi xong, bạn sẽ đăng nhập lại trên mọi thiết bị."
        />
        <Field label="Nhập lại mật khẩu mới" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors["confirm"]} />
        <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-start" }} disabled={busy}>
          {busy ? "Đang đổi…" : "Đổi mật khẩu"}
        </button>
      </form>
    </section>
  );
}
