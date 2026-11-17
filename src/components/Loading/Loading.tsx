import { LogoMark } from "src/components/Logo/Logo";
import Spinner from "src/components/Spinner/Spinner";

/** Màn hình chờ toàn trang (khôi phục phiên, tải trang lazy): logo + vòng quay, đọc được bằng trình đọc màn hình. */
export default function Loading({ label = "Đang tải…" }: { label?: string }) {
  return (
    <div className="center-screen">
      <div className="loading-screen" role="status" aria-busy="true">
        <LogoMark size={44} />
        <Spinner size={22} />
        <p className="muted small">{label}</p>
      </div>
    </div>
  );
}

/** Vùng chờ trong trang: khối xám nhấp nháy giữ chỗ cho danh sách, để bố cục không nhảy khi dữ liệu về. */
export function SkeletonList({ rows = 3, label = "Đang tải" }: { rows?: number; label?: string }) {
  return (
    <div className="card skeleton-list" role="status" aria-busy="true" aria-label={label}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton-row">
          <span className="skeleton skeleton-dot" />
          <span className="skeleton-lines">
            <span className="skeleton skeleton-line" style={{ width: `${60 - i * 8}%` }} />
            <span className="skeleton skeleton-line short" />
          </span>
        </div>
      ))}
    </div>
  );
}
