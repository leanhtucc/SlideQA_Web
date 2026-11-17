import { useRef, useState, type FormEvent } from "react";
import Button from "src/components/Button/Button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ApiError } from "src/apis/client";
import { useAuth } from "src/hooks/useAuth";
import Alert from "src/components/Alert/Alert";
import AuthLayout from "src/layouts/AuthLayout";
import Field from "src/components/Field/Field";
import GoogleButton from "src/components/GoogleButton/GoogleButton";
import { flash } from "src/helpers/flash";
import { isEmail } from "src/helpers/validate";
import { PATH } from "src/constants/paths";

export default function Login() {
  const { login, expired } = useAuth();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? PATH.HOME;
  const [notice] = useState(() => flash.take());
  const form = useRef<HTMLFormElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const focusFirstInvalid = () => requestAnimationFrame(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!isEmail(email)) errs["email"] = "Email chưa đúng định dạng.";
    if (!password) errs["password"] = "Hãy nhập mật khẩu.";
    setErrors(errs);
    setFormError(null);
    if (Object.keys(errs).length) return focusFirstInvalid();

    setBusy(true);
    try {
      await login(email.trim().toLowerCase(), password);
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.code === "validation_error") setErrors(err.fields);
      else setFormError(err instanceof ApiError ? err.message : "Có lỗi xảy ra, hãy thử lại.");
      focusFirstInvalid();
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      aside={
        <div className="stack" style={{ maxWidth: 460, gap: 20 }}>
          <div className="card auth-demo">
            <div className="bubble-user" style={{ maxWidth: "100%", alignSelf: "flex-start", background: "#E1F0EE", color: "#0A524B" }}>
              Gateway XOR dùng để làm gì?
            </div>
            <p>
              Chọn đúng một luồng dựa trên điều kiện<span className="cite">1</span>
            </p>
            <span className="chip" style={{ alignSelf: "flex-start" }}>
              <b>1</b>Slide BPMN · tr.2
            </span>
          </div>
          <h2 style={{ fontSize: 28, lineHeight: 1.25, fontWeight: 700, margin: 0 }}>Mỗi câu trả lời đều chỉ về một trang slide của bạn.</h2>
        </div>
      }
    >
      <form ref={form} className="stack" style={{ gap: 20 }} onSubmit={onSubmit} noValidate>
        <div className="stack" style={{ gap: 6 }}>
          <h1 className="h1">Đăng nhập</h1>
          <p className="muted">Chào mừng trở lại. Tiếp tục ôn tập nào.</p>
        </div>

        {notice && !formError && <Alert kind="ok">{notice}</Alert>}
        {expired && !formError && <Alert kind="warn">Phiên đăng nhập đã hết hạn, hãy đăng nhập lại.</Alert>}
        {formError && <Alert>{formError}</Alert>}

        <Field label="Email" type="email" autoComplete="email" placeholder="ban@truong.edu.vn" value={email} onChange={(e) => setEmail(e.target.value)} error={errors["email"]} />
        <Field
          label="Mật khẩu"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors["password"]}
          right={
            <Link to={PATH.FORGOT_PASSWORD} className="small link-strong">
              Quên mật khẩu?
            </Link>
          }
        />

        <Button variant="primary" block type="submit" loading={busy} loadingText="Đang đăng nhập…">
          Đăng nhập
        </Button>

        <GoogleButton mode="signin" />

        <p className="small muted center">
          Chưa có tài khoản?{" "}
          <Link to={PATH.REGISTER} className="link-strong">
            Đăng ký
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
