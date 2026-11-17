import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { deleteAccount } from "src/apis/account.api";
import { ApiError } from "src/apis/client";
import Alert from "src/components/Alert/Alert";
import Field from "src/components/Field/Field";
import Modal from "src/components/Modal/Modal";
import { PATH } from "src/constants/paths";
import { flash } from "src/helpers/flash";
import { useAuth } from "src/hooks/useAuth";

/** Xóa tài khoản (không hoàn tác): cần nhập mật khẩu; xóa mọi môn, tài liệu (cả tệp PDF), hội thoại và quiz. */
export default function DeleteAccountSection() {
  const [open, setOpen] = useState(false);
  return (
    <section className="card card-pad stack" aria-labelledby="del-title">
      <h2 id="del-title" className="h2">
        Xóa tài khoản
      </h2>
      <p className="small">
        Xóa vĩnh viễn tài khoản cùng toàn bộ môn học, tài liệu (kể cả tệp PDF gốc), hội thoại và quiz của bạn. <b>Không thể khôi phục.</b>
      </p>
      <button className="btn btn-danger" style={{ alignSelf: "flex-start" }} onClick={() => setOpen(true)}>
        Xóa tài khoản…
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Xóa tài khoản?" role="alertdialog">
        <Confirm onCancel={() => setOpen(false)} />
      </Modal>
    </section>
  );
}

function Confirm({ onCancel }: { onCancel: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const byEmail = user?.hasPassword === false; // tài khoản chỉ dùng Google: gõ lại email thay cho mật khẩu
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!password) return setError(byEmail ? "Hãy nhập email để xác nhận." : "Hãy nhập mật khẩu để xác nhận.");
    setError(undefined);
    setFormError(null);
    setBusy(true);
    try {
      await deleteAccount(byEmail ? { email: password } : { password });
      flash.set("Tài khoản và toàn bộ dữ liệu của bạn đã được xóa.");
      await logout(); // phiên đã bị xóa ở server; xóa nốt dấu vết trên máy
      navigate(PATH.LOGIN, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && (err.code === "wrong_password" || err.code === "wrong_confirmation")) setError(err.message);
      else setFormError(err instanceof ApiError ? err.message : "Không xóa được, hãy thử lại.");
      setBusy(false);
    }
  }

  return (
    <form className="stack" style={{ gap: 14 }} onSubmit={submit} noValidate>
      <Alert>
        Thao tác này <b>không hoàn tác được</b>. Toàn bộ dữ liệu của bạn sẽ bị xóa ngay.
      </Alert>
      {formError && <Alert>{formError}</Alert>}
      <Field
        label={byEmail ? "Nhập lại email của bạn để xác nhận" : "Nhập mật khẩu để xác nhận"}
        type={byEmail ? "email" : "password"}
        autoComplete={byEmail ? "email" : "current-password"}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={error}
        autoFocus
      />
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Giữ tài khoản
        </button>
        <button type="submit" className="btn btn-danger" disabled={busy}>
          {busy ? "Đang xóa…" : "Xóa vĩnh viễn"}
        </button>
      </div>
    </form>
  );
}
