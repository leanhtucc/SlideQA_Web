import { useState } from "react";
import { ApiError } from "src/apis/client";
import Alert from "src/components/Alert/Alert";
import Modal from "src/components/Modal/Modal";
import { useDeleteCourse } from "src/hooks/useCourses";

interface Props {
  /** Môn đang chờ xác nhận xóa; undefined = đóng */
  course: Course | undefined;
  onClose: () => void;
}

/** Hộp xác nhận xóa nêu rõ số tài liệu và quiz bị xóa theo (FR-CRS-03). */
export default function DeleteCourseDialog({ course, onClose }: Props) {
  return (
    <Modal open={!!course} onClose={onClose} title={course ? `Xóa môn "${course.name}"?` : ""} role="alertdialog">
      {course && <Body course={course} onDone={onClose} />}
    </Modal>
  );
}

function Body({ course, onDone }: { course: Course; onDone: () => void }) {
  const del = useDeleteCourse();
  const [error, setError] = useState<string | null>(null);
  const total = course.documentCount + course.quizCount;

  async function confirm() {
    setError(null);
    try {
      await del.mutateAsync(course.id);
      onDone();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Không xóa được, hãy thử lại.");
    }
  }

  return (
    <>
      <Alert>
        Thao tác này <b>không hoàn tác được</b>.{" "}
        {total > 0 ? (
          <>
            Sẽ xóa luôn <b>{course.documentCount} tài liệu</b> (kèm tệp PDF gốc) và <b>{course.quizCount} quiz</b>.
          </>
        ) : (
          "Môn này chưa có tài liệu hay quiz."
        )}
      </Alert>
      <p className="small muted">Các hội thoại cũ vẫn được giữ lại; nguồn trích dẫn sẽ hiện "tài liệu đã bị xóa".</p>
      {error && <Alert>{error}</Alert>}
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onDone} autoFocus>
          Giữ lại
        </button>
        <button type="button" className="btn btn-danger" onClick={confirm} disabled={del.isPending}>
          {del.isPending ? "Đang xóa…" : total > 0 ? `Xóa môn và ${total} mục` : "Xóa môn"}
        </button>
      </div>
    </>
  );
}
