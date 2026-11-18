import { useEffect, useState, type FormEvent } from "react";
import { ApiError } from "src/apis/client";
import Alert from "src/components/Alert/Alert";
import Button from "src/components/Button/Button";
import FlipCard from "src/components/FlipCard/FlipCard";
import { SkeletonList } from "src/components/Loading/Loading";
import Modal from "src/components/Modal/Modal";
import { EmptyState, ErrorState } from "src/components/State/State";
import { errorMessage } from "src/helpers/errors";
import { formatDayMonthFromIso } from "src/helpers/format";
import { toast } from "src/helpers/toast";
import { useCreateFlashcard, useDeleteFlashcard, useFlashcards, useReviewFlashcard } from "src/hooks/useFlashcards";
import MainLayout from "src/layouts/MainLayout";
import FromDocumentModal from "./FromDocumentModal";

const isDue = (c: Flashcard) => new Date(c.dueAt).getTime() <= Date.now();

/** "hôm nay lúc 17:00" / "ngày mai" / "ngày 21/11": tránh ghi ngày hôm nay mà thẻ vẫn chưa đến hạn. */
function dueLabel(iso: string): string {
  const d = new Date(iso);
  const days = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - new Date(new Date().setHours(0, 0, 0, 0)).getTime()) / 86400000);
  if (days === 0) return `hôm nay lúc ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  if (days === 1) return "ngày mai";
  return `ngày ${formatDayMonthFromIso(iso)}`;
}

/** Thẻ ghi nhớ (WEB-S07): ôn các thẻ đến hạn, tự đánh giá nhớ hoặc quên; nhớ thì lần sau thưa dần 1→3→7→14 ngày (FR-FC-02). */
export default function Flashcards() {
  const list = useFlashcards();
  const [reviewing, setReviewing] = useState<Flashcard[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);
  const cards = list.data ?? [];
  const due = cards.filter(isDue);

  return (
    <MainLayout>
      <div className="content" style={{ maxWidth: 1080, width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h1 className="h1">Thẻ ghi nhớ</h1>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn btn-primary" onClick={() => setImporting(true)}>
              Tạo từ tài liệu
            </button>
            <button className="btn btn-secondary" onClick={() => setAdding(true)}>
              Thêm thẻ
            </button>
          </div>
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
              <EmptyState art="quiz" title="Chưa có thẻ nào" message="Bấm Tạo từ tài liệu để AI soạn sẵn nhiều thẻ từ slide của bạn, hoặc tạo thẻ từ câu quiz làm sai và câu trả lời của trợ lý." />
            ) : (
              <CardList cards={cards} />
            )}
          </>
        )}
      </div>
      <FromDocumentModal open={importing} onClose={() => setImporting(false)} />
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
  const [remembered, setRemembered] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const card = cards[idx];

  async function rate(result: "remember" | "forgot") {
    if (!card || review.isPending) return;
    setError(null);
    try {
      await review.mutateAsync({ id: card.id, result });
      if (result === "remember") setRemembered((n) => n + 1);
      setShown(false);
      setIdx(idx + 1);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Không lưu được kết quả, hãy thử lại.");
    }
  }

  // Phím tắt: Space/Enter lật (khi chưa focus nút nào), ← hoặc 1 là Quên, → hoặc 2 là Nhớ (sau khi lật).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.ctrlKey || e.metaKey || e.altKey || t?.closest("input,textarea,select,[contenteditable],dialog")) return;
      if ((e.key === " " || e.key === "Enter") && !t?.closest("button,a")) {
        e.preventDefault();
        setShown((s) => !s);
      } else if (shown && (e.key === "ArrowLeft" || e.key === "1")) void rate("forgot");
      else if (shown && (e.key === "ArrowRight" || e.key === "2")) void rate("remember");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!card) {
    return (
      <div className="card card-pad stack" role="status" style={{ gap: 12 }}>
        <h2 className="h2">Xong rồi!</h2>
        <p className="muted">
          Bạn đã ôn hết {cards.length} thẻ hôm nay: nhớ {remembered}, quên {cards.length - remembered}. Thẻ nhớ sẽ quay lại thưa dần, thẻ quên quay lại sau 1 ngày.
        </p>
        <Button onClick={onDone} style={{ alignSelf: "flex-start" }}>
          Về danh sách thẻ
        </Button>
      </div>
    );
  }

  return (
    <section className="stack" aria-label="Ôn thẻ" style={{ gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div className="small muted" aria-live="polite">
          Thẻ {idx + 1} / {cards.length}
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onDone}>
          Dừng ôn
        </button>
      </div>
      <div className="review-progress" role="progressbar" aria-label="Tiến độ ôn" aria-valuemin={0} aria-valuemax={cards.length} aria-valuenow={idx}>
        <span style={{ width: `${(idx / cards.length) * 100}%` }} />
      </div>
      <FlipCard
        front={card.front}
        back={card.back}
        flipped={shown}
        onFlip={() => setShown((s) => !s)}
        backNote={card.page !== null ? `slide trang ${card.page}` : null}
      />
      {error && <Alert>{error}</Alert>}
      {/* Giữ chiều cao cố định để nút không nhảy vị trí khi lật thẻ. */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", minHeight: 48 }}>
        {!shown ? (
          <>
            <button className="btn btn-primary" onClick={() => setShown(true)}>
              Xem đáp án
            </button>
            <span className="small muted" aria-hidden="true">
              hoặc bấm thẻ, nhấn <span className="kbd">Space</span>
            </span>
          </>
        ) : (
          <>
            <Button variant="secondary" disabled={review.isPending} onClick={() => rate("forgot")}>
              Quên
            </Button>
            <Button variant="primary" disabled={review.isPending} onClick={() => rate("remember")}>
              Nhớ
            </Button>
            <span className="small muted" aria-hidden="true">
              <span className="kbd">←</span> quên · <span className="kbd">→</span> nhớ
            </span>
          </>
        )}
      </div>
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
              {isDue(c) ? "Đến hạn ôn" : `Ôn lại ${dueLabel(c.dueAt)}`} · khoảng cách {c.intervalDays} ngày
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
