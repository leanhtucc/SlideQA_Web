/** Tài liệu PDF của một môn. Đặt tên khác `Document` để không đụng kiểu DOM. */
interface CourseDocument {
  id: string;
  courseId: string;
  name: string;
  sizeBytes: number;
  status: "processing" | "ready" | "failed";
  /** Lý do khi status = failed */
  error: string | null;
  pages: number;
  emptyPages: number;
  createdAt: string;
  /** Cảnh báo trang không có chữ (nghi PDF scan), FR-DOC-04 */
  warning: string | null;
}
