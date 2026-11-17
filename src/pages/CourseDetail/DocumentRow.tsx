import Alert from "src/components/Alert/Alert";
import Button from "src/components/Button/Button";
import { formatBytes, formatDayMonthFromIso } from "src/helpers/format";

interface Props {
  doc: CourseDocument;
  retrying: boolean;
  onRename: (d: CourseDocument) => void;
  onDelete: (d: CourseDocument) => void;
  onRetry: (d: CourseDocument) => void;
  /** Mở không gian học chỉ với tài liệu này */
  onOpen: (d: CourseDocument) => void;
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

/** Một tài liệu trong danh sách: trạng thái xử lý, cảnh báo trang trống, đổi tên, xóa, thử lại (FR-DOC-03..05). */
export default function DocumentRow({ doc, retrying, onRename, onDelete, onRetry, onOpen }: Props) {
  const meta = [doc.status === "ready" && doc.pages > 0 ? `${doc.pages} trang` : null, formatBytes(doc.sizeBytes), `tải ngày ${formatDayMonthFromIso(doc.createdAt)}`]
    .filter(Boolean)
    .join(" · ");
  return (
    <li className="doc-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <svg className="ic" viewBox="0 0 24 24" aria-hidden="true" style={{ color: "var(--muted)" }}>
          <path d="M6 3h8l4 4v14H6zM14 3v5h5" />
        </svg>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div className="h4 doc-name">{doc.name}</div>
          <div className="small muted">{meta}</div>
        </div>

        {doc.status === "processing" && (
          <span className="badge badge-info">
            <span className="dot" />
            Đang xử lý
          </span>
        )}
        {doc.status === "ready" && (
          <span className="badge badge-ok">
            <svg className="ic ic-sm" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12l5 5 9-10" />
            </svg>
            Sẵn sàng
          </span>
        )}
        {doc.status === "failed" && <span className="badge badge-err">Lỗi</span>}
        {doc.status === "ready" && doc.emptyPages > 0 && <span className="badge badge-warn">{doc.emptyPages} trang trống</span>}

        {doc.status === "ready" && (
          <button className="btn btn-secondary btn-sm" onClick={() => onOpen(doc)} aria-label={`Mở ${doc.name} để hỏi đáp`}>
            Mở
          </button>
        )}
        {doc.status === "failed" && (
          <Button variant="secondary" size="sm" loading={retrying} loadingText="Đang thử lại…" onClick={() => onRetry(doc)}>
            Thử lại
          </Button>
        )}
        <button className="btn btn-ghost btn-sm" onClick={() => onRename(doc)} aria-label={`Đổi tên ${doc.name}`}>
          <Icon d={ICON.edit} />
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => onDelete(doc)} aria-label={`Xóa ${doc.name}`}>
          <Icon d={ICON.trash} />
        </button>
      </div>
      {doc.status === "ready" && doc.warning && <Alert kind="warn">{doc.warning}</Alert>}
      {doc.status === "failed" && <Alert>{doc.error ?? "Không xử lý được tài liệu này."} Chọn Thử lại hoặc Xóa.</Alert>}
    </li>
  );
}
