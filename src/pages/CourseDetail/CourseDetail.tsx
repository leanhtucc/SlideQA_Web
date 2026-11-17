import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError } from "src/apis/client";
import { EmptyState, ErrorState } from "src/components/State/State";
import { SkeletonList } from "src/components/Loading/Loading";
import { errorMessage } from "src/helpers/errors";
import { toast } from "src/helpers/toast";
import { PATH, studyPath } from "src/constants/paths";
import { useCreateConversation } from "src/hooks/useConversation";
import { formatDayMonth } from "src/helpers/date";
import { useCourse } from "src/hooks/useCourses";
import { useDocuments, useRefreshDocuments, useRetryDocument } from "src/hooks/useDocuments";
import { useUploads } from "src/hooks/useUploads";
import MainLayout from "src/layouts/MainLayout";
import DeleteDocumentDialog from "./DeleteDocumentDialog";
import DocumentRow from "./DocumentRow";
import DropZone from "./DropZone";
import RenameDocumentDialog from "./RenameDocumentDialog";
import UploadRow from "./UploadRow";

/** Chi tiết môn (WEB-S03): tải PDF kéo thả nhiều tệp, trạng thái xử lý, cảnh báo trang trống, đổi tên, xóa, thử lại. */
export default function CourseDetail() {
  const { id = "" } = useParams();
  const { data: course, error, isPending, refetch, isRefetching } = useCourse(id);
  const notFound = error instanceof ApiError && error.status === 404;

  return (
    <MainLayout>
      <div className="content" style={{ maxWidth: 1200, width: "100%" }}>
        <nav aria-label="Đường dẫn" className="small muted">
          <Link to={PATH.HOME} className="link-strong">
            Môn học
          </Link>
          {course && <> / {course.name}</>}
        </nav>

        {isPending && <div className="skeleton" style={{ height: 80 }} aria-busy="true" />}
        {error && (
          <ErrorState
            error={error}
            message={notFound ? "Không tìm thấy môn học này." : "Không tải được môn học, hãy thử lại."}
            {...(notFound ? {} : { onRetry: () => refetch(), retrying: isRefetching })}
          >
            {notFound && (
              <Link to={PATH.HOME} className="btn btn-secondary">
                Về tổng quan
              </Link>
            )}
          </ErrorState>
        )}

        {course && (
          <>
            <div className="stack" style={{ gap: 4 }}>
              <h1 className="h1">{course.name}</h1>
              <p className="muted">
                {[course.code, course.term, course.examDate && `Thi ngày ${formatDayMonth(course.examDate)}`].filter(Boolean).join(" · ") || "Chưa có mã môn, học kỳ hay ngày thi."}
              </p>
            </div>
            <Documents courseId={course.id} />
          </>
        )}
      </div>
    </MainLayout>
  );
}

function Documents({ courseId }: { courseId: string }) {
  const docs = useDocuments(courseId);
  const refresh = useRefreshDocuments(courseId);
  const uploads = useUploads(courseId, refresh);
  const retry = useRetryDocument(courseId);
  const navigate = useNavigate();
  const createConv = useCreateConversation();
  const [renaming, setRenaming] = useState<CourseDocument | undefined>();
  const [deleting, setDeleting] = useState<CourseDocument | undefined>();

  const list = docs.data ?? [];
  const hasReady = list.some((d) => d.status === "ready");

  /** Tạo hội thoại mới (cả môn, hoặc chỉ một tài liệu) rồi vào không gian học. */
  async function openChat(documentIds?: string[]) {
    try {
      const c = await createConv.mutateAsync({ courseId, ...(documentIds ? { documentIds } : {}) });
      navigate(studyPath(c.id));
    } catch (e) {
      toast.error(errorMessage(e, "Không mở được hội thoại, hãy thử lại."));
    }
  }

  return (
    <>
      <DropZone onFiles={uploads.add} />

      {uploads.items.length > 0 && (
        <section className="stack" style={{ gap: 8 }} aria-label="Đang tải lên">
          <div className="card">
            {uploads.items.map((item) => (
              <UploadRow key={item.id} item={item} onRetry={uploads.retry} onCancel={uploads.cancel} />
            ))}
          </div>
        </section>
      )}

      <section className="stack" style={{ gap: 12 }} aria-labelledby="docs-title">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h2 id="docs-title" className="h2">
            Tài liệu{docs.data ? ` (${list.length})` : ""}
          </h2>
          <button
            className="btn btn-primary"
            disabled={!hasReady || createConv.isPending}
            onClick={() => openChat()}
            title={hasReady ? undefined : "Cần ít nhất một tài liệu đã sẵn sàng"}
          >
            <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.6A8 8 0 1 1 21 12z" />
            </svg>
            Hỏi trong môn này
          </button>
        </div>

        {docs.isPending && <SkeletonList rows={3} label="Đang tải tài liệu" />}
        {docs.error && <ErrorState compact error={docs.error} message="Không tải được danh sách tài liệu." onRetry={() => docs.refetch()} retrying={docs.isRefetching} />}

        {docs.data && list.length === 0 && <EmptyState art="doc" title="Chưa có tài liệu nào" message="Kéo thả PDF vào khung bên trên để bắt đầu." />}
        {list.length > 0 && (
          <ul className="card doc-list">
            {list.map((d) => (
              <DocumentRow
                key={d.id}
                doc={d}
                retrying={retry.isPending && retry.variables === d.id}
                onRename={setRenaming}
                onDelete={setDeleting}
                onRetry={(x) => retry.mutate(x.id, { onError: (e) => toast.error(errorMessage(e, "Không thử lại được.")) })}
                onOpen={(x) => openChat([x.id])}
              />
            ))}
          </ul>
        )}
      </section>

      <RenameDocumentDialog courseId={courseId} doc={renaming} onClose={() => setRenaming(undefined)} />
      <DeleteDocumentDialog courseId={courseId} doc={deleting} onClose={() => setDeleting(undefined)} />
    </>
  );
}
