/** Bài quiz (WEB-S06). Đáp án đúng chỉ có trong lượt làm bài, sau khi trả lời câu đó. */
interface QuizSummary {
  id: string;
  documentId: string | null;
  courseId: string | null;
  documentName: string | null;
  /** Có khi quiz theo cả môn (không có tài liệu hay khoảng trang riêng) */
  courseName: string | null;
  fromPage: number | null;
  toPage: number | null;
  count: number;
  createdAt: string;
  attemptCount: number;
  bestScore: number | null;
}

/** Một tài liệu (kèm khoảng trang) hoặc cả môn: đúng một trong documentId, courseId */
interface QuizInput {
  documentId?: string;
  courseId?: string;
  fromPage?: number;
  toPage?: number;
  count: number;
}

interface AttemptItem {
  id: string;
  position: number;
  question: string;
  options: string[];
  page: number;
  documentId: string | null;
  chosenIndex: number | null;
  isCorrect: boolean | null;
  /** Chỉ có sau khi đã trả lời câu này, hoặc khi lượt đã kết thúc */
  correctIndex?: number;
  explanation?: string;
}

interface Attempt {
  id: string;
  quizId: string;
  score: number | null;
  total: number;
  durationS: number | null;
  startedAt: string;
  finishedAt: string | null;
  items: AttemptItem[];
}
