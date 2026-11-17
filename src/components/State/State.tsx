import type { ReactNode } from "react";
import Button from "src/components/Button/Button";
import Icon from "src/components/Icon/Icon";
import { describeError } from "src/helpers/errors";

type Illustration = "folder" | "doc" | "chat" | "quiz" | "search";

/** Hình minh họa nhỏ cho trạng thái trống, vẽ bằng màu token để đổi theo giao diện sáng/tối. */
function Art({ name }: { name: Illustration }) {
  const common = { viewBox: "0 0 200 130", width: 180, "aria-hidden": true, focusable: false } as const;
  const paper = { fill: "var(--surface)", stroke: "var(--border-strong)", strokeWidth: 1.5 };
  switch (name) {
    case "folder":
      return (
        <svg {...common}>
          <path d="M30 30a8 8 0 0 1 8-8h40l12 14h72a8 8 0 0 1 8 8v62a8 8 0 0 1-8 8H38a8 8 0 0 1-8-8z" {...paper} />
          <path d="M30 52h140v48a8 8 0 0 1-8 8H38a8 8 0 0 1-8-8z" fill="var(--primary-soft)" />
          <circle cx="100" cy="80" r="16" fill="var(--primary)" />
          <path d="M100 72v16M92 80h16" stroke="var(--on-primary)" strokeWidth="3" strokeLinecap="round" />
          <rect x="128" y="60" width="26" height="7" rx="3.5" fill="var(--hl)" />
        </svg>
      );
    case "doc":
      return (
        <svg {...common}>
          <rect x="62" y="14" width="76" height="102" rx="8" {...paper} />
          <rect x="74" y="34" width="52" height="6" rx="3" fill="var(--border-strong)" />
          <rect x="74" y="48" width="40" height="6" rx="3" fill="var(--border)" />
          <rect x="74" y="62" width="48" height="6" rx="3" fill="var(--hl)" />
          <rect x="74" y="76" width="34" height="6" rx="3" fill="var(--border)" />
          <circle cx="132" cy="102" r="14" fill="var(--primary)" />
          <path d="M126 102l4 4 8-9" stroke="var(--on-primary)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "chat":
      return (
        <svg {...common}>
          <rect x="30" y="22" width="92" height="40" rx="12" fill="var(--primary-soft)" />
          <rect x="44" y="36" width="54" height="6" rx="3" fill="var(--primary)" opacity=".5" />
          <rect x="78" y="70" width="92" height="40" rx="12" {...paper} />
          <rect x="92" y="84" width="58" height="6" rx="3" fill="var(--border-strong)" />
          <rect x="92" y="96" width="30" height="6" rx="3" fill="var(--hl)" />
        </svg>
      );
    case "quiz":
      return (
        <svg {...common}>
          <rect x="44" y="18" width="112" height="94" rx="10" {...paper} />
          <circle cx="68" cy="46" r="8" fill="var(--primary)" />
          <path d="M64.5 46l2.5 2.5 5-5.5" stroke="var(--on-primary)" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="84" y="43" width="58" height="6" rx="3" fill="var(--border-strong)" />
          <circle cx="68" cy="72" r="8" fill="none" stroke="var(--border-strong)" strokeWidth="2" />
          <rect x="84" y="69" width="46" height="6" rx="3" fill="var(--border)" />
          <circle cx="68" cy="96" r="8" fill="none" stroke="var(--border-strong)" strokeWidth="2" />
          <rect x="84" y="93" width="52" height="6" rx="3" fill="var(--hl)" />
        </svg>
      );
    case "search":
      return (
        <svg {...common}>
          <rect x="40" y="22" width="92" height="86" rx="10" {...paper} />
          <rect x="54" y="40" width="50" height="6" rx="3" fill="var(--border-strong)" />
          <rect x="54" y="54" width="64" height="6" rx="3" fill="var(--border)" />
          <rect x="54" y="68" width="40" height="6" rx="3" fill="var(--border)" />
          <circle cx="132" cy="84" r="20" fill="var(--primary-soft)" stroke="var(--primary)" strokeWidth="4" />
          <path d="M147 99l16 16" stroke="var(--primary)" strokeWidth="6" strokeLinecap="round" />
        </svg>
      );
  }
}

interface EmptyProps {
  art?: Illustration;
  title: string;
  message?: ReactNode;
  /** Nút hoặc liên kết hành động chính */
  action?: ReactNode;
  /** Khung gọn, không viền màu, dùng bên trong một vùng đã có khung */
  compact?: boolean;
}

/** Trạng thái trống: chưa có dữ liệu hoặc không có kết quả tìm kiếm. Luôn kèm câu hướng dẫn bước tiếp theo. */
export function EmptyState({ art = "folder", title, message, action, compact }: EmptyProps) {
  return (
    <div className={"state state-empty" + (compact ? " state-compact" : " card")}>
      <Art name={art} />
      <h3 className="h3">{title}</h3>
      {message && <p className="muted state-msg">{message}</p>}
      {action && <div className="state-actions">{action}</div>}
    </div>
  );
}

interface ErrorProps {
  /** Lỗi gốc; quyết định icon/tiêu đề (mất mạng, không tìm thấy, máy chủ...) */
  error?: unknown;
  /** Câu mô tả theo ngữ cảnh, ví dụ "Không tải được danh sách môn học." */
  message?: string;
  title?: string;
  onRetry?: () => void;
  retrying?: boolean;
  /** Hành động phụ (ví dụ liên kết "Về tổng quan") */
  children?: ReactNode;
  compact?: boolean;
}

/** Trạng thái lỗi: icon theo loại lỗi, tiêu đề ngắn, giải thích, nút Thử lại có trạng thái đang xử lý. */
export function ErrorState({ error, message, title, onRetry, retrying, children, compact }: ErrorProps) {
  const info = describeError(error, message ?? "Có lỗi xảy ra, hãy thử lại.");
  // Dòng chính nêu việc đang làm dở (theo ngữ cảnh màn hình); dòng phụ là lời khuyên chuẩn cho lỗi mất mạng/máy chủ.
  const advice = message && (info.kind === "offline" || info.kind === "server") ? info.message : null;
  const text = message ?? info.message;
  return (
    <div className={"state state-error" + (compact ? " state-compact" : " card")} role="alert">
      <span className={`state-icon state-icon-${info.kind}`}>
        <Icon name={info.icon} size={28} />
      </span>
      <h3 className="h3">{title ?? info.title}</h3>
      <p className="muted state-msg">{text}</p>
      {advice && <p className="small muted state-msg">{advice}</p>}
      {(onRetry || children) && (
        <div className="state-actions">
          {onRetry && (
            <Button variant="secondary" onClick={onRetry} loading={retrying ?? false}>
              <Icon name="refresh" size={16} />
              Thử lại
            </Button>
          )}
          {children}
        </div>
      )}
    </div>
  );
}
