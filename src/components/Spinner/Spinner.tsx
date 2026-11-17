/** Vòng quay tải dữ liệu. Mặc định chỉ trang trí (aria-hidden); truyền `label` khi nó đứng một mình để trình đọc màn hình đọc được. */
export default function Spinner({ size = 20, label }: { size?: number; label?: string }) {
  return (
    <span className="spinner" style={{ width: size, height: size }} {...(label ? { role: "status", "aria-label": label } : { "aria-hidden": true })}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" strokeWidth="3" strokeLinecap="round">
        <circle cx="12" cy="12" r="9" className="spinner-track" />
        <path d="M21 12a9 9 0 0 0-9-9" className="spinner-arc" />
      </svg>
    </span>
  );
}
