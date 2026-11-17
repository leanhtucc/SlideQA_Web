import { useState, type FormEvent } from "react";
import { ApiError } from "src/apis/client";
import Alert from "src/components/Alert/Alert";
import Field from "src/components/Field/Field";
import Modal from "src/components/Modal/Modal";
import { useRenameDocument } from "src/hooks/useDocuments";

interface Props {
  courseId: string;
  doc: CourseDocument | undefined;
  onClose: () => void;
}

export default function RenameDocumentDialog({ courseId, doc, onClose }: Props) {
  return (
    <Modal open={!!doc} onClose={onClose} title="Đổi tên tài liệu">
      {doc && <Form key={doc.id} courseId={courseId} doc={doc} onDone={onClose} />}
    </Modal>
  );
}

function Form({ courseId, doc, onDone }: { courseId: string; doc: CourseDocument; onDone: () => void }) {
  const rename = useRenameDocument(courseId);
  const [name, setName] = useState(doc.name);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const v = name.trim();
    setFormError(null);
    if (!v) return setError("Tên tài liệu không được để trống.");
    if (v.length > 200) return setError("Tên tài liệu tối đa 200 ký tự.");
    setError(null);
    try {
      await rename.mutateAsync({ id: doc.id, name: v });
      onDone();
    } catch (err) {
      if (err instanceof ApiError && err.code === "validation_error") setError(err.fields["name"] ?? err.message);
      else setFormError(err instanceof ApiError ? err.message : "Có lỗi xảy ra, hãy thử lại.");
    }
  }

  return (
    <form className="stack" style={{ gap: 14 }} onSubmit={onSubmit} noValidate>
      {formError && <Alert>{formError}</Alert>}
      <Field label="Tên tài liệu" value={name} onChange={(e) => setName(e.target.value)} error={error ?? undefined} autoFocus />
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onDone}>
          Hủy
        </button>
        <button type="submit" className="btn btn-primary" disabled={rename.isPending}>
          {rename.isPending ? "Đang lưu…" : "Lưu"}
        </button>
      </div>
    </form>
  );
}
