import { ApiError, apiUrl, refreshSession, request, requestBuffer } from "src/apis/client";
import { session } from "src/helpers/session";

export const listDocuments = (courseId?: string) => request<CourseDocument[]>("GET", courseId ? `/documents?courseId=${encodeURIComponent(courseId)}` : "/documents");
export const fetchDocumentFile = (id: string) => requestBuffer(`/documents/${id}/file`);
export const renameDocument = (id: string, name: string) => request<CourseDocument>("PATCH", `/documents/${id}`, { body: { name } });
export const deleteDocument = (id: string) => request<null>("DELETE", `/documents/${id}`);
export const retryDocument = (id: string) => request<CourseDocument>("POST", `/documents/${id}/retry`);

interface XhrResult {
  status: number;
  body: any;
  retryAfter: number | undefined;
}

function sendOnce(courseId: string, file: File, token: string | null, onProgress: (ratio: number) => void, signal: AbortSignal): Promise<XhrResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", apiUrl("/documents"));
    if (token) xhr.setRequestHeader("authorization", `Bearer ${token}`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => {
      let body: any = null;
      try {
        body = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        /* không phải JSON */
      }
      const retry = Number(xhr.getResponseHeader("retry-after"));
      resolve({
        status: xhr.status,
        body,
        retryAfter: Number.isFinite(retry) && retry > 0 ? retry : undefined,
      });
    };
    xhr.onerror = () => reject(new ApiError(0, "network", "Mất kết nối. Hãy kiểm tra mạng và thử lại."));
    xhr.onabort = () => reject(new DOMException("Đã hủy", "AbortError"));
    signal.addEventListener("abort", () => xhr.abort(), { once: true });
    const form = new FormData();
    form.set("courseId", courseId);
    form.set("file", file);
    xhr.send(form);
  });
}

/**
 * Tải PDF lên (multipart) bằng XHR để có tiến độ. Gặp 401 thì refresh token một lần rồi tải lại,
 * giống `request`. Trả về tài liệu ở trạng thái `processing` (server xử lý nền).
 */
export async function uploadDocument(courseId: string, file: File, onProgress: (ratio: number) => void, signal: AbortSignal): Promise<CourseDocument & { duplicateOf?: { id: string; name: string } | null }> {
  let r = await sendOnce(courseId, file, session.getAccess(), onProgress, signal);
  if (r.status === 401 && (await refreshSession())) r = await sendOnce(courseId, file, session.getAccess(), onProgress, signal);
  if (r.status >= 400) {
    const e = r.body?.error;
    throw new ApiError(r.status, e?.code ?? "error", e?.message ?? "Tải lên không thành công, hãy thử lại.", e?.fields ?? {}, r.retryAfter);
  }
  return r.body;
}
