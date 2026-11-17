import type { ReactNode } from "react";
import Feedback from "./Feedback";

interface Props {
  conversationId: string;
  message: ChatMessage;
  /** Khóa nguồn đang được mở trên PDF: `${messageId}:${n}` */
  activeKey: string | null;
  onOpenSource: (s: MessageSource, key: string) => void;
}

/** Biến "[n]" trong câu trả lời thành nút bấm mở đúng trang nguồn; số nguồn không tồn tại thì giữ nguyên chữ. */
function withCitations(content: string, m: ChatMessage, activeKey: string | null, onOpen: Props["onOpenSource"]): ReactNode[] {
  return content.split(/(\[\d+\])/g).map((part, i) => {
    const n = /^\[(\d+)\]$/.exec(part)?.[1];
    const src = n ? m.sources.find((s) => s.n === Number(n)) : undefined;
    if (!src || src.documentDeleted) return part;
    const key = `${m.id}:${src.n}`;
    return (
      <button
        key={i}
        type="button"
        className={"cite" + (activeKey === key ? " active" : "")}
        onClick={() => onOpen(src, key)}
        aria-label={`Nguồn ${src.n}: ${src.documentName}, trang ${src.page}`}
      >
        {src.n}
      </button>
    );
  });
}

export default function MessageBubble({ conversationId, message: m, activeKey, onOpenSource }: Props) {
  if (m.role === "user") return <div className="bubble-user">{m.content}</div>;
  return (
    <div className="bubble-ai">
      {m.searchQuery && (
        <div className="tiny muted" style={{ marginBottom: 8 }}>
          Đã hiểu câu hỏi là: <i>{m.searchQuery}</i>
        </div>
      )}
      <p style={{ whiteSpace: "pre-wrap" }}>{withCitations(m.content, m, activeKey, onOpenSource)}</p>
      {m.sources.length > 0 && (
        <div className="chips">
          {m.sources.map((s) => {
            const key = `${m.id}:${s.n}`;
            return s.documentDeleted ? (
              <span key={key} className="chip" style={{ cursor: "default", opacity: 0.7 }} title="Tài liệu đã bị xóa">
                <b>{s.n}</b>
                {s.documentName} · tr.{s.page} · đã xóa
              </span>
            ) : (
              <button
                key={key}
                type="button"
                className="chip"
                style={activeKey === key ? { borderColor: "var(--primary)", background: "var(--primary-soft)" } : undefined}
                aria-pressed={activeKey === key}
                onClick={() => onOpenSource(s, key)}
              >
                <b>{s.n}</b>
                {s.documentName} · tr.{s.page}
              </button>
            );
          })}
        </div>
      )}
      <div className="tiny muted" style={{ marginTop: 10 }}>
        {m.mode === "llm" && "Do AI tạo. Hãy kiểm tra lại ở trang nguồn."}
        {m.mode === "extractive" && "Chưa qua AI: đây là các đoạn gốc liên quan nhất. Bấm nguồn để xem đúng trang."}
        {m.mode === "no-match" && "Không gọi AI vì không tìm thấy đoạn nào đủ liên quan."}
      </div>
      <Feedback conversationId={conversationId} message={m} />
    </div>
  );
}
