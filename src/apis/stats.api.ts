import { request } from "src/apis/client";

export interface Stats {
  documents: number;
  questions: number;
  quizzes: number;
  attempts: number;
  /** Phần trăm đúng trung bình của các lượt đã nộp; null khi chưa làm quiz nào */
  averageScorePct: number | null;
  flashcards: { total: number; due: number };
  courses: { id: string; name: string; documents: number; quizzes: number; attempts: number; averageScorePct: number | null }[];
  weakTopics: { documentId: string | null; documentName: string | null; page: number; wrong: number }[];
}

export const getStats = () => request<Stats>("GET", "/stats");
