interface Conversation {
  id: string;
  title: string;
  courseId: string | null;
  /** Rỗng = theo môn (hoặc tất cả tài liệu nếu không có môn) */
  scopeDocumentIds: string[];
  createdAt: string;
  updatedAt: string;
}

/** Nguồn trích dẫn của một câu trả lời; lưu sẵn tên và đoạn gốc nên vẫn xem được khi tài liệu đã bị xóa. */
interface MessageSource {
  n: number;
  documentId: string | null;
  documentName: string;
  page: number;
  snippet: string;
  documentDeleted: boolean;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** llm: AI tổng hợp · extractive: chỉ đoạn gốc · no-match: không đủ căn cứ */
  mode: "llm" | "extractive" | "no-match" | null;
  feedback: number | null;
  createdAt: string;
  sources: MessageSource[];
}

interface ConversationDetail extends Conversation {
  messages: ChatMessage[];
}
