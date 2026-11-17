import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import Logo from "src/components/Logo/Logo";
import { PATH } from "src/constants/paths";

/** Bố cục hai cột của trang đăng nhập/đăng ký (thiết kế WEB-S01); dưới 768px chỉ còn cột form. */
export default function AuthLayout({ aside, children }: { aside: ReactNode; children: ReactNode }) {
  return (
    <div className="auth">
      <aside className="auth-aside">
        <Link to={PATH.LOGIN} aria-label="Slide QA">
          <Logo light size={36} />
        </Link>
        {aside}
        <span className="small" style={{ opacity: 0.85 }}>Công cụ hỗ trợ học tập · tiếng Việt có dấu và không dấu</span>
      </aside>
      <main className="auth-main">
        <div className="auth-form">
          <div className="auth-brand-mobile">
            <Logo />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
