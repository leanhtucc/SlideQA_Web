import { useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "src/apis/client";
import { listDocuments } from "src/apis/documents.api";
import Alert from "src/components/Alert/Alert";
import Button from "src/components/Button/Button";
import Field from "src/components/Field/Field";
import Modal from "src/components/Modal/Modal";
import { PATH } from "src/constants/paths";
import { toast } from "src/helpers/toast";
import { useAuth } from "src/hooks/useAuth";
import { useCourses } from "src/hooks/useCourses";
import { useFlashcardsFromDocument } from "src/hooks/useFlashcards";
import ConsentDialog from "src/pages/Study/ConsentDialog";

const COUNTS = [10, 20, 50, 100] as const;
const toInt = (s: string) => (s.trim() === "" ? undefined : Number(s));

/** Tạo nhiều thẻ ghi nhớ từ một tài liệu đã tải lên: AI đọc các trang đã chọn và soạn câu hỏi, đáp án kèm số trang. */
export default function FromDocumentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Tạo thẻ từ tài liệu">
      <Form onClose={onClose} />
    </Modal>
  );
}

function Form({ onClose }: { onClose: () => void }) {
  const { user, setLlmConsent } = useAuth();
  const docs = useQuery({ queryKey: ["documents", "all"], queryFn: () => listDocuments() });
  const courses = useCourses();
  const create = useFlashcardsFromDocument();
  const ready = (docs.data ?? []).filter((d) => d.status === "ready");
  const [docId, setDocId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [count, setCount] = useState<number>(50);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [askConsent, setAskConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const doc = ready.find((d) => d.id === docId) ?? ready[0];
  const courseName = (id: string | null) => courses.data?.find((c) => c.id === id)?.name;

  async function run() {
    if (!doc) return;
    setBusy(true);
    setError(null);
    try {
      const f = toInt(from);
      const t = toInt(to);
      const r = await create.mutateAsync({ documentId: doc.id, count, ...(f !== undefined ? { fromPage: f } : {}), ...(t !== undefined ? { toPage: t } : {}) });
      toast.success(
        r.created > 0
          ? `Đã tạo ${r.created} thẻ${r.skipped > 0 ? `, bỏ qua ${r.skipped} thẻ trùng` : ""}${r.created + r.skipped < r.requested ? ` (tài liệu chỉ đủ ý cho ${r.created + r.skipped} thẻ)` : ""}.`
          : "Các thẻ này đã có rồi, không tạo thêm.",
      );
      onClose();
    } catch (e) {
      if (e instanceof ApiError && e.code === "validation_error") setErrors(e.fields);
      else setError(e instanceof ApiError ? e.message : "Không tạo được thẻ, hãy thử lại.");
    } finally {
      setBusy(false);
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const f = toInt(from);
    const t = toInt(to);
    if (f !== undefined && (!Number.isInteger(f) || f < 1)) errs["fromPage"] = "Trang bắt đầu từ 1.";
    if (t !== undefined && (!Number.isInteger(t) || t < 1)) errs["toPage"] = "Trang bắt đầu từ 1.";
    if (f !== undefined && t !== undefined && f > t) errs["toPage"] = "Trang kết thúc phải lớn hơn hoặc bằng trang bắt đầu.";
    if (doc && ((f ?? 0) > doc.pages || (t ?? 0) > doc.pages)) errs["toPage"] = `Tài liệu chỉ có ${doc.pages} trang.`;
    setErrors(errs);
    if (Object.keys(errs).length) return;
    if (!user?.llmConsentAt) return setAskConsent(true);
    void run();
  }

  async function choose(granted: boolean) {
    setBusy(true);
    try {
      await setLlmConsent(granted);
      setAskConsent(false);
      if (granted) await run();
      else setError("Tạo thẻ cần gửi đoạn tài liệu cho nhà cung cấp AI nên không thực hiện được nếu bạn không đồng ý.");
    } catch (e) {
      setAskConsent(false);
      setError(e instanceof ApiError ? e.message : "Không lưu được lựa chọn, hãy thử lại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <form className="stack" style={{ gap: 14 }} onSubmit={submit} noValidate>
        {error && <Alert>{error}</Alert>}
        {docs.isPending && <p className="muted">Đang tải tài liệu…</p>}
        {docs.error && <Alert>Không tải được danh sách tài liệu.</Alert>}
        {docs.data && ready.length === 0 && (
          <Alert kind="warn">
            Chưa có tài liệu nào sẵn sàng. <Link to={PATH.HOME} className="link-strong">Vào một môn học để tải PDF lên</Link>, rồi quay lại đây.
          </Alert>
        )}
        {doc && (
          <>
            <div className="field">
              <label className="label" htmlFor="fc-doc">
                Tài liệu
              </label>
              <select id="fc-doc" className="input" value={doc.id} onChange={(e) => setDocId(e.target.value)} disabled={busy}>
                {ready.map((d) => (
                  <option key={d.id} value={d.id}>
                    {courseName(d.courseId) ? `${courseName(d.courseId)} · ` : ""}
                    {d.name} ({d.pages} trang)
                  </option>
                ))}
              </select>
            </div>
            <div className="row-2">
              <Field label="Từ trang" inputMode="numeric" value={from} onChange={(e) => setFrom(e.target.value)} error={errors["fromPage"]} placeholder="1" disabled={busy} />
              <Field label="Đến trang" inputMode="numeric" value={to} onChange={(e) => setTo(e.target.value)} error={errors["toPage"]} placeholder={String(doc.pages)} disabled={busy} />
            </div>
            <div className="field" role="radiogroup" aria-labelledby="fc-count-label">
              <span className="label" id="fc-count-label">
                Số thẻ muốn tạo
              </span>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {COUNTS.map((n) => (
                  <button key={n} type="button" role="radio" aria-checked={count === n} className="btn btn-ghost" disabled={busy} onClick={() => setCount(n)}>
                    {n} thẻ
                  </button>
                ))}
              </div>
            </div>
            <p className="small muted">Để trống trang để dùng cả tài liệu. Nhiều thẻ sẽ được soạn từ nhiều phần của tài liệu để trải đều nội dung. Mỗi thẻ ghi rõ trang nguồn; thẻ trùng câu hỏi với thẻ đã có sẽ được bỏ qua.</p>
          </>
        )}
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>
            Hủy
          </button>
          <Button variant="primary" type="submit" disabled={busy || !doc} loading={busy} loadingText="Đang tạo thẻ…">
            Tạo thẻ
          </Button>
        </div>
        {busy && (
          <p className="small muted" role="status">
            {count >= 50 ? "AI đang đọc tài liệu và soạn nhiều thẻ, có thể mất tới 1–2 phút." : "AI đang đọc tài liệu, thường mất 10–30 giây."} Đừng đóng cửa sổ này.
          </p>
        )}
      </form>
      <ConsentDialog open={askConsent} onClose={() => setAskConsent(false)} onChoose={choose} busy={busy} />
    </>
  );
}
