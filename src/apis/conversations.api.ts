import { request } from "src/apis/client";

export const createConversation = (input: { courseId?: string; documentIds?: string[] }) => request<Conversation>("POST", "/conversations", { body: input });
export const getConversation = (id: string) => request<ConversationDetail>("GET", `/conversations/${id}`);
export const askQuestion = (id: string, question: string) =>
  request<ChatMessage>("POST", `/conversations/${id}/messages`, {
    body: { question },
  });

/** Đồng ý (hoặc rút lại) việc gửi đoạn tài liệu liên quan cho nhà cung cấp AI (FR-SET-01). */
export const setLlmConsent = (granted: boolean) =>
  request<{ llmConsentAt: string | null }>("PUT", "/me/llm-consent", {
    body: { granted },
  });

export const listConversations = (q?: string) => request<Conversation[]>("GET", `/conversations${q ? `?q=${encodeURIComponent(q)}` : ""}`);
export const renameConversation = (id: string, title: string) => request<Conversation>("PATCH", `/conversations/${id}`, { body: { title } });
export const deleteConversation = (id: string) => request<null>("DELETE", `/conversations/${id}`);

/** 1 = hữu ích, -1 = không hữu ích, null = bỏ đánh giá (FR-ASK-08). */
export const setFeedback = (conversationId: string, messageId: string, value: 1 | -1 | null) =>
  request<{ feedback: 1 | -1 | null }>("PUT", `/conversations/${conversationId}/messages/${messageId}/feedback`, { body: { value } });
