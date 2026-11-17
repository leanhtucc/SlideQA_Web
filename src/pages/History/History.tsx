import { useEffect, useState, type FormEvent } from "react";
import { EmptyState, ErrorState } from "src/components/State/State";
import { SkeletonList } from "src/components/Loading/Loading";
import { toast } from "src/helpers/toast";
import Button from "src/components/Button/Button";
import { Link } from "react-router-dom";
import { ApiError } from "src/apis/client";
import Alert from "src/components/Alert/Alert";
import Modal from "src/components/Modal/Modal";
import { studyPath } from "src/constants/paths";
import { formatDayMonthFromIso } from "src/helpers/format";
import { useConversations, useDeleteConversation, useRenameConversation } from "src/hooks/useConversation";
import MainLayout from "src/layouts/MainLayout";

/** Lịch sử hội thoại (WEB-S05): tìm theo tên hoặc nội dung, đổi tên, xóa. */
export default function History() {
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const list = useConversations(q);
  const [renaming, setRenaming] = useState<Conversation | undefined>();
  const [deleting, setDeleting] = useState<Conversation | undefined>();

  // Đợi người dùng ngừng gõ rồi mới tìm, để không gọi API sau mỗi phím.
  useEffect(() => {
    const t = setTimeout(() => setQ(input.trim()), 300);
    return () => clearTimeout(t);
  }, [input]);

  const items = list.data ?? [];
  return (
    <MainLayout>
      <div className="content" style={{ maxWidth: 1080, width: "100%" }}>
        <h1 className="h1">Lịch sử hội thoại</h1>
        <div className="field">
          <label className="label" htmlFor="hist-q">
            Tìm hội thoại
          </label>
          <input id="hist-q" className="input" type="search" placeholder="Tên hoặc nội dung câu hỏi, câu trả lời" value={input} onChange={(e) => setInput(e.target.value)} />
        </div>

        {list.isPending && <SkeletonList rows={4} label="Đang tải lịch sử" />}
        {list.error && <ErrorState error={list.error} message="Không tải được lịch sử, hãy thử lại." onRetry={() => list.refetch()} retrying={list.isRefetching} />}
        {list.data &&
          items.length === 0 &&
          (q ? (
            <EmptyState art="search" title={`Không có hội thoại nào khớp "${q}"`} message="Thử từ khóa khác, hoặc xóa ô tìm kiếm để xem tất cả." />
          ) : (
            <EmptyState art="chat" title="Chưa có hội thoại nào" message="Mở một môn học và bấm Hỏi trong môn này để bắt đầu." />
          ))}
        {items.length > 0 && (
          <ul className="card doc-list">
            {items.map((c) => (
              <li key={c.id} className="doc-row" style={{ flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <Link to={studyPath(c.id)} className="h4 link-strong">
                    {c.title}
                  </Link>
                  <div className="small muted">Cập nhật {formatDayMonthFromIso(c.updatedAt)}</div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setRenaming(c)} aria-label={`Đổi tên ${c.title}`}>
                  Đổi tên
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setDeleting(c)} aria-label={`Xóa ${c.title}`}>
                  Xóa
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Modal open={!!renaming} onClose={() => setRenaming(undefined)} title="Đổi tên hội thoại">
        {renaming && <RenameForm conv={renaming} onDone={() => setRenaming(undefined)} />}
      </Modal>
      <Modal open={!!deleting} onClose={() => setDeleting(undefined)} title={deleting ? `Xóa "${deleting.title}"?` : ""} role="alertdialog">
        {deleting && <DeleteBody conv={deleting} onDone={() => setDeleting(undefined)} />}
      </Modal>
    </MainLayout>
  );
}

const msg = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);

function RenameForm({ conv, onDone }: { conv: Conversation; onDone: () => void }) {
  const rename = useRenameConversation();
  const [title, setTitle] = useState(conv.title);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return setError("Tên hội thoại không được để trống.");
    if (t.length > 120) return setError("Tên hội thoại tối đa 120 ký tự.");
    try {
      await rename.mutateAsync({ id: conv.id, title: t });
      toast.success("Đã đổi tên hội thoại.");
      onDone();
    } catch (err) {
      setError(msg(err, "Không đổi được tên, hãy thử lại."));
    }
  }

  return (
    <form className="stack" style={{ gap: 14 }} onSubmit={submit} noValidate>
      {error && <Alert>{error}</Alert>}
      <div className="field">
        <label className="label" htmlFor="conv-title">
          Tên hội thoại
        </label>
        <input id="conv-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
      </div>
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onDone}>
          Hủy
        </button>
        <Button variant="primary" type="submit" loading={rename.isPending} loadingText="Đang lưu…">
          Lưu
        </Button>
      </div>
    </form>
  );
}

function DeleteBody({ conv, onDone }: { conv: Conversation; onDone: () => void }) {
  const del = useDeleteConversation();
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    try {
      await del.mutateAsync(conv.id);
      toast.success("Đã xóa hội thoại.");
      onDone();
    } catch (e) {
      setError(msg(e, "Không xóa được, hãy thử lại."));
    }
  }

  return (
    <>
      <Alert>
        Toàn bộ câu hỏi và câu trả lời trong hội thoại này sẽ bị xóa và <b>không hoàn tác được</b>. Tài liệu không bị ảnh hưởng.
      </Alert>
      {error && <Alert>{error}</Alert>}
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onDone} autoFocus>
          Giữ lại
        </button>
        <Button variant="danger" loading={del.isPending} loadingText="Đang xóa…" onClick={confirm}>
          Xóa hội thoại
        </Button>
      </div>
    </>
  );
}
