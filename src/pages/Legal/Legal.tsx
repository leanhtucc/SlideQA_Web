import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import Logo from "src/components/Logo/Logo";
import { PATH } from "src/constants/paths";

/**
 * Thông tin pháp nhân do chủ dự án điền trước khi ra mắt (không tự nghĩ ra).
 * Đặt qua biến môi trường VITE_*; chưa đặt thì trang hiện nguyên chỗ `[ĐIỀN: …]` để không ai bỏ sót.
 */
export const LEGAL = {
  org: (import.meta.env.VITE_LEGAL_ENTITY as string | undefined) || "[ĐIỀN: tên cá nhân/đơn vị vận hành Slide QA]",
  email: (import.meta.env.VITE_CONTACT_EMAIL as string | undefined) || "[ĐIỀN: email nhận yêu cầu về dữ liệu cá nhân]",
  /** Khớp TERMS_VERSION của backend: phiên bản người dùng đã đồng ý lúc đăng ký */
  version: "2026-11",
  updated: "17/11/2026",
};

/** Khung chung cho trang văn bản pháp lý, đọc được khi chưa đăng nhập. */
export default function Legal({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="center-screen" style={{ alignItems: "flex-start" }}>
      <article className="stack" style={{ maxWidth: 760, gap: 14, width: "100%" }}>
        <Link to={PATH.LOGIN}>
          <Logo />
        </Link>
        <h1 className="h1">{title}</h1>
        <p className="small muted">
          Phiên bản {LEGAL.version} · cập nhật {LEGAL.updated}
        </p>
        {children}
        <Link to={PATH.LOGIN} className="btn btn-secondary" style={{ alignSelf: "flex-start" }}>
          Về trang đăng nhập
        </Link>
      </article>
    </main>
  );
}

export const H2 = ({ children }: { children: ReactNode }) => <h2 className="h2" style={{ marginTop: 10 }}>{children}</h2>;
