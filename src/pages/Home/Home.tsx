import { useState } from "react";
import Button from "src/components/Button/Button";
import { EmptyState, ErrorState } from "src/components/State/State";
import { daysUntil } from "src/helpers/date";
import { useAuth } from "src/hooks/useAuth";
import { useCourses } from "src/hooks/useCourses";
import MainLayout from "src/layouts/MainLayout";
import CourseCard from "./CourseCard";
import CourseFormModal from "./CourseFormModal";
import DeleteCourseDialog from "./DeleteCourseDialog";

/** Tổng quan (WEB-S02): danh sách môn học và tạo/sửa/xóa. Thẻ thống kê điểm, thẻ đến hạn, quiz gần đây chờ API ở các lát sau. */
export default function Home() {
  const { user } = useAuth();
  const { data: courses, isPending, error, refetch, isRefetching } = useCourses();
  const [form, setForm] = useState<{ open: boolean; course?: Course }>({ open: false });
  const [toDelete, setToDelete] = useState<Course | undefined>();

  const nextExam = (courses ?? []).filter((c) => c.examDate && daysUntil(c.examDate) >= 0).sort((a, b) => daysUntil(a.examDate!) - daysUntil(b.examDate!))[0];
  const docs = (courses ?? []).reduce((n, c) => n + c.documentCount, 0);
  const quizzes = (courses ?? []).reduce((n, c) => n + c.quizCount, 0);
  const openNew = () => setForm({ open: true });

  return (
    <MainLayout>
      <div className="content" style={{ maxWidth: 1200, width: "100%" }}>
        <div className="stack" style={{ gap: 4 }}>
          <h1 className="h1">Chào {user?.displayName}, hôm nay ôn gì?</h1>
          {nextExam?.examDate && (
            <p className="muted">
              Thi môn {nextExam.name}{" "}
              {daysUntil(nextExam.examDate) === 0 ? (
                <b style={{ color: "var(--ink)" }}>hôm nay</b>
              ) : (
                <>
                  còn <b style={{ color: "var(--ink)" }}>{daysUntil(nextExam.examDate)} ngày</b>
                </>
              )}
              .
            </p>
          )}
        </div>

        {courses && courses.length > 0 && (
          <div className="stat-grid">
            <div className="card card-pad">
              <div className="small muted">Môn học</div>
              <div className="stat">{courses.length}</div>
            </div>
            <div className="card card-pad">
              <div className="small muted">Tài liệu</div>
              <div className="stat">{docs}</div>
            </div>
            <div className="card card-pad">
              <div className="small muted">Quiz</div>
              <div className="stat">{quizzes}</div>
            </div>
          </div>
        )}

        <section className="stack" style={{ gap: 12 }} aria-labelledby="courses-title">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <h2 id="courses-title" className="h2">
              Môn học
            </h2>
            {courses && courses.length > 0 && (
              <button className="btn btn-secondary btn-sm" onClick={openNew}>
                <svg className="ic ic-sm" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Môn mới
              </button>
            )}
          </div>

          {isPending && (
            <div className="course-grid" aria-busy="true" aria-label="Đang tải môn học">
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton" />
              ))}
            </div>
          )}

          {error && <ErrorState error={error} message="Không tải được danh sách môn học." onRetry={() => refetch()} retrying={isRefetching} />}

          {courses && courses.length === 0 && (
            <EmptyState
              art="folder"
              title="Chưa có môn học nào"
              message="Tạo môn học đầu tiên, rồi tải slide PDF của môn đó lên để bắt đầu hỏi đáp."
              action={<Button onClick={openNew}>Tạo môn học đầu tiên</Button>}
            />
          )}

          {courses && courses.length > 0 && (
            <div className="course-grid">
              {courses.map((c) => (
                <CourseCard key={c.id} course={c} onEdit={(course) => setForm({ open: true, course })} onDelete={setToDelete} />
              ))}
              <button className="dropzone new-course" onClick={openNew}>
                <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span className="h4">Tạo môn học mới</span>
              </button>
            </div>
          )}
        </section>
      </div>

      <CourseFormModal open={form.open} course={form.course} onClose={() => setForm({ open: false })} />
      <DeleteCourseDialog course={toDelete} onClose={() => setToDelete(undefined)} />
    </MainLayout>
  );
}
