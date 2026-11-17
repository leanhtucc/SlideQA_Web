/**
 * Kho thông báo nổi (toast), gọi được từ bất cứ đâu, kể cả ngoài React: `toast.success("Đã lưu")`.
 * Component <Toaster /> đăng ký vào kho này và vẽ ra.
 */
export type ToastKind = "success" | "error" | "info";

export interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
  /** Mili giây tự đóng; 0 = không tự đóng */
  duration: number;
  action?: { label: string; onClick: () => void };
}

interface Options {
  duration?: number;
  action?: ToastItem["action"];
}

const MAX_VISIBLE = 3;
const DEFAULT_MS: Record<ToastKind, number> = { success: 4000, info: 5000, error: 8000 };

let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function push(kind: ToastKind, message: string, opts: Options = {}) {
  // Cùng nội dung đang hiện thì không chồng thêm (ví dụ bấm lỗi liên tiếp).
  if (items.some((t) => t.kind === kind && t.message === message)) return;
  const item: ToastItem = { id: nextId++, kind, message, duration: opts.duration ?? DEFAULT_MS[kind], ...(opts.action ? { action: opts.action } : {}) };
  items = [...items, item].slice(-MAX_VISIBLE);
  emit();
}

export const toast = {
  success: (message: string, opts?: Options) => push("success", message, opts),
  error: (message: string, opts?: Options) => push("error", message, opts),
  info: (message: string, opts?: Options) => push("info", message, opts),
  dismiss(id: number) {
    items = items.filter((t) => t.id !== id);
    emit();
  },
  clear() {
    items = [];
    emit();
  },
};

export const toastStore = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => void listeners.delete(l);
  },
  getSnapshot: () => items,
};
