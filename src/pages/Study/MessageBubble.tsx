import type { ReactNode } from "react";
import { toast } from "src/helpers/toast";
import Feedback from "./Feedback";

/** Chép nguồn dạng chữ để dán vào bài làm: "[1] Slide BPMN.pdf, trang 3". */
async function copyCitations(m: ChatMessage) {
  const text = m.sources.map((s) => `[${s.n}] ${s.documentName}, trang ${s.page}`).join("\n");
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Đã chép trích dẫn.");
  } catch {
    toast.error("Không chép được, hãy chọn và chép thủ công.");
  }
}

interface Props {
  conversationId: string;
  /** Câu hỏi của người học ngay trước câu trả lời này (làm mặt trước của thẻ) */
  question?: string | undefined;
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

export default function MessageBubble({ conversationId, question, message: m, activeKey, onOpenSource }: Props) {
  if (m.role === "user") return <div className="bubble-user">{m.content}</div>;
  // Câu trả lời của AI chỉ hiện các nguồn nó thực sự trích dẫn; khi AI từ chối (không trích nguồn nào) thì không hiện nguồn nào.
  const cited = new Set([...m.content.matchAll(/\[(\d+)\]/g)].map((x) => Number(x[1])));
  const sources = m.mode === "llm" ? m.sources.filter((s) => cited.has(s.n)) : m.sources;
  return (
    <div className="bubble-ai">
      {m.searchQuery && (
        <div className="tiny muted" style={{ marginBottom: 8 }}>
          Đã hiểu câu hỏi là: <i>{m.searchQuery}</i>
        </div>
      )}
      <p style={{ whiteSpace: "pre-wrap" }}>{withCitations(m.content, m, activeKey, onOpenSource)}</p>
      {sources.length > 0 && (
        <div className="chips">
          {sources.map((s) => {
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
          <button type="button" className="chip" onClick={() => copyCitations({ ...m, sources })}>
            Chép trích dẫn
          </button>
        </div>
      )}
      <div className="tiny muted" style={{ marginTop: 10 }}>
        {m.mode === "llm" && "Do AI tạo. Hãy kiểm tra lại ở trang nguồn."}
        {m.mode === "extractive" && "Chưa qua AI: đây là các đoạn gốc liên quan nhất. Bấm nguồn để xem đúng trang."}
        {m.mode === "no-match" && "Không gọi AI vì không tìm thấy đoạn nào đủ liên quan."}
      </div>
      <Feedback conversationId={conversationId} message={m} question={question} />
    </div>
  );
}
