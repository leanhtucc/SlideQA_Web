import { useState, type FormEvent } from "react";
import { toast } from "src/helpers/toast";
import Button from "src/components/Button/Button";
import { updateProfile } from "src/apis/account.api";
import { ApiError } from "src/apis/client";
import Alert from "src/components/Alert/Alert";
import Field from "src/components/Field/Field";
import { useAuth } from "src/hooks/useAuth";

/** Hồ sơ: xem email, đổi tên hiển thị. */
export default function ProfileSection() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.displayName ?? "");
  const [error, setError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const t = name.trim();
    if (!t) return setError("Hãy nhập tên hiển thị.");
    if (t.length > 80) return setError("Tên hiển thị tối đa 80 ký tự.");
    setError(undefined);
    setBusy(true);
    try {
      await updateProfile(t);
      await refreshUser();
      toast.success("Đã lưu tên hiển thị.");
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Không lưu được, hãy thử lại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card card-pad stack" aria-labelledby="profile-title">
      <h2 id="profile-title" className="h2">
        Hồ sơ
      </h2>
      <form className="stack" style={{ gap: 14 }} onSubmit={submit} noValidate>
        {formError && <Alert>{formError}</Alert>}
        <Field label="Email" value={user?.email ?? ""} readOnly help="Email dùng để đăng nhập, chưa đổi được." />
        <Field label="Tên hiển thị" value={name} onChange={(e) => setName(e.target.value)} error={error} />
        <Button variant="primary" type="submit" loading={busy} loadingText="Đang lưu…" style={{ alignSelf: "flex-start" }}>
          Lưu
        </Button>
      </form>
    </section>
  );
}
