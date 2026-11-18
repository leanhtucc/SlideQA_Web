import { request } from "src/apis/client";

export const listFlashcards = (due = false) => request<Flashcard[]>("GET", `/flashcards${due ? "?due=true" : ""}`);
export const createFlashcard = (input: FlashcardInput) => request<Flashcard>("POST", "/flashcards", { body: input });
export const reviewFlashcard = (id: string, result: "remember" | "forgot") => request<Flashcard>("POST", `/flashcards/${id}/review`, { body: { result } });
export const deleteFlashcard = (id: string) => request<null>("DELETE", `/flashcards/${id}`);
/** Tạo thẻ từ các câu sai và câu bỏ trống của một lượt đã nộp; câu đã có thẻ thì bỏ qua. */
export const flashcardsFromAttempt = (attemptId: string) => request<{ created: number; skipped: number }>("POST", `/flashcards/from-attempt/${attemptId}`);
/** AI tạo nhiều thẻ từ một tài liệu đã xử lý xong; thẻ trùng câu hỏi với thẻ đã có thì bỏ qua. */
export const flashcardsFromDocument = (input: FlashcardsFromDocumentInput) =>
  request<{ created: number; skipped: number }>("POST", "/flashcards/from-document", { body: input });
