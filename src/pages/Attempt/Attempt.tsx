import { useState } from "react";
import { ErrorState } from "src/components/State/State";
import { SkeletonList } from "src/components/Loading/Loading";
import Button from "src/components/Button/Button";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError } from "src/apis/client";
import { createConversation } from "src/apis/conversations.api";
import Alert from "src/components/Alert/Alert";
import { attemptPath, PATH, studyPath } from "src/constants/paths";
import { toast } from "src/helpers/toast";
import { useAnswer, useAttempt, useFinishAttempt, useFlagItem, useRetryWrong, useStartAttempt } from "src/hooks/useQuizzes";
import { useFlashcardsFromAttempt } from "src/hooks/useFlashcards";
import MainLayout from "src/layouts/MainLayout";

const LETTERS = ["A", "B", "C", "D"];
const msg = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);

/** Làm bài quiz (WEB-S06): chọn đáp án được chấm ngay kèm giải thích; xong thì xem điểm và xem lại từng câu. */
export default function Attempt() {
  const { id = "" } = useParams();
  const q = useAttempt(id);
  const notFound = q.error instanceof ApiError && q.error.status === 404;

  return (
    <MainLayout>
      <div className="content" style={{ maxWidth: 820, width: "100%" }}>
        <nav aria-label="Đường dẫn" className="small muted">
          <Link to={PATH.QUIZZES} className="link-strong">
            Quiz
          </Link>
        </nav>
        {q.isPending && <SkeletonList rows={3} label="Đang tải bài quiz" />}
        {q.error && (
          <ErrorState
            error={q.error}
            message={notFound ? "Không tìm thấy lượt làm bài này." : "Không tải được bài quiz, hãy thử lại."}
            {...(notFound ? {} : { onRetry: () => q.refetch(), retrying: q.isRefetching })}
          >
            {notFound && (
              <Link to={PATH.QUIZZES} className="btn btn-secondary">
                Về danh sách quiz
              </Link>
            )}
          </ErrorState>
        )}
        {q.data && (q.data.finishedAt ? <Result attempt={q.data} /> : <Taking attempt={q.data} />)}
      </div>
    </MainLayout>
  );
}

function Taking({ attempt }: { attempt: Attempt }) {
  const answer = useAnswer(attempt.id);
  const finish = useFinishAttempt(attempt.id);
  const firstOpen = attempt.items.findIndex((i) => i.chosenIndex === null);
  const [idx, setIdx] = useState(firstOpen === -1 ? 0 : firstOpen);
  const [error, setError] = useState<string | null>(null);
  const item = attempt.items[idx];
  if (!item) return <Alert>Bài quiz này không còn câu hỏi nào.</Alert>;
  const graded = item.chosenIndex !== null && item.correctIndex !== undefined;
  const last = idx === attempt.items.length - 1;
  const done = attempt.items.filter((i) => i.chosenIndex !== null).length;

  async function pick(chosenIndex: number) {
    if (graded || answer.isPending || !item) return;
    setError(null);
    try {
      await answer.mutateAsync({ itemId: item.id, chosenIndex });
    } catch (e) {
      setError(msg(e, "Không gửi được đáp án, hãy thử lại."));
    }
  }

  async function end() {
    setError(null);
    try {
      await finish.mutateAsync();
    } catch (e) {
      setError(msg(e, "Không nộp được bài, hãy thử lại."));
    }
  }

  return (
    <section className="stack" aria-label="Làm bài" style={{ gap: 16 }}>
      <div className="small muted" aria-live="polite">
        Câu {idx + 1} / {attempt.items.length} · đã trả lời {done}
      </div>
      <h1 className="h2">{item.question}</h1>
      {error && <Alert>{error}</Alert>}
      <div className="stack" role="group" aria-label="Các đáp án" style={{ gap: 8 }}>
        {item.options.map((o, i) => {
          const state = !graded ? "" : i === item.correctIndex ? " correct" : i === item.chosenIndex ? " wrong" : "";
          return (
            <button
              key={i}
              type="button"
              className={"opt" + state + (item.chosenIndex === i && !graded ? " sel" : "")}
              disabled={graded || answer.isPending}
              aria-pressed={item.chosenIndex === i}
              onClick={() => pick(i)}
            >
              <span className="k" aria-hidden="true">
                {LETTERS[i]}
              </span>
              <span>{o}</span>
              {graded && i === item.correctIndex && <span className="sr-only"> (đáp án đúng)</span>}
            </button>
          );
        })}
      </div>
      {graded && (
        <div role="status">
          <Alert kind={item.isCorrect ? "ok" : "warn"}>
            <b>{item.isCorrect ? "Đúng." : `Chưa đúng, đáp án là ${LETTERS[item.correctIndex ?? 0]}.`}</b> {item.explanation}{" "}
            <span className="muted">(slide trang {item.page})</span>
          </Alert>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <button className="btn btn-secondary" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>
          Câu trước
        </button>
        {last ? (
          <Button variant="primary" loading={finish.isPending} loadingText="Đang nộp…" onClick={end}>
            {done < attempt.items.length ? `Nộp bài (còn ${attempt.items.length - done} câu chưa làm)` : "Nộp bài"}
          </Button>
        ) : (
          <button className="btn btn-primary" onClick={() => setIdx(idx + 1)}>
            Câu sau
          </button>
        )}
      </div>
    </section>
  );
}

function Result({ attempt }: { attempt: Attempt }) {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const flag = useFlagItem(attempt.id, attempt.quizId);
  const retry = useRetryWrong();
  const start = useStartAttempt();
  const cards = useFlashcardsFromAttempt();
  const wrong = attempt.items.filter((i) => i.isCorrect !== true).length;

  /** Báo câu hỏi sai hoặc khó hiểu: câu bị loại khỏi các lần làm sau (FR-QZ-07). */
  async function report(item: AttemptItem) {
    try {
      await flag.mutateAsync(item.id);
      toast.success("Đã báo câu này. Nó sẽ không xuất hiện ở các lần làm sau.");
    } catch (e) {
      toast.error(msg(e, "Không báo được câu này, hãy thử lại."));
    }
  }

  async function makeCards() {
    try {
      const r = await cards.mutateAsync(attempt.id);
      toast.success(r.created > 0 ? `Đã tạo ${r.created} thẻ ghi nhớ.` : "Các câu sai đã có thẻ rồi.");
    } catch (e) {
      toast.error(msg(e, "Không tạo được thẻ, hãy thử lại."));
    }
  }

  /** Làm lại riêng các câu sai và câu bỏ trống: tạo quiz mới từ chính các câu đó. */
  async function redo() {
    setError(null);
    try {
      const quiz = await retry.mutateAsync(attempt.id);
      navigate(attemptPath((await start.mutateAsync(quiz.id)).id));
    } catch (e) {
      setError(msg(e, "Không tạo được bài làm lại, hãy thử lại."));
    }
  }

  /** Mở không gian học ở đúng trang của slide chứa câu này. */
  async function viewPage(item: AttemptItem) {
    if (!item.documentId) return;
    try {
      const c = await createConversation({ documentIds: [item.documentId] });
      navigate(`${studyPath(c.id)}?page=${item.page}`);
    } catch (e) {
      setError(msg(e, "Không mở được trang slide, hãy thử lại."));
    }
  }

  const mins = attempt.durationS === null ? null : Math.max(1, Math.round(attempt.durationS / 60));
  return (
    <section className="stack" aria-label="Kết quả" style={{ gap: 16 }}>
      <div className="card card-pad">
        <div className="small muted">Kết quả</div>
        <div className="stat">
          {attempt.score ?? 0}/{attempt.total}
        </div>
        {mins !== null && <div className="small muted">Làm trong khoảng {mins} phút</div>}
      </div>
      {error && <Alert>{error}</Alert>}
      {wrong > 0 && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button variant="primary" loading={retry.isPending || start.isPending} loadingText="Đang tạo…" onClick={redo}>
            Làm lại {wrong} câu sai
          </Button>
          <Button variant="secondary" loading={cards.isPending} loadingText="Đang tạo…" onClick={makeCards}>
            Lưu câu sai thành thẻ
          </Button>
        </div>
      )}
      <ol className="stack" style={{ gap: 12, paddingLeft: 0, listStyle: "none" }}>
        {attempt.items.map((it, n) => (
          <li key={it.id} className="card card-pad stack" style={{ gap: 8 }}>
            <div className="h4">
              Câu {n + 1}. {it.question}
            </div>
            <div className="small">
              {it.chosenIndex === null ? (
                <b>Bạn chưa trả lời.</b>
              ) : (
                <>
                  <b>{it.isCorrect ? "Đúng" : "Sai"}</b> · bạn chọn {LETTERS[it.chosenIndex]}. {it.options[it.chosenIndex]}
                </>
              )}
            </div>
            {!it.isCorrect && it.correctIndex !== undefined && (
              <div className="small">
                Đáp án đúng: {LETTERS[it.correctIndex]}. {it.options[it.correctIndex]}
              </div>
            )}
            <div className="small muted">{it.explanation}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {it.documentId && (
                <button className="btn btn-ghost btn-sm" onClick={() => viewPage(it)}>
                  Xem slide trang {it.page}
                </button>
              )}
              <button className="btn btn-ghost btn-sm" disabled={flag.isPending} onClick={() => report(it)} aria-label={`Báo câu ${n + 1} có vấn đề`}>
                Báo câu có vấn đề
              </button>
            </div>
          </li>
        ))}
      </ol>
      <Link to={PATH.QUIZZES} className="btn btn-secondary" style={{ alignSelf: "flex-start" }}>
        Về danh sách quiz
      </Link>
    </section>
  );
}
