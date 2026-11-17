import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { setFeedback } from "src/apis/conversations.api";
import { useCreateFlashcard } from "src/hooks/useFlashcards";
import { errorMessage } from "src/helpers/errors";
import { toast } from "src/helpers/toast";

type Value = 1 | -1 | null;

/** Đánh giá câu trả lời hữu ích hay chưa tốt (FR-ASK-08); bấm lại nút đang chọn để bỏ đánh giá. */
export default function Feedback({ conversationId, message, question }: { conversationId: string; message: ChatMessage; question?: string | undefined }) {
  const card = useCreateFlashcard();
  const src = message.sources.find((s) => !s.documentDeleted);
  async function saveCard() {
    if (!question) return;
    try {
      await card.mutateAsync({
        front: question.slice(0, 500),
        back: message.content.slice(0, 2000),
        ...(src ? { page: src.page, ...(src.documentId ? { documentId: src.documentId } : {}) } : {}),
      });
      toast.success("Đã lưu thành thẻ ghi nhớ.");
    } catch (e) {
      toast.error(errorMessage(e, "Không lưu được thẻ, hãy thử lại."));
    }
  }
  const [value, setValue] = useState<Value>(message.feedback === 1 || message.feedback === -1 ? message.feedback : null);
  const save = useMutation({
    mutationFn: (v: Value) => setFeedback(conversationId, message.id, v),
    onSuccess: (r) => setValue(r.feedback),
    onError: (e) => toast.error(errorMessage(e, "Không lưu được đánh giá, hãy thử lại.")),
  });
  const toggle = (v: 1 | -1) => save.mutate(value === v ? null : v);

  return (
    <div role="group" aria-label="Đánh giá câu trả lời" style={{ display: "flex", gap: 8, marginTop: 8 }}>
      <button type="button" className="btn btn-ghost btn-sm" aria-pressed={value === 1} disabled={save.isPending} onClick={() => toggle(1)}>
        <span aria-hidden="true">👍</span> Hữu ích
      </button>
      <button type="button" className="btn btn-ghost btn-sm" aria-pressed={value === -1} disabled={save.isPending} onClick={() => toggle(-1)}>
        <span aria-hidden="true">👎</span> Chưa tốt
      </button>
      {question && message.mode !== "no-match" && (
        <button type="button" className="btn btn-ghost btn-sm" disabled={card.isPending} onClick={saveCard}>
          Lưu thành thẻ
        </button>
      )}
    </div>
  );
}
