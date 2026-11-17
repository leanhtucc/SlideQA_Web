import { useState, type FormEvent } from "react";
import { ApiError } from "src/apis/client";
import Alert from "src/components/Alert/Alert";
import Field from "src/components/Field/Field";
import Modal from "src/components/Modal/Modal";
import { useCreateCourse, useUpdateCourse } from "src/hooks/useCourses";

interface Props {
  open: boolean;
  /** Có `course` = sửa, không có = tạo mới */
  course?: Course | undefined;
  onClose: () => void;
}

/** Form tạo/sửa môn học (FR-CRS-01). Tên bắt buộc; mã môn, học kỳ, ngày thi tùy chọn. */
export default function CourseFormModal({ open, course, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} title={course ? "Sửa môn học" : "Môn học mới"}>
      <CourseForm course={course} onDone={onClose} />
    </Modal>
  );
}

function CourseForm({ course, onDone }: { course: Course | undefined; onDone: () => void }) {
  const create = useCreateCourse();
  const update = useUpdateCourse();
  const [name, setName] = useState(course?.name ?? "");
  const [code, setCode] = useState(course?.code ?? "");
  const [term, setTerm] = useState(course?.term ?? "");
  const [examDate, setExamDate] = useState(course?.examDate ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const busy = create.isPending || update.isPending;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!name.trim()) errs["name"] = "Hãy nhập tên môn học.";
    else if (name.trim().length > 120) errs["name"] = "Tên môn học tối đa 120 ký tự.";
    if (code.trim().length > 30) errs["code"] = "Mã môn tối đa 30 ký tự.";
    if (term.trim().length > 40) errs["term"] = "Học kỳ tối đa 40 ký tự.";
    setErrors(errs);
    setFormError(null);
    if (Object.keys(errs).length) return;

    const input: CourseInput = { name, code, term, examDate: examDate || null };
    try {
      if (course) await update.mutateAsync({ id: course.id, input });
      else await create.mutateAsync(input);
      onDone();
    } catch (err) {
      if (err instanceof ApiError && err.code === "validation_error") setErrors(err.fields);
      else setFormError(err instanceof ApiError ? err.message : "Có lỗi xảy ra, hãy thử lại.");
    }
  }

  return (
    <form className="stack" style={{ gap: 14 }} onSubmit={onSubmit} noValidate>
      {formError && <Alert>{formError}</Alert>}
      <Field label="Tên môn học" value={name} onChange={(e) => setName(e.target.value)} error={errors["name"]} autoFocus />
      <div className="row-2">
        <Field label="Mã môn (không bắt buộc)" value={code} onChange={(e) => setCode(e.target.value)} error={errors["code"]} placeholder="IS201" />
        <Field label="Học kỳ (không bắt buộc)" value={term} onChange={(e) => setTerm(e.target.value)} error={errors["term"]} placeholder="HK1 2026–2027" />
      </div>
      <Field label="Ngày thi (không bắt buộc)" type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} error={errors["examDate"]} help="Dùng để đếm ngược trên trang Tổng quan." />
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onDone}>
          Hủy
        </button>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Đang lưu…" : course ? "Lưu thay đổi" : "Tạo môn học"}
        </button>
      </div>
    </form>
  );
}
