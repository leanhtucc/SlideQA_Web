import { useState } from "react";
import Button from "src/components/Button/Button";
import { EmptyState, ErrorState } from "src/components/State/State";
import { SkeletonList } from "src/components/Loading/Loading";
import { errorMessage } from "src/helpers/errors";
import { toast } from "src/helpers/toast";
import { useNavigate } from "react-router-dom";
import { ApiError } from "src/apis/client";
import Alert from "src/components/Alert/Alert";
import { attemptPath } from "src/constants/paths";
import { formatDayMonthFromIso } from "src/helpers/format";
import { useQuizzes, useStartAttempt } from "src/hooks/useQuizzes";
import MainLayout from "src/layouts/MainLayout";
import NewQuizModal from "./NewQuizModal";

/** Danh sách quiz (WEB-S06): tạo quiz mới từ một tài liệu, làm bài, xem điểm tốt nhất. */
export default function Quizzes() {
  const list = useQuizzes();
  const start = useStartAttempt();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);

  async function open(quizId: string) {
    try {
      navigate(attemptPath((await start.mutateAsync(quizId)).id));
    } catch (e) {
      toast.error(errorMessage(e, "Không mở được bài quiz, hãy thử lại."));
    }
  }

  const items = list.data ?? [];
  return (
    <MainLayout>
      <div className="content" style={{ maxWidth: 1080, width: "100%" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <h1 className="h1">Quiz</h1>
          <button className="btn btn-primary" onClick={() => setCreating(true)}>
            Tạo quiz mới
          </button>
        </div>
        {list.isPending && <SkeletonList rows={3} label="Đang tải quiz" />}
        {list.error && <ErrorState error={list.error} message="Không tải được danh sách quiz." onRetry={() => list.refetch()} retrying={list.isRefetching} />}
        {list.data && items.length === 0 && (
          <EmptyState
            art="quiz"
            title="Chưa có quiz nào"
            message="Bấm Tạo quiz mới để AI ra câu hỏi từ slide của bạn."
            action={<Button onClick={() => setCreating(true)}>Tạo quiz mới</Button>}
          />
        )}
        {items.length > 0 && (
          <ul className="card doc-list">
            {items.map((q) => (
              <li key={q.id} className="doc-row" style={{ flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div className="h4">{q.documentName ?? (q.courseName ? `Cả môn ${q.courseName}` : "Tài liệu đã bị xóa")}</div>
                  <div className="small muted">
                    {q.fromPage !== null && `Trang ${q.fromPage}–${q.toPage} · `}{q.count} câu · tạo ngày {formatDayMonthFromIso(q.createdAt)}
                  </div>
                </div>
                <span className="small muted">{q.bestScore === null ? "Chưa làm" : `Tốt nhất ${q.bestScore}/${q.count} · ${q.attemptCount} lần`}</span>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={start.isPending}
                  onClick={() => open(q.id)}
                  aria-label={`Làm bài ${q.documentName ?? q.courseName ?? ""}${q.fromPage !== null ? ` trang ${q.fromPage}–${q.toPage}` : ""}`}
                >
                  Làm bài
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <NewQuizModal open={creating} onClose={() => setCreating(false)} />
    </MainLayout>
  );
}
