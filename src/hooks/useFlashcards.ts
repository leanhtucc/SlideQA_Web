import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "src/apis/flashcards.api";

const KEY = ["flashcards"] as const;

export const useFlashcards = () => useQuery({ queryKey: KEY, queryFn: () => api.listFlashcards() });

function useRefresh() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: KEY });
}

export const useCreateFlashcard = () => useMutation({ mutationFn: api.createFlashcard, onSuccess: useRefresh() });
export const useDeleteFlashcard = () => useMutation({ mutationFn: api.deleteFlashcard, onSuccess: useRefresh() });
export const useReviewFlashcard = () => useMutation({ mutationFn: ({ id, result }: { id: string; result: "remember" | "forgot" }) => api.reviewFlashcard(id, result) });
export const useFlashcardsFromAttempt = () => useMutation({ mutationFn: api.flashcardsFromAttempt, onSuccess: useRefresh() });
export const useFlashcardsFromDocument = () => useMutation({ mutationFn: api.flashcardsFromDocument, onSuccess: useRefresh() });
