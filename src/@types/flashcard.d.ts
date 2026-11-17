/** Thẻ ghi nhớ (WEB-S07). intervalDays là khoảng ôn kế tiếp: 1, 3, 7 hoặc 14 ngày. */
interface Flashcard {
  id: string;
  documentId: string | null;
  front: string;
  back: string;
  page: number | null;
  intervalDays: number;
  dueAt: string;
  createdAt: string;
}

interface FlashcardInput {
  front: string;
  back: string;
  page?: number;
  documentId?: string;
}
