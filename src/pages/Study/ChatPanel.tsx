import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ApiError } from "src/apis/client";
import { askQuestion } from "src/apis/conversations.api";
import Alert from "src/components/Alert/Alert";
import { useAuth } from "src/hooks/useAuth";
import ConsentDialog from "./ConsentDialog";
import MessageBubble from "./MessageBubble";

interface Props {
  conversation: ConversationDetail;
  activeKey: string | null;
  onOpenSource: (s: MessageSource, key: string) => void;
}

const MAX_QUESTION = 2000;

/** Cột hội thoại: danh sách tin nhắn, ô nhập, đồng ý gửi dữ liệu cho AI, lỗi mạng không làm mất câu đang soạn (WEB-07). */
export default function ChatPanel({ conversation, activeKey, onOpenSource }: Props) {
  const qc = useQueryClient();
  const { user, llmDeclined, setLlmConsent } = useAuth();
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [consentFor, setConsentFor] = useState<string | null>(null);
  const [consentBusy, setConsentBusy] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView?.({ block: "end" });
  }, [conversation.messages.length, pending]);

  async function send(question: string) {
    setError(null);
    setPending(question);
    setDraft("");
    try {
      await askQuestion(conversation.id, question);
      await qc.invalidateQueries({ queryKey: ["conversation", conversation.id] });
    } catch (e) {
      setDraft(question); // trả lại câu đang soạn để gửi lại
      setError(e instanceof ApiError ? e.message : "Không gửi được câu hỏi, hãy thử lại.");
    } finally {
      setPending(null);
    }
  }

  function submit() {
    const q = draft.trim();
    if (!q || pending) return;
    // Chưa từng đồng ý và chưa từ chối trong phiên này: hỏi trước khi gửi bất cứ đoạn tài liệu nào (FR-SET-01).
    if (!user?.llmConsentAt && !llmDeclined) return setConsentFor(q);
    void send(q);
  }

  async function choose(granted: boolean) {
    const q = consentFor;
    if (!q) return;
    setConsentBusy(true);
    try {
      await setLlmConsent(granted);
      setConsentFor(null);
      void send(q);
    } catch (e) {
      setConsentFor(null);
      setError(e instanceof ApiError ? e.message : "Không lưu được lựa chọn, hãy thử lại.");
    } finally {
      setConsentBusy(false);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter gửi, Shift+Enter xuống dòng; đang gõ tiếng Việt bằng bộ gõ (composing) thì không gửi.
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  }

  const empty = conversation.messages.length === 0 && !pending;

  return (
    <section className="chat" aria-label="Hội thoại">
      <div className="chat-messages" role="log" aria-live="polite">
        {empty && (
          <Alert kind="info">
            Hỏi về nội dung slide, bằng tiếng Việt có dấu hay không dấu. Câu trả lời chỉ dựa trên tài liệu trong phạm vi bạn chọn; bấm số nguồn <span className="cite">1</span> để
            xem đúng trang.
          </Alert>
        )}
        {conversation.messages.map((m) => (
          <MessageBubble key={m.id} message={m} activeKey={activeKey} onOpenSource={onOpenSource} />
        ))}
        {pending && (
          <>
            <div className="bubble-user">{pending}</div>
            <div className="muted small" role="status">
              <span className="dot" style={{ color: "var(--primary)" }} /> Đang tìm trong tài liệu…
            </div>
          </>
        )}
        <div ref={bottom} />
      </div>

      <form
        className="chat-composer"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        {error && <Alert>{error}</Alert>}
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <label htmlFor="question" className="visually-hidden">
            Câu hỏi
          </label>
          <textarea
            id="question"
            className="input"
            rows={2}
            maxLength={MAX_QUESTION}
            placeholder="Hỏi về nội dung slide… (Enter gửi, Shift+Enter xuống dòng)"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={!!pending}
            style={{ minHeight: 64, padding: "12px 14px", resize: "none", lineHeight: 1.5 }}
          />
          <button type="submit" className="btn btn-primary btn-icon" aria-label="Gửi câu hỏi" disabled={!draft.trim() || !!pending} style={{ width: 52, minHeight: 52 }}>
            <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />
            </svg>
          </button>
        </div>
        <div className="tiny muted">Gõ có dấu hoặc không dấu đều được. Đoạn liên quan được gửi tới nhà cung cấp AI nếu bạn đã đồng ý.</div>
      </form>

      <ConsentDialog open={consentFor !== null} onClose={() => setConsentFor(null)} onChoose={choose} busy={consentBusy} />
    </section>
  );
}
