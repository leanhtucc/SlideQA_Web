import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "src/apis/client";
import { deleteDocument, uploadDocument } from "src/apis/documents.api";
import { MAX_PARALLEL_UPLOADS, MAX_UPLOAD_BYTES } from "src/constants/upload";
import { errorMessage } from "src/helpers/errors";
import { formatBytes } from "src/helpers/format";
import { toast } from "src/helpers/toast";

export interface UploadItem {
  id: string;
  file: File;
  status: "queued" | "uploading" | "error";
  /** 0..1 */
  progress: number;
  error?: string;
  /** false = tệp bị từ chối từ đầu (không phải PDF, quá lớn): chỉ bỏ qua được, không thử lại */
  retryable: boolean;
}

let seq = 0;
const nextId = () => `u${++seq}`;

/** Lỗi kiểm tra sơ bộ phía máy (UC-02 bước 2); backend vẫn kiểm tra lại. */
export function validateFile(f: File): string | null {
  if (!f.name.toLowerCase().endsWith(".pdf")) return "Không phải PDF. Hãy chọn tệp .pdf.";
  if (f.size > MAX_UPLOAD_BYTES) return `Lớn hơn ${formatBytes(MAX_UPLOAD_BYTES)} (tệp này ${formatBytes(f.size)}).`;
  if (f.size === 0) return "Tệp rỗng.";
  return null;
}

/**
 * Hàng đợi tải lên nhiều tệp: tối đa 2 tệp cùng lúc, mỗi tệp có tiến độ và lỗi riêng.
 * Tệp tải xong thì biến khỏi hàng đợi (tài liệu hiện trong danh sách với trạng thái đang xử lý) và gọi `onUploaded`.
 */
export function useUploads(courseId: string, onUploaded: () => void) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const controllers = useRef(new Map<string, AbortController>());
  const started = useRef(new Set<string>());
  const onUploadedRef = useRef(onUploaded);
  onUploadedRef.current = onUploaded;

  const patch = useCallback((id: string, p: Partial<UploadItem>) => setItems((l) => l.map((i) => (i.id === id ? { ...i, ...p } : i))), []);
  const remove = useCallback((id: string) => setItems((l) => l.filter((i) => i.id !== id)), []);

  const run = useCallback(
    async (item: UploadItem) => {
      const ctrl = new AbortController();
      controllers.current.set(item.id, ctrl);
      patch(item.id, { status: "uploading", progress: 0 });
      try {
        const doc = await uploadDocument(courseId, item.file, (p) => patch(item.id, { progress: p }), ctrl.signal);
        remove(item.id);
        onUploadedRef.current();
        // Cùng nội dung với tài liệu đã có: vẫn giữ bản mới, nhưng hỏi người dùng có muốn bỏ không.
        if (doc.duplicateOf)
          toast.info(`"${doc.name}" giống hệt "${doc.duplicateOf.name}" đã tải trước đó.`, {
            duration: 15000,
            action: {
              label: "Xóa bản mới",
              onClick: () =>
                deleteDocument(doc.id).then(
                  () => onUploadedRef.current(),
                  (e) => toast.error(errorMessage(e, "Không xóa được, hãy thử lại.")),
                ),
            },
          });
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") remove(item.id);
        else
          patch(item.id, {
            status: "error",
            error: e instanceof ApiError ? e.message : "Tải lên không thành công.",
            progress: 0,
          });
      } finally {
        controllers.current.delete(item.id);
        started.current.delete(item.id);
      }
    },
    [courseId, patch, remove],
  );

  // Bơm hàng đợi: mỗi lần danh sách đổi, bắt đầu thêm tệp chờ cho đủ số tệp chạy cùng lúc.
  useEffect(() => {
    const active = items.filter((i) => i.status === "uploading").length;
    for (const i of items.filter((x) => x.status === "queued").slice(0, Math.max(0, MAX_PARALLEL_UPLOADS - active))) {
      if (started.current.has(i.id)) continue;
      started.current.add(i.id);
      void run(i);
    }
  }, [items, run]);

  // Đóng trang giữa chừng thì hủy các lần tải đang chạy; đang tải mà tải lại trang thì trình duyệt cảnh báo.
  useEffect(() => {
    const map = controllers.current;
    return () => map.forEach((c) => c.abort());
  }, []);
  const busy = items.some((i) => i.status !== "error");
  useEffect(() => {
    if (!busy) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy]);

  const add = useCallback((files: File[]) => {
    setItems((l) => [
      ...l,
      ...files.map((file): UploadItem => {
        const error = validateFile(file);
        return error
          ? {
              id: nextId(),
              file,
              status: "error",
              progress: 0,
              error,
              retryable: false,
            }
          : {
              id: nextId(),
              file,
              status: "queued",
              progress: 0,
              retryable: true,
            };
      }),
    ]);
  }, []);

  const retry = useCallback((id: string) => patch(id, { status: "queued", progress: 0 }), [patch]);
  /** Hủy tệp đang tải hoặc đang chờ, hoặc bỏ qua tệp lỗi. */
  const cancel = useCallback(
    (id: string) => {
      const c = controllers.current.get(id);
      if (c) c.abort();
      else remove(id);
    },
    [remove],
  );

  return { items, add, retry, cancel };
}
