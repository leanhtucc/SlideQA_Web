import { useState, type FormEvent } from "react";
import { ApiError } from "src/apis/client";
import Alert from "src/components/Alert/Alert";
import Button from "src/components/Button/Button";
import { SkeletonList } from "src/components/Loading/Loading";
import Modal from "src/components/Modal/Modal";
import { EmptyState, ErrorState } from "src/components/State/State";
import { errorMessage } from "src/helpers/errors";
import { formatDayMonthFromIso } from "src/helpers/format";
import { toast } from "src/helpers/toast";
import { useCreateFlashcard, useDeleteFlashcard, useFlashcards, useReviewFlashcard } from "src/hooks/useFlashcards";
import MainLayout from "src/layouts/MainLayout";

const isDue = (c: Flashcard) => new Date(c.dueAt).getTime() <= Date.now();

/** Thẻ ghi nhớ (WEB-S07): ôn các thẻ đến hạn, tự đánh giá nhớ hoặc quên; nhớ thì lần sau thưa dần 1→3→7→14 ngày (FR-FC-02). */
export default function Flashcards() {
  const list = useFlashcards();
  const [reviewing, setReviewing] = useState<Flashcard[] | null>(null);
  const [adding, setAdding] = useState(false);
  const cards = list.data ?? [];
  const due = cards.filter(isDue);

  return (
    <MainLayout>
      <div className="content" style={{ maxWidth: 900, width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h1 className="h1">Thẻ ghi nhớ</h1>
          <button className="btn btn-secondary" onClick={() => setAdding(true)}>
            Thêm thẻ
          </button>
        </div>
        {list.isPending && <SkeletonList rows={3} label="Đang tải thẻ" />}
        {list.error && <ErrorState error={list.error} message="Không tải được thẻ ghi nhớ." onRetry={() => list.refetch()} retrying={list.isRefetching} />}
        {list.data && reviewing && (
          <Review
            cards={reviewing}
            onDone={() => {
              setReviewing(null);
              void list.refetch();
            }}
          />
        )}
        {list.data && !reviewing && (
          <>
            <div className="card card-pad" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div className="small muted">Cần ôn hôm nay</div>
                <div className="stat">{due.length}</div>
              </div>
              <Button disabled={due.length === 0} onClick={() => setReviewing(due)}>
                {due.length === 0 ? "Hôm nay không còn thẻ cần ôn" : "Bắt đầu ôn"}
              </Button>
            </div>
            {cards.length === 0 ? (
              <EmptyState art="quiz" title="Chưa có thẻ nào" message="Tạo thẻ từ các câu quiz làm sai, từ câu trả lời của trợ lý, hoặc bấm Thêm thẻ." />
            ) : (
              <CardList cards={cards} />
            )}
          </>
        )}
      </div>
      <Modal open={adding} onClose={() => setAdding(false)} title="Thêm thẻ">
        <AddForm onClose={() => setAdding(false)} />
      </Modal>
    </MainLayout>
  );
}

function Review({ cards, onDone }: { cards: Flashcard[]; onDone: () => void }) {
  const review = useReviewFlashcard();
  const [idx, setIdx] = useState(0);
  const [shown, setShown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const card = cards[idx];

  if (!card) {
    return (
      <div className="card card-pad stack" role="status" style={{ gap: 12 }}>
        <h2 className="h2">Xong rồi!</h2>
        <p className="muted">Bạn đã ôn hết {cards.length} thẻ hôm nay. Thẻ nhớ sẽ quay lại thưa dần, thẻ quên quay lại sau 1 ngày.</p>
        <Button onClick={onDone} style={{ alignSelf: "flex-start" }}>
          Về danh sách thẻ
        </Button>
      </div>
    );
  }

  async function rate(result: "remember" | "forgot") {
    if (!card) return;
    setError(null);
    try {
      await review.mutateAsync({ id: card.id, result });
      setShown(false);
      setIdx(idx + 1);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Không lưu được kết quả, hãy thử lại.");
    }
  }

  return (
    <section className="card card-pad stack" aria-label="Ôn thẻ" style={{ gap: 16 }}>
      <div className="small muted" aria-live="polite">
        Thẻ {idx + 1} / {cards.length}
      </div>
      <h2 className="h2" style={{ whiteSpace: "pre-wrap" }}>
        {card.front}
      </h2>
      {error && <Alert>{error}</Alert>}
      {!shown ? (
        <button className="btn btn-primary" style={{ alignSelf: "flex-start" }} onClick={() => setShown(true)}>
          Xem đáp án
        </button>
      ) : (
        <>
          <div role="status">
            <Alert kind="info">
              <span style={{ whiteSpace: "pre-wrap" }}>{card.back}</span>
              {card.page !== null && <span className="muted"> (slide trang {card.page})</span>}
            </Alert>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button variant="secondary" disabled={review.isPending} onClick={() => rate("forgot")}>
              Quên
            </Button>
            <Button variant="primary" disabled={review.isPending} onClick={() => rate("remember")}>
              Nhớ
            </Button>
          </div>
        </>
      )}
    </section>
  );
}

function CardList({ cards }: { cards: Flashcard[] }) {
  const del = useDeleteFlashcard();
  async function remove(c: Flashcard) {
    try {
      await del.mutateAsync(c.id);
      toast.success("Đã xóa thẻ.");
    } catch (e) {
      toast.error(errorMessage(e, "Không xóa được thẻ, hãy thử lại."));
    }
  }
  return (
    <ul className="card doc-list">
      {cards.map((c) => (
        <li key={c.id} className="doc-row" style={{ flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div className="h4">{c.front}</div>
            <div className="small muted">
              {isDue(c) ? "Đến hạn ôn" : `Ôn lại ngày ${formatDayMonthFromIso(c.dueAt)}`} · khoảng cách {c.intervalDays} ngày
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" disabled={del.isPending} onClick={() => remove(c)} aria-label={`Xóa thẻ: ${c.front}`}>
            Xóa
          </button>
        </li>
      ))}
    </ul>
  );
}

function AddForm({ onClose }: { onClose: () => void }) {
  const create = useCreateFlashcard();
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!front.trim() || !back.trim()) return setError("Hãy nhập cả mặt trước và mặt sau.");
    try {
      await create.mutateAsync({ front: front.trim(), back: back.trim() });
      toast.success("Đã thêm thẻ.");
      onClose();
    } catch (err) {
      setError(errorMessage(err, "Không thêm được thẻ, hãy thử lại."));
    }
  }

  return (
    <form className="stack" style={{ gap: 14 }} onSubmit={submit} noValidate>
      {error && <Alert>{error}</Alert>}
      <div className="field">
        <label className="label" htmlFor="fc-front">
          Mặt trước (câu hỏi)
        </label>
        <textarea id="fc-front" className="input" rows={2} maxLength={500} value={front} onChange={(e) => setFront(e.target.value)} />
      </div>
      <div className="field">
        <label className="label" htmlFor="fc-back">
          Mặt sau (đáp án)
        </label>
        <textarea id="fc-back" className="input" rows={3} maxLength={2000} value={back} onChange={(e) => setBack(e.target.value)} />
      </div>
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Hủy
        </button>
        <Button variant="primary" type="submit" loading={create.isPending} loadingText="Đang lưu…">
          Thêm thẻ
        </Button>
      </div>
    </form>
  );
}
