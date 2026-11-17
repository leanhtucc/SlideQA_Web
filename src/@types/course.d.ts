/** Môn học kèm số tài liệu/quiz để hộp xác nhận xóa nêu rõ số mục bị xóa theo (FR-CRS-03). */
interface Course {
  id: string;
  name: string;
  code: string | null;
  term: string | null;
  /** YYYY-MM-DD */
  examDate: string | null;
  createdAt: string;
  documentCount: number;
  quizCount: number;
}

interface CourseInput {
  name: string;
  code: string;
  term: string;
  /** Rỗng/null = không đặt ngày thi */
  examDate: string | null;
}
