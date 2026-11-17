export const PATH = {
  ROOT: "/",
  HOME: "/app",
  COURSE: "/app/courses/:id",
  STUDY: "/app/study/:id",
  HISTORY: "/app/history",
  QUIZZES: "/app/quizzes",
  ATTEMPT: "/app/attempts/:id",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot",
  TERMS: "/terms",
  PRIVACY: "/privacy",
} as const;

export const coursePath = (id: string) => PATH.COURSE.replace(":id", id);

export const studyPath = (conversationId: string) => PATH.STUDY.replace(":id", conversationId);

export const attemptPath = (attemptId: string) => PATH.ATTEMPT.replace(":id", attemptId);
