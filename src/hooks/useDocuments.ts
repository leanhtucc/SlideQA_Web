import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "src/apis/documents.api";
import { POLL_MS } from "src/constants/upload";

const key = (courseId: string | undefined) => ["documents", courseId ?? "all"] as const;

/** Danh sách tài liệu của môn; tự hỏi lại mỗi 2 giây khi còn tài liệu đang xử lý. */
export const useDocuments = (courseId?: string) =>
  useQuery({
    queryKey: key(courseId),
    queryFn: () => api.listDocuments(courseId),
    refetchInterval: (q) => (q.state.data?.some((d) => d.status === "processing") ? POLL_MS : false),
  });

/** Sau thay đổi tài liệu: làm mới danh sách và số liệu của môn (documentCount) ở Tổng quan. */
export function useRefreshDocuments(courseId: string) {
  const qc = useQueryClient();
  return () => Promise.all([qc.invalidateQueries({ queryKey: key(courseId) }), qc.invalidateQueries({ queryKey: ["courses"] })]);
}

export function useRenameDocument(courseId: string) {
  const refresh = useRefreshDocuments(courseId);
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => api.renameDocument(id, name),
    onSuccess: refresh,
  });
}

export function useDeleteDocument(courseId: string) {
  const refresh = useRefreshDocuments(courseId);
  return useMutation({ mutationFn: api.deleteDocument, onSuccess: refresh });
}

export function useRetryDocument(courseId: string) {
  const refresh = useRefreshDocuments(courseId);
  return useMutation({ mutationFn: api.retryDocument, onSuccess: refresh });
}
