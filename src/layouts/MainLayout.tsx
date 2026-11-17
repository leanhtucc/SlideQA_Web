import type { ReactNode } from "react";
import Sidebar from "src/components/Sidebar/Sidebar";

/** Khung vùng đã đăng nhập: sidebar + nội dung. Dưới 768px sidebar nằm trên cùng. Các page tự bọc nội dung bằng layout này. */
export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="shell">
      <Sidebar />
      <main className="main">{children}</main>
    </div>
  );
}
