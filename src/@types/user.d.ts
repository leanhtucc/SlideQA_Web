// Kiểu toàn cục (không cần import), theo cấu trúc mẫu src/@types.
interface User {
  id: string;
  email: string;
  displayName: string;
  role: "learner" | "admin";
  llmConsentAt: string | null;
}
