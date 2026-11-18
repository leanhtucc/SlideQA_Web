import * as pdfjs from "pdfjs-dist";
import Spinner from "src/components/Spinner/Spinner";
import { ErrorState } from "src/components/State/State";
import "pdfjs-dist/web/pdf_viewer.css";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { useEffect, useRef, useState } from "react";
import Alert from "src/components/Alert/Alert";
import { matchSpans } from "src/helpers/highlight";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

interface Props {
  data: ArrayBuffer | undefined;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  /** Trang đang xem, bắt đầu từ 1 */
  page: number;
  onPageChange: (page: number) => void;
  /** Đoạn trích nguồn cần tô sáng trên trang */
  highlight: string | undefined;
  /** Đổi mỗi lần người dùng bấm một nguồn, để cuộn và tô lại dù trang và đoạn không đổi */
  nonce: number;
}

const ZOOMS = [0.5, 0.75, 1, 1.25, 1.5, 2];

const Icon = ({ d }: { d: string }) => (
  <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
    <path d={d} />
  </svg>
);

/** Trình xem PDF một trang (pdf.js): canvas + lớp chữ để tô sáng đoạn nguồn (WEB-02). */
export default function PdfViewer({ data, loading, error, onRetry, page, onPageChange, highlight, nonce }: Props) {
  const [pdf, setPdf] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [zoomIdx, setZoomIdx] = useState(2);
  const [width, setWidth] = useState(0);
  const [renderError, setRenderError] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const textLayer = useRef<HTMLDivElement>(null);
  const numPages = pdf?.numPages ?? 0;
  const current = numPages ? Math.min(Math.max(1, page), numPages) : page;

  // Mở tài liệu khi có dữ liệu mới. Sao chép buffer vì pdf.js chuyển quyền sở hữu sang worker (buffer gốc còn dùng lại để cache).
  useEffect(() => {
    setPdf(null);
    setLoadError(null);
    setRenderError(null); // lỗi của tài liệu trước không được dính sang tài liệu mới
    if (!data) return;
    let cancelled = false;
    const task = pdfjs.getDocument({ data: new Uint8Array(data.slice(0)) });
    task.promise.then(
      (doc) => !cancelled && setPdf(doc),
      () => !cancelled && setLoadError("Không mở được tệp PDF này."),
    );
    return () => {
      cancelled = true;
      void task.destroy();
    };
  }, [data]);

  // Theo dõi bề rộng vùng xem để vừa khít chiều ngang.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    setWidth(el.clientWidth); // giá trị đầu, không chờ lần quan sát đầu tiên
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => e && setWidth(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Vẽ trang + lớp chữ, rồi tô sáng đoạn nguồn và cuộn tới đó.
  useEffect(() => {
    const cv = canvas.current;
    const tl = textLayer.current;
    if (!pdf || !cv || !tl || width === 0) return;
    let cancelled = false;
    let task: pdfjs.RenderTask | undefined;
    setRenderError(null);
    (async () => {
      const p = await pdf.getPage(current);
      if (cancelled) return;
      const fit = Math.min(Math.max((width - 48) / p.getViewport({ scale: 1 }).width, 0.4), 3);
      const scale = fit * (ZOOMS[zoomIdx] ?? 1);
      const vp = p.getViewport({ scale });
      const dpr = window.devicePixelRatio || 1;
      cv.width = Math.floor(vp.width * dpr);
      cv.height = Math.floor(vp.height * dpr);
      cv.style.width = `${Math.floor(vp.width)}px`;
      cv.style.height = `${Math.floor(vp.height)}px`;
      const ctx = cv.getContext("2d");
      if (!ctx) throw new Error("canvas");
      task = p.render({ canvasContext: ctx, canvas: cv, viewport: vp, ...(dpr !== 1 ? { transform: [dpr, 0, 0, dpr, 0, 0] } : {}) });
      await task.promise;
      if (cancelled) return;

      tl.replaceChildren();
      tl.style.width = `${Math.floor(vp.width)}px`;
      tl.style.height = `${Math.floor(vp.height)}px`;
      tl.style.setProperty("--total-scale-factor", String(scale));
      const layer = new pdfjs.TextLayer({ textContentSource: p.streamTextContent(), container: tl, viewport: vp });
      await layer.render();
      if (cancelled) return;
      if (highlight) {
        const hit = matchSpans(layer.textContentItemsStr, highlight);
        let first: HTMLElement | undefined;
        layer.textDivs.forEach((div, i) => {
          if (!hit[i]) return;
          div.classList.add("pdf-hl");
          first ??= div;
        });
        first?.scrollIntoView?.({ block: "center", behavior: "smooth" });
      }
    })().catch((e) => {
      // Đổi tài liệu giữa chừng làm tài liệu cũ bị hủy: đó không phải lỗi hiển thị.
      if (!cancelled && !pdf.loadingTask.destroyed && e?.name !== "RenderingCancelledException") setRenderError("Không hiển thị được trang này.");
    });
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [pdf, current, zoomIdx, width, highlight, nonce]);

  const draftInit = String(current);
  const [draft, setDraft] = useState(draftInit);
  useEffect(() => setDraft(draftInit), [draftInit]);
  const shownError = loading ? null : (error ?? loadError ?? renderError); // đang tải thì không báo lỗi cũ
  /** Nhập số trang rồi Enter hoặc rời ô: nhảy thẳng tới trang đó (kẹp trong 1..số trang); nhập sai thì trả về trang hiện tại. */
  function goToDraft() {
    const n = Number(draft);
    if (!draft || !Number.isFinite(n) || numPages === 0) return setDraft(String(current));
    const target = Math.min(Math.max(1, n), numPages);
    setDraft(String(target));
    if (target !== current) onPageChange(target);
  }
  const canPrev = current > 1;
  const canNext = numPages > 0 && current < numPages;

  return (
    <div className="pdf-viewer">
      <div className="pdf-toolbar">
        <button className="btn btn-secondary btn-sm btn-icon" aria-label="Trang trước" disabled={!canPrev} onClick={() => onPageChange(current - 1)}>
          <Icon d="M15 6l-6 6 6 6" />
        </button>
        <label className="small pdf-page-jump">
          Trang
          <input
            className="input pdf-page-input"
            inputMode="numeric"
            aria-label="Đi tới trang"
            value={draft}
            disabled={numPages === 0}
            onChange={(e) => setDraft(e.target.value.replace(/D/g, ""))}
            onFocus={(e) => e.target.select()}
            onBlur={goToDraft}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          />
          {numPages > 0 && <>/ {numPages}</>}
        </label>
        <button className="btn btn-secondary btn-sm btn-icon" aria-label="Trang sau" disabled={!canNext} onClick={() => onPageChange(current + 1)}>
          <Icon d="M9 6l6 6-6 6" />
        </button>
        <span className="pdf-toolbar-sep" />
        <button className="btn btn-secondary btn-sm btn-icon" aria-label="Thu nhỏ" disabled={zoomIdx === 0} onClick={() => setZoomIdx((z) => z - 1)}>
          <Icon d="M5 12h14" />
        </button>
        <span className="small">{Math.round((ZOOMS[zoomIdx] ?? 1) * 100)}%</span>
        <button className="btn btn-secondary btn-sm btn-icon" aria-label="Phóng to" disabled={zoomIdx === ZOOMS.length - 1} onClick={() => setZoomIdx((z) => z + 1)}>
          <Icon d="M12 5v14M5 12h14" />
        </button>
      </div>

      <div className="pdf-scroll" ref={scroller}>
        {(loading || (data && !pdf && !shownError)) && (
          <div className="pdf-loading" role="status" aria-busy="true">
            <Spinner size={22} />
            <span className="muted small">Đang tải tài liệu…</span>
          </div>
        )}
        {shownError && <ErrorState compact message={shownError} onRetry={onRetry} />}
        <div className="pdf-page-wrap" hidden={!pdf}>
          <canvas ref={canvas} aria-label={`Trang ${current} của tài liệu`} role="img" />
          <div ref={textLayer} className="textLayer" />
        </div>
      </div>
    </div>
  );
}
