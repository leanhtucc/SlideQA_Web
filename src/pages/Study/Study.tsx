import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ApiError } from "src/apis/client";
import Alert from "src/components/Alert/Alert";
import Loading from "src/components/Loading/Loading";
import PdfViewer from "src/components/PdfViewer/PdfViewer";
import { coursePath, PATH } from "src/constants/paths";
import { useConversation } from "src/hooks/useConversation";
import { useDocuments } from "src/hooks/useDocuments";
import { useMediaQuery } from "src/hooks/useMediaQuery";
import { usePdfFile } from "src/hooks/usePdfFile";
import ChatPanel from "./ChatPanel";

interface Target {
  page: number;
  snippet: string | undefined;
  nonce: number;
  /** Khóa nguồn đang mở: `${messageId}:${n}` */
  key: string | null;
}

/** Không gian học (WEB-S04): PDF bên trái, hội thoại bên phải; bấm nguồn thì PDF nhảy đúng trang và tô sáng đoạn gốc. */
export default function Study() {
  const { id = "" } = useParams();
  const conv = useConversation(id);
  const notFound = conv.error instanceof ApiError && conv.error.status === 404;

  if (conv.isPending) return <Loading />;
  if (conv.error || !conv.data) {
    return (
      <div className="center-screen">
        <div className="stack" style={{ maxWidth: 480 }}>
          <Alert>{notFound ? "Không tìm thấy hội thoại này." : "Không tải được hội thoại, hãy thử lại."}</Alert>
          <Link to={PATH.HOME} className="btn btn-secondary" style={{ alignSelf: "flex-start" }}>
            Về tổng quan
          </Link>
        </div>
      </div>
    );
  }
  return <Workspace conversation={conv.data} />;
}

function Workspace({ conversation }: { conversation: ConversationDetail }) {
  const narrow = useMediaQuery("(max-width: 767px)");
  // ?page=N (từ màn kết quả quiz) mở sẵn đúng trang của slide.
  const startPage = Number(useSearchParams()[0].get("page")) || 1;
  const [tab, setTab] = useState<"pdf" | "chat">(startPage > 1 ? "pdf" : "chat");
  const docsQ = useDocuments(conversation.courseId ?? undefined);
  const scopeDocs = useMemo(
    () => (docsQ.data ?? []).filter((d) => d.status === "ready" && (conversation.scopeDocumentIds.length === 0 || conversation.scopeDocumentIds.includes(d.id))),
    [docsQ.data, conversation.scopeDocumentIds],
  );
  const [docId, setDocId] = useState<string | undefined>();
  const [target, setTarget] = useState<Target>({
    page: startPage,
    snippet: undefined,
    nonce: 0,
    key: null,
  });
  const pdf = usePdfFile(docId);

  // Mở sẵn tài liệu đầu tiên trong phạm vi.
  useEffect(() => {
    if (!docId && scopeDocs[0]) setDocId(scopeDocs[0].id);
  }, [docId, scopeDocs]);

  function openSource(s: MessageSource, key: string) {
    if (!s.documentId) return;
    setDocId(s.documentId);
    setTarget((t) => ({
      page: s.page,
      snippet: s.snippet,
      nonce: t.nonce + 1,
      key,
    }));
    setTab("pdf");
  }

  const scopeLabel =
    conversation.scopeDocumentIds.length > 0 ? `${conversation.scopeDocumentIds.length} tài liệu` : conversation.courseId ? "Cả môn học" : "Tất cả tài liệu của bạn";
  const back = conversation.courseId ? coursePath(conversation.courseId) : PATH.HOME;

  return (
    <div className="study">
      <header className="study-bar">
        <Link to={back} className="btn btn-ghost btn-icon" aria-label="Quay lại">
          <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </Link>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1 className="h4 study-title">{conversation.title}</h1>
          <div className="tiny muted">Phạm vi: {scopeLabel}</div>
        </div>
      </header>

      {narrow && (
        <div className="tabs" role="tablist" style={{ background: "var(--surface)" }}>
          {(["pdf", "chat"] as const).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} className={"tab" + (tab === t ? " active" : "")} style={{ flex: 1 }} onClick={() => setTab(t)}>
              {t === "pdf" ? "PDF" : "Hội thoại"}
            </button>
          ))}
        </div>
      )}

      <div className="study-body">
        <section className="study-pdf" aria-label="Tài liệu" hidden={narrow && tab !== "pdf"}>
          {scopeDocs.length > 1 && (
            <div className="study-docs">
              <label htmlFor="doc-select" className="small" style={{ fontWeight: 600 }}>
                Tài liệu
              </label>
              <select
                id="doc-select"
                className="input"
                style={{ minHeight: 36, flex: 1 }}
                value={docId ?? ""}
                onChange={(e) => {
                  setDocId(e.target.value);
                  setTarget((t) => ({
                    page: 1,
                    snippet: undefined,
                    nonce: t.nonce + 1,
                    key: null,
                  }));
                }}
              >
                {scopeDocs.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {docsQ.isSuccess && scopeDocs.length === 0 && <Alert kind="warn">Chưa có tài liệu nào sẵn sàng trong phạm vi này. Hãy tải PDF lên và chờ xử lý xong.</Alert>}
          {docId ? (
            <PdfViewer
              data={pdf.data}
              loading={pdf.isPending}
              error={pdf.error ? (pdf.error instanceof ApiError ? pdf.error.message : "Không tải được tài liệu.") : null}
              onRetry={() => pdf.refetch()}
              page={target.page}
              onPageChange={(p) =>
                setTarget((t) => ({
                  page: p,
                  snippet: undefined,
                  nonce: t.nonce + 1,
                  key: null,
                }))
              }
              highlight={target.snippet}
              nonce={target.nonce}
            />
          ) : (
            scopeDocs.length > 0 && (
              <p className="muted" style={{ padding: 24 }}>
                Bấm một nguồn trong câu trả lời để xem đúng trang.
              </p>
            )
          )}
        </section>

        <div className="study-chat" hidden={narrow && tab !== "chat"}>
          <ChatPanel conversation={conversation} activeKey={target.key} onOpenSource={openSource} />
        </div>
      </div>
    </div>
  );
}
