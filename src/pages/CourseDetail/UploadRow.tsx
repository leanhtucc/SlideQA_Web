import type { UploadItem } from "src/hooks/useUploads";
import { formatBytes } from "src/helpers/format";

interface Props {
  item: UploadItem;
  onRetry: (id: string) => void;
  onCancel: (id: string) => void;
}

/** Một tệp đang chờ/đang tải lên/bị lỗi, có thanh tiến độ riêng (WEB-01). */
export default function UploadRow({ item, onRetry, onCancel }: Props) {
  const pct = Math.round(item.progress * 100);
  const status = item.status === "queued" ? "Đang chờ tới lượt" : item.status === "uploading" ? `Đang tải lên · ${pct}%` : null;
  return (
    <div className="doc-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <svg className="ic" viewBox="0 0 24 24" aria-hidden="true" style={{ color: "var(--muted)" }}>
          <path d="M6 3h8l4 4v14H6zM14 3v5h5" />
        </svg>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div className="h4 doc-name">{item.file.name}</div>
          <div className="small muted">
            {formatBytes(item.file.size)}
            {status && <> · {status}</>}
          </div>
        </div>
        {item.status === "error" && item.retryable && (
          <button className="btn btn-secondary btn-sm" onClick={() => onRetry(item.id)}>
            Thử lại
          </button>
        )}
        <button className="btn btn-ghost btn-sm" onClick={() => onCancel(item.id)} aria-label={`${item.status === "error" ? "Bỏ qua" : "Hủy tải"} ${item.file.name}`}>
          {item.status === "error" ? "Bỏ qua" : "Hủy"}
        </button>
      </div>
      {item.status === "uploading" && (
        <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Tiến độ tải lên ${item.file.name}`}>
          <i style={{ width: `${pct}%` }} />
        </div>
      )}
      {item.status === "error" && (
        <div className="alert alert-err" role="alert">
          <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 8v5M12 16h.01" />
          </svg>
          <div>{item.error}</div>
        </div>
      )}
    </div>
  );
}
