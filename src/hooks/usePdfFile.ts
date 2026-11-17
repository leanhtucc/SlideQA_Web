import { useQuery } from "@tanstack/react-query";
import { fetchDocumentFile } from "src/apis/documents.api";

/** Tải nguyên tệp PDF một lần rồi giữ trong cache; đổi tài liệu qua lại không tải lại. */
export const usePdfFile = (documentId: string | undefined) =>
  useQuery({
    queryKey: ["pdf", documentId],
    queryFn: () => fetchDocumentFile(documentId!),
    enabled: !!documentId,
    staleTime: Infinity,
    gcTime: 10 * 60_000,
  });
