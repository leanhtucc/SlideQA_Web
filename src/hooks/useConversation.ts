import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "src/apis/conversations.api";

export const useConversation = (id: string) =>
  useQuery({
    queryKey: ["conversation", id],
    queryFn: () => api.getConversation(id),
  });

export const useCreateConversation = () => useMutation({ mutationFn: api.createConversation });

export const useConversations = (q: string) =>
  useQuery({
    queryKey: ["conversations", q],
    queryFn: () => api.listConversations(q || undefined),
  });

export function useRenameConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => api.renameConversation(id, title),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations"] }),
  });
}

export function useDeleteConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteConversation,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations"] }),
  });
}
