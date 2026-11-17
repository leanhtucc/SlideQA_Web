/** Màn hình chờ toàn trang (khôi phục phiên, tải trang lazy). */
export default function Loading() {
  return (
    <div className="center-screen">
      <p className="muted" role="status" aria-busy="true">
        Đang tải…
      </p>
    </div>
  );
}
