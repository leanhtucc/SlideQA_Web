import { useEffect, useId, useRef, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** alertdialog cho hộp xác nhận thao tác nguy hiểm */
  role?: "dialog" | "alertdialog";
  children: ReactNode;
}

/**
 * Hộp thoại dùng thẻ <dialog> gốc: trình duyệt lo sẵn việc giữ focus bên trong, đóng bằng Esc và trả focus về nút đã mở.
 * Nội dung chỉ được dựng khi mở, nên form luôn bắt đầu sạch mỗi lần mở.
 */
export default function Modal({ open, onClose, title, role = "dialog", children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="modal-dialog"
      role={role}
      aria-labelledby={titleId}
      onClose={onClose}
      // Bấm ra vùng nền tối (chính thẻ dialog) thì đóng.
      onClick={(e) => e.target === ref.current && onClose()}
    >
      {open && (
        <div className="modal stack" style={{ gap: 16 }}>
          <h2 id={titleId} className="h3">
            {title}
          </h2>
          {children}
        </div>
      )}
    </dialog>
  );
}
