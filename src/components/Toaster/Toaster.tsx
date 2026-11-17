import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Icon, { type IconName } from "src/components/Icon/Icon";
import { toast, toastStore, type ToastItem } from "src/helpers/toast";

// Trình duyệt cũ chưa có popover: toast vẫn hiện bình thường (position: fixed), chỉ có thể nằm dưới hộp thoại đang mở.
const SUPPORTS_POPOVER = typeof HTMLElement !== "undefined" && "showPopover" in HTMLElement.prototype;

const ICON: Record<ToastItem["kind"], IconName> = { success: "check", error: "alert", info: "info" };

/**
 * Nơi vẽ các toast. Dùng popover của trình duyệt (lớp trên cùng) để toast luôn nổi trên cả hộp thoại <dialog> đang mở.
 * Lỗi dùng role="alert" (đọc ngay), còn lại role="status" (đọc khi rảnh).
 */
export default function Toaster() {
  const items = useSyncExternalStore(toastStore.subscribe, toastStore.getSnapshot);
  const host = useRef<HTMLDivElement>(null);
  const last = items[items.length - 1]?.id;

  useEffect(() => {
    const el = host.current;
    if (!el?.showPopover) return;
    // Mở lại mỗi khi có toast mới để nó nằm trên các hộp thoại vừa mở sau.
    if (el.matches(":popover-open")) el.hidePopover();
    if (items.length > 0) el.showPopover();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [last, items.length === 0]);

  return (
    <div ref={host} className="toaster" popover={SUPPORTS_POPOVER ? "manual" : undefined} aria-label="Thông báo">
      {items.map((t) => (
        <ToastView key={t.id} item={t} />
      ))}
    </div>
  );
}

function ToastView({ item }: { item: ToastItem }) {
  const [paused, setPaused] = useState(false);
  // Tạm dừng đếm giờ khi rê chuột hoặc focus vào toast để người dùng kịp đọc hay bấm.
  useEffect(() => {
    if (paused || item.duration === 0) return;
    const t = setTimeout(() => toast.dismiss(item.id), item.duration);
    return () => clearTimeout(t);
  }, [paused, item.id, item.duration]);

  return (
    <div
      className={`toast toast-${item.kind}`}
      role={item.kind === "error" ? "alert" : "status"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <Icon name={ICON[item.kind]} className="ic toast-ic" />
      <span className="toast-msg">{item.message}</span>
      {item.action && (
        <button
          type="button"
          className="toast-action"
          onClick={() => {
            item.action?.onClick();
            toast.dismiss(item.id);
          }}
        >
          {item.action.label}
        </button>
      )}
      <button type="button" className="toast-close" aria-label="Đóng thông báo" onClick={() => toast.dismiss(item.id)}>
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}
