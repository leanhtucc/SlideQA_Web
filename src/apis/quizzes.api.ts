import { request } from "src/apis/client";

export const listQuizzes = () => request<QuizSummary[]>("GET", "/quizzes");
export const createQuiz = (input: QuizInput) => request<{ id: string }>("POST", "/quizzes", { body: input });
export const startAttempt = (quizId: string) => request<Attempt>("POST", `/quizzes/${quizId}/attempts`);
export const getAttempt = (id: string) => request<Attempt>("GET", `/attempts/${id}`);
export const answerItem = (attemptId: string, itemId: string, chosenIndex: number) =>
  request<{ isCorrect: boolean }>("PUT", `/attempts/${attemptId}/answers/${itemId}`, { body: { chosenIndex } });
export const finishAttempt = (id: string) => request<Attempt>("POST", `/attempts/${id}/finish`);
export const flagItem = (quizId: string, itemId: string, flagged: boolean) => request<{ flagged: boolean }>("PUT", `/quizzes/${quizId}/items/${itemId}/flag`, { body: { flagged } });
/** Tạo bài quiz mới chỉ gồm các câu làm sai hoặc bỏ trống của một lượt đã nộp. */
export const retryWrong = (attemptId: string) => request<{ id: string }>("POST", `/attempts/${attemptId}/retry-wrong`);
