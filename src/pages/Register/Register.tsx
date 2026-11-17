import { useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "src/apis/client";
import { useAuth } from "src/hooks/useAuth";
import Alert from "src/components/Alert/Alert";
import AuthLayout from "src/layouts/AuthLayout";
import Field from "src/components/Field/Field";
import { isEmail, passwordStrength, passwordTooLong } from "src/helpers/validate";
import GoogleButton from "src/components/GoogleButton/GoogleButton";
import { PATH } from "src/constants/paths";
import { BENEFITS } from "./Register.constants";


export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const form = useRef<HTMLFormElement>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const strength = passwordStrength(password);

  const focusFirstInvalid = () => requestAnimationFrame(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!name.trim()) errs["displayName"] = "Hãy nhập tên hiển thị.";
    if (!isEmail(email)) errs["email"] = "Email chưa đúng định dạng.";
    if (password.length < 8) errs["password"] = "Mật khẩu cần ít nhất 8 ký tự.";
    else if (passwordTooLong(password)) errs["password"] = "Mật khẩu quá dài (tối đa 72 byte).";
    if (!terms) errs["acceptTerms"] = "Bạn cần đồng ý Điều khoản sử dụng và Chính sách bảo vệ dữ liệu cá nhân.";
    setErrors(errs);
    setFormError(null);
    if (Object.keys(errs).length) return focusFirstInvalid();

    setBusy(true);
    try {
      await register({ email: email.trim().toLowerCase(), password, displayName: name.trim() });
      navigate(PATH.HOME, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.code === "email_taken") setErrors({ email: err.message });
      else if (err instanceof ApiError && err.code === "validation_error") setErrors(err.fields);
      else setFormError(err instanceof ApiError ? err.message : "Có lỗi xảy ra, hãy thử lại.");
      focusFirstInvalid();
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      aside={
        <div className="stack" style={{ maxWidth: 460, gap: 24 }}>
          <h2 style={{ fontSize: 32, lineHeight: 1.2, fontWeight: 700, margin: 0 }}>Bắt đầu ôn thi theo đúng slide của bạn</h2>
          <ul className="benefits">
            {BENEFITS.map((b) => (
              <li key={b}>
                <svg className="ic" viewBox="0 0 24 24" aria-hidden="true" style={{ color: "#FFE066" }}>
                  <path d="M5 12l5 5 9-10" />
                </svg>
                {b}
              </li>
            ))}
          </ul>
        </div>
      }
    >
      <form ref={form} className="stack" style={{ gap: 18 }} onSubmit={onSubmit} noValidate>
        <div className="stack" style={{ gap: 6 }}>
          <h1 className="h1">Tạo tài khoản</h1>
          <p className="muted">Miễn phí, mất chưa đến một phút.</p>
        </div>

        {formError && <Alert>{formError}</Alert>}

        <Field label="Tên hiển thị" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} error={errors["displayName"]} />
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="ban@truong.edu.vn"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={
            errors["email"] && (
              <>
                {errors["email"]}{" "}
                {errors["email"] === "Email này đã được dùng." && (
                  <Link to={PATH.LOGIN} className="link-strong">
                    Đăng nhập?
                  </Link>
                )}
              </>
            )
          }
        />
        <div className="stack" style={{ gap: 6 }}>
          <Field
            label="Mật khẩu"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors["password"]}
            help={password ? `Ít nhất 8 ký tự. Độ mạnh: ${strength.label}.` : "Ít nhất 8 ký tự."}
          />
          {password && (
            <div className={`meter level-${strength.level}`} aria-hidden="true">
              <i />
              <i />
              <i />
            </div>
          )}
        </div>

        <div className="stack" style={{ gap: 6 }}>
          <label className="check">
            <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} aria-invalid={errors["acceptTerms"] ? true : undefined} aria-describedby={errors["acceptTerms"] ? "terms-err" : undefined} />
            <span>
              Tôi đã đọc và đồng ý với{" "}
              <Link to={PATH.TERMS} className="link-strong">
                Điều khoản sử dụng
              </Link>{" "}
              và{" "}
              <Link to={PATH.PRIVACY} className="link-strong">
                Chính sách bảo vệ dữ liệu cá nhân
              </Link>
              .
            </span>
          </label>
          {errors["acceptTerms"] && (
            <span id="terms-err" className="help err">
              {errors["acceptTerms"]}
            </span>
          )}
          <p className="tiny muted">Việc gửi đoạn tài liệu tới nhà cung cấp AI được hỏi riêng khi bạn đặt câu hỏi đầu tiên.</p>
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          {busy ? "Đang tạo tài khoản…" : "Đăng ký"}
        </button>

        <GoogleButton mode="signup" />

        <p className="small muted center">
          Đã có tài khoản?{" "}
          <Link to={PATH.LOGIN} className="link-strong">
            Đăng nhập
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
