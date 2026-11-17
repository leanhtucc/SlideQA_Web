import { Link } from "react-router-dom";
import Logo from "src/components/Logo/Logo";
import { PATH } from "src/constants/paths";

/** Trang giữ chỗ cho nội dung chưa có (quên mật khẩu, điều khoản, chính sách, 404). */
export default function Placeholder({ title, note }: { title: string; note: string }) {
  return (
    <main className="center-screen">
      <div className="stack" style={{ maxWidth: 520, gap: 16 }}>
        <Link to={PATH.LOGIN}>
          <Logo />
        </Link>
        <h1 className="h1">{title}</h1>
        <p className="muted">{note}</p>
        <Link to={PATH.LOGIN} className="btn btn-secondary" style={{ alignSelf: "flex-start" }}>
          Về trang đăng nhập
        </Link>
      </div>
    </main>
  );
}
