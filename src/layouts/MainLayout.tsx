import { useEffect, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "src/components/Sidebar/Sidebar";

const TITLES: [string, string][] = [
  ["/app/quizzes/attempt", "Làm quiz"],
  ["/app/quizzes", "Quiz"],
  ["/app/flashcards", "Thẻ ghi nhớ"],
  ["/app/stats", "Thống kê"],
  ["/app/history", "Lịch sử"],
  ["/app/settings", "Cài đặt"],
  ["/app/courses", "Môn học"],
  ["/app", "Tổng quan"],
];

/** Khung vùng đã đăng nhập: sidebar + nội dung. Dưới 768px sidebar nằm trên cùng. Các page tự bọc nội dung bằng layout này. */
export default function MainLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  useEffect(() => {
    const t = TITLES.find(([p]) => pathname === p || pathname.startsWith(p + "/"))?.[1];
    document.title = t ? `${t} · Slide QA` : "Slide QA";
  }, [pathname]);
  return (
    <div className="shell">
      <Sidebar />
      <main className="main">{children}</main>
    </div>
  );
}
