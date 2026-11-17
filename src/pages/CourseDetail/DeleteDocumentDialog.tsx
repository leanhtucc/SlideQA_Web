import { useState } from "react";
import { toast } from "src/helpers/toast";
import Button from "src/components/Button/Button";
import { ApiError } from "src/apis/client";
import Alert from "src/components/Alert/Alert";
import Modal from "src/components/Modal/Modal";
import { useDeleteDocument } from "src/hooks/useDocuments";

interface Props {
  courseId: string;
  doc: CourseDocument | undefined;
  onClose: () => void;
}

/** Xóa tài liệu: xóa cả tệp gốc và chỉ mục; quiz và nguồn trích dẫn đã tạo vẫn được giữ (FR-DOC-05). */
export default function DeleteDocumentDialog({ courseId, doc, onClose }: Props) {
  return (
    <Modal open={!!doc} onClose={onClose} title={doc ? `Xóa "${doc.name}"?` : ""} role="alertdialog">
      {doc && <Body courseId={courseId} doc={doc} onDone={onClose} />}
    </Modal>
  );
}

function Body({ courseId, doc, onDone }: { courseId: string; doc: CourseDocument; onDone: () => void }) {
  const del = useDeleteDocument(courseId);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setError(null);
    try {
      await del.mutateAsync(doc.id);
      toast.success("Đã xóa tài liệu.");
      onDone();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Không xóa được, hãy thử lại.");
    }
  }

  return (
    <>
      <Alert>
        Thao tác này <b>không hoàn tác được</b>: tệp PDF gốc và chỉ mục tìm kiếm của tài liệu sẽ bị xóa.
      </Alert>
      <p className="small muted">Quiz và nguồn trích dẫn đã tạo từ tài liệu này vẫn được giữ lại (nguồn sẽ hiện "tài liệu đã bị xóa").</p>
      {error && <Alert>{error}</Alert>}
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onDone} autoFocus>
          Giữ lại
        </button>
        <Button variant="danger" loading={del.isPending} loadingText="Đang xóa…" onClick={confirm}>
          Xóa tài liệu
        </Button>
      </div>
    </>
  );
}
