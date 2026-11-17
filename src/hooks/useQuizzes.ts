import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "src/apis/quizzes.api";

export const useQuizzes = () => useQuery({ queryKey: ["quizzes"], queryFn: api.listQuizzes });

export const useCreateQuiz = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createQuiz,
    onSuccess: () => Promise.all([qc.invalidateQueries({ queryKey: ["quizzes"] }), qc.invalidateQueries({ queryKey: ["courses"] })]),
  });
};

export const useStartAttempt = () => useMutation({ mutationFn: api.startAttempt });

export const useAttempt = (id: string) => useQuery({ queryKey: ["attempt", id], queryFn: () => api.getAttempt(id) });

export function useAnswer(attemptId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, chosenIndex }: { itemId: string; chosenIndex: number }) => api.answerItem(attemptId, itemId, chosenIndex),
    // Cả khi lỗi 409 (đã chấm) cũng tải lại để hiện trạng thái thật của câu.
    onSettled: () => qc.invalidateQueries({ queryKey: ["attempt", attemptId] }),
  });
}

export function useFinishAttempt(attemptId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.finishAttempt(attemptId),
    onSuccess: (a) => {
      qc.setQueryData(["attempt", attemptId], a);
      return qc.invalidateQueries({ queryKey: ["quizzes"] });
    },
  });
}
