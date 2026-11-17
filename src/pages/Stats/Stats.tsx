import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getStats } from "src/apis/stats.api";
import { SkeletonList } from "src/components/Loading/Loading";
import { EmptyState, ErrorState } from "src/components/State/State";
import { coursePath, PATH } from "src/constants/paths";
import MainLayout from "src/layouts/MainLayout";

const pct = (v: number | null) => (v === null ? "Chưa có" : `${v}%`);

/** Thống kê (WEB-S08, FR-ST-01, FR-ST-02): số liệu tổng quan, điểm trung bình theo môn và những trang hay làm sai. */
export default function Stats() {
  const q = useQuery({ queryKey: ["stats"], queryFn: getStats });
  const s = q.data;

  return (
    <MainLayout>
      <div className="content" style={{ maxWidth: 1080, width: "100%" }}>
        <h1 className="h1">Thống kê</h1>
        {q.isPending && <SkeletonList rows={3} label="Đang tải thống kê" />}
        {q.error && <ErrorState error={q.error} message="Không tải được thống kê." onRetry={() => q.refetch()} retrying={q.isRefetching} />}
        {s && (
          <>
            <div className="stat-grid">
              <Stat label="Tài liệu" value={s.documents} />
              <Stat label="Câu hỏi đã hỏi" value={s.questions} />
              <Stat label="Quiz" value={s.quizzes} />
              <Stat label="Điểm trung bình" value={pct(s.averageScorePct)} />
              <Stat label="Thẻ cần ôn" value={`${s.flashcards.due}/${s.flashcards.total}`} />
            </div>

            <section className="stack" style={{ gap: 12 }} aria-labelledby="by-course">
              <h2 id="by-course" className="h2">
                Theo môn học
              </h2>
              {s.courses.length === 0 ? (
                <EmptyState art="folder" title="Chưa có môn học nào" message="Tạo môn học và tải slide lên để bắt đầu có số liệu." />
              ) : (
                <ul className="card doc-list">
                  {s.courses.map((c) => (
                    <li key={c.id} className="doc-row" style={{ flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <Link to={coursePath(c.id)} className="h4 link-strong">
                          {c.name}
                        </Link>
                        <div className="small muted">
                          {c.documents} tài liệu · {c.quizzes} quiz · {c.attempts} lượt làm
                        </div>
                      </div>
                      <b aria-label={`Điểm trung bình môn ${c.name}`}>{pct(c.averageScorePct)}</b>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="stack" style={{ gap: 12 }} aria-labelledby="weak">
              <h2 id="weak" className="h2">
                Chỗ hay làm sai
              </h2>
              {s.weakTopics.length === 0 ? (
                <p className="muted">Chưa có câu nào sai. Làm quiz để thấy những trang cần ôn lại.</p>
              ) : (
                <ul className="card doc-list">
                  {s.weakTopics.map((w) => (
                    <li key={`${w.documentId}:${w.page}`} className="doc-row">
                      <div style={{ flex: 1 }}>
                        <div className="h4">
                          {w.documentName ?? "Tài liệu đã bị xóa"}, trang {w.page}
                        </div>
                        <div className="small muted">Sai {w.wrong} lần</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {s.weakTopics.length > 0 && (
                <Link to={PATH.QUIZZES} className="btn btn-secondary" style={{ alignSelf: "flex-start" }}>
                  Làm quiz để ôn lại
                </Link>
              )}
            </section>
          </>
        )}
      </div>
    </MainLayout>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="card card-pad">
      <div className="small muted">{label}</div>
      <div className="stat">{value}</div>
    </div>
  );
}
