import { Link } from "react-router-dom";
import { coursePath } from "src/constants/paths";
import { formatDayMonth } from "src/helpers/date";

interface Props {
  course: Course;
  onEdit: (c: Course) => void;
  onDelete: (c: Course) => void;
}

const ICON = {
  edit: "M4 20h4L19 9l-4-4L4 16zM13 7l4 4",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
};

const Icon = ({ d }: { d: string }) => (
  <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
    <path d={d} />
  </svg>
);

export default function CourseCard({ course, onEdit, onDelete }: Props) {
  const sub = [course.code, course.term].filter(Boolean).join(" · ");
  return (
    <article className="card card-pad course-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <h3 className="h3">
            <Link to={coursePath(course.id)} className="course-link">
              {course.name}
            </Link>
          </h3>
          {sub && <div className="small muted">{sub}</div>}
        </div>
        {course.examDate && <span className="badge badge-mute">Thi {formatDayMonth(course.examDate)}</span>}
      </div>
      <div className="small muted">
        {course.documentCount} tài liệu · {course.quizCount} quiz
      </div>
      <div className="card-actions">
        <button className="btn btn-ghost btn-sm" onClick={() => onEdit(course)} aria-label={`Sửa môn ${course.name}`}>
          <Icon d={ICON.edit} />
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => onDelete(course)} aria-label={`Xóa môn ${course.name}`}>
          <Icon d={ICON.trash} />
        </button>
      </div>
    </article>
  );
}
