import type { ButtonHTMLAttributes, ReactNode } from "react";
import Spinner from "src/components/Spinner/Spinner";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "md" | "sm";
  block?: boolean;
  /** Đang xử lý: khóa nút, hiện vòng quay, giữ nguyên nhãn để nút không đổi kích thước */
  loading?: boolean;
  /** Nhãn thay thế khi đang xử lý (ví dụ "Đang lưu…") */
  loadingText?: ReactNode;
}

/** Nút chuẩn của ứng dụng: các biến thể theo token thiết kế, trạng thái đang xử lý nhất quán. */
export default function Button({ variant = "primary", size = "md", block, loading, loadingText, className, disabled, children, type = "button", ...rest }: Props) {
  const cls = ["btn", `btn-${variant}`, size === "sm" && "btn-sm", block && "btn-block", loading && "is-loading", className].filter(Boolean).join(" ");
  return (
    <button type={type} className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading && <Spinner size={size === "sm" ? 14 : 18} />}
      {loading && loadingText ? loadingText : children}
    </button>
  );
}
