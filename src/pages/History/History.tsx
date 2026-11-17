import { useEffect, useState, type FormEvent } from "react";
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
      <div className="content" style={{ maxWidth: 900, width: "100%" }}>
        <h1 className="h1">Lịch sử hội thoại</h1>
        <div className="field">
          <label className="label" htmlFor="hist-q">
            Tìm hội thoại
          </label>
          <input id="hist-q" className="input" type="search" placeholder="Tên hoặc nội dung câu hỏi, câu trả lời" value={input} onChange={(e) => setInput(e.target.value)} />
        </div>

        {list.isPending && <div className="skeleton" aria-busy="true" aria-label="Đang tải lịch sử" />}
        {list.error && (
          <div className="stack" style={{ maxWidth: 520 }}>
            <Alert>Không tải được lịch sử, hãy thử lại.</Alert>
            <button className="btn btn-secondary" style={{ alignSelf: "flex-start" }} onClick={() => list.refetch()}>
              Thử lại
            </button>
          </div>
        )}
        {list.data && items.length === 0 && (
          <p className="muted">{q ? `Không có hội thoại nào khớp "${q}".` : "Chưa có hội thoại nào. Mở một môn học và bấm Hỏi trong môn này để bắt đầu."}</p>
        )}
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
        <button type="submit" className="btn btn-primary" disabled={rename.isPending}>
          {rename.isPending ? "Đang lưu…" : "Lưu"}
        </button>
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
        <button type="button" className="btn btn-danger" onClick={confirm} disabled={del.isPending}>
          {del.isPending ? "Đang xóa…" : "Xóa hội thoại"}
        </button>
      </div>
    </>
  );
}
