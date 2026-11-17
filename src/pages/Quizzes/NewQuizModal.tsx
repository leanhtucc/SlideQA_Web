import { useQuery } from "@tanstack/react-query";
import { toast } from "src/helpers/toast";
import Button from "src/components/Button/Button";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "src/apis/client";
import { listDocuments } from "src/apis/documents.api";
import Alert from "src/components/Alert/Alert";
import Modal from "src/components/Modal/Modal";
import { attemptPath } from "src/constants/paths";
import { useAuth } from "src/hooks/useAuth";
import { useCourses } from "src/hooks/useCourses";
import { useCreateQuiz, useStartAttempt } from "src/hooks/useQuizzes";
import ConsentDialog from "src/pages/Study/ConsentDialog";

interface Props {
  open: boolean;
  onClose: () => void;
}

/** Thiết lập quiz: chọn tài liệu, khoảng trang, số câu (FR-QZ-01). Quiz cần AI nên phải có đồng ý gửi dữ liệu trước. */
export default function NewQuizModal({ open, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Tạo quiz mới">
      <Form onClose={onClose} />
    </Modal>
  );
}

const toInt = (s: string) => (s.trim() === "" ? undefined : Number(s));

function Form({ onClose }: { onClose: () => void }) {
  const { user, setLlmConsent } = useAuth();
  const docs = useQuery({
    queryKey: ["documents", "all"],
    queryFn: () => listDocuments(),
  });
  const create = useCreateQuiz();
  const start = useStartAttempt();
  const navigate = useNavigate();
  const ready = (docs.data ?? []).filter((d) => d.status === "ready");
  const courses = useCourses();
  const [scope, setScope] = useState<"doc" | "course">("doc");
  const [courseId, setCourseId] = useState("");
  // Chỉ gợi ý các môn có ít nhất một tài liệu đã xử lý xong.
  const courseOptions = (courses.data ?? []).filter((c) => ready.some((d) => d.courseId === c.id));
  const course = courseOptions.find((c) => c.id === courseId) ?? courseOptions[0];
  const wholeCourse = scope === "course" && !!course;
  const [docId, setDocId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [count, setCount] = useState("5");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [askConsent, setAskConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const doc = ready.find((d) => d.id === docId) ?? ready[0];

  async function run() {
    if (!doc) return;
    setBusy(true);
    setError(null);
    try {
      const f = toInt(from);
      const t = toInt(to);
      const quiz = await create.mutateAsync(
        wholeCourse
          ? { courseId: course.id, count: Number(count) }
          : {
              documentId: doc.id,
              count: Number(count),
              ...(f !== undefined ? { fromPage: f } : {}),
              ...(t !== undefined ? { toPage: t } : {}),
            },
      );
      const attempt = await start.mutateAsync(quiz.id);
      toast.success("Đã tạo quiz mới. Chúc bạn làm bài tốt!");
      navigate(attemptPath(attempt.id));
    } catch (e) {
      if (e instanceof ApiError && e.code === "validation_error") setErrors(e.fields);
      else setError(e instanceof ApiError ? e.message : "Không tạo được quiz, hãy thử lại.");
    } finally {
      setBusy(false);
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const n = Number(count);
    if (!Number.isInteger(n) || n < 1 || n > 10) errs["count"] = "Số câu từ 1 đến 10.";
    const f = wholeCourse ? undefined : toInt(from);
    const t = wholeCourse ? undefined : toInt(to);
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
      else setError("Quiz cần gửi đoạn tài liệu cho nhà cung cấp AI nên không tạo được nếu bạn không đồng ý.");
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
        {docs.data && ready.length === 0 && <Alert kind="warn">Chưa có tài liệu nào sẵn sàng. Hãy tải PDF lên một môn học trước.</Alert>}
        {doc && (
          <>
            {courseOptions.length > 0 && (
              <div className="field">
                <label className="label" htmlFor="quiz-scope">
                  Phạm vi
                </label>
                <select id="quiz-scope" className="input" value={scope} onChange={(e) => setScope(e.target.value === "course" ? "course" : "doc")}>
                  <option value="doc">Một tài liệu</option>
                  <option value="course">Cả môn học</option>
                </select>
              </div>
            )}
            {wholeCourse ? (
              <div className="field">
                <label className="label" htmlFor="quiz-course">
                  Môn học
                </label>
                <select id="quiz-course" className="input" value={course.id} onChange={(e) => setCourseId(e.target.value)}>
                  {courseOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="field">
                <label className="label" htmlFor="quiz-doc">
                  Tài liệu
                </label>
                <select id="quiz-doc" className="input" value={doc.id} onChange={(e) => setDocId(e.target.value)}>
                  {ready.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.pages} trang)
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: wholeCourse ? "1fr" : "1fr 1fr 1fr",
                gap: 12,
              }}
            >
              {!wholeCourse && (
                <>
                  <NumField id="quiz-from" label="Từ trang" value={from} onChange={setFrom} error={errors["fromPage"]} placeholder="1" />
                  <NumField id="quiz-to" label="Đến trang" value={to} onChange={setTo} error={errors["toPage"]} placeholder={String(doc.pages)} />
                </>
              )}
              <NumField id="quiz-count" label="Số câu" value={count} onChange={setCount} error={errors["count"]} />
            </div>
            <p className="small muted">
              {wholeCourse
                ? "Câu hỏi lấy từ mọi tài liệu đã xử lý xong của môn, chia đều giữa các tài liệu (tối đa 10 tài liệu mỗi lần)."
                : "Để trống trang để dùng cả tài liệu. Câu hỏi chỉ dựa trên nội dung các trang đã chọn."}
            </p>
          </>
        )}
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Hủy
          </button>
          <Button variant="primary" type="submit" disabled={busy || !doc} loading={busy} loadingText="Đang tạo quiz…">
            Tạo quiz
          </Button>
        </div>
      </form>
      <ConsentDialog open={askConsent} onClose={() => setAskConsent(false)} onChoose={choose} busy={busy} />
    </>
  );
}

interface NumFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error: string | undefined;
  placeholder?: string;
}

function NumField({ id, label, value, onChange, error, placeholder }: NumFieldProps) {
  return (
    <div className="field">
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className={"input" + (error ? " err" : "")}
        inputMode="numeric"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : undefined}
      />
      {error && (
        <span id={`${id}-err`} className="help err">
          {error}
        </span>
      )}
    </div>
  );
}
