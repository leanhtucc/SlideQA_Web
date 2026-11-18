import { Link } from "react-router-dom";
import Logo from "src/components/Logo/Logo";
import { PATH } from "src/constants/paths";
import { LEGAL } from "src/pages/Legal/Legal";

const STEPS = [
  { t: "Tải slide lên", d: "Kéo thả PDF vào từng môn học. Trang nào không có chữ (ảnh scan) sẽ được báo rõ, không âm thầm bỏ qua." },
  { t: "Hỏi như nhắn tin", d: "Gõ có dấu hay không dấu đều được. Mỗi ý trả lời gắn số nguồn; bấm vào là slide mở đúng trang và tô sáng đoạn gốc." },
  { t: "Tự ôn bằng quiz", d: "Chọn khoảng trang, nhận câu trắc nghiệm kèm giải thích và số trang căn cứ. Làm lại riêng câu sai, ôn thẻ theo lịch." },
];

const PROMISES = [
  { t: "Kiểm chứng được", d: 'Không đủ căn cứ trong tài liệu thì Slide QA nói "Tài liệu không có thông tin này" thay vì đoán.' },
  { t: "Sát đề thi", d: "Câu hỏi và quiz sinh từ chính slide giảng viên đưa, không phải kiến thức chung chung." },
  { t: "Dùng được trên điện thoại", d: "Giao diện co giãn từ 360px; trên màn nhỏ, PDF và hội thoại chuyển thành hai tab." },
];

const PRIVACY = [
  "Tài liệu chỉ hiển thị với tài khoản đã tải lên",
  "Không ghi nội dung câu hỏi hay tài liệu vào nhật ký máy chủ",
  "Xóa tài khoản là xóa ngay dữ liệu và tệp gốc",
  "Chỉ tải tài liệu bạn có quyền sử dụng",
];

/** Trang giới thiệu ở "/" cho khách (đã đăng nhập thì được chuyển vào /app). Theo artboard Landing của bản thiết kế. */
export default function Landing() {
  return (
    <div className="lp">
      <header className="lp-pad lp-head">
        <Link to={PATH.ROOT} aria-label="Slide QA">
          <Logo />
        </Link>
        <nav className="lp-nav" aria-label="Chính">
          <a className="btn btn-ghost lp-hide-sm" href="#cach-hoat-dong">
            Cách hoạt động
          </a>
          <a className="btn btn-ghost lp-hide-sm" href="#rieng-tu">
            Quyền riêng tư
          </a>
          <Link className="btn btn-secondary" to={PATH.LOGIN}>
            Đăng nhập
          </Link>
          <Link className="btn btn-primary" to={PATH.REGISTER}>
            Dùng thử miễn phí
          </Link>
        </nav>
      </header>

      <section className="lp-pad lp-hero">
        <div className="lp-hero-text">
          <span className="badge badge-info" style={{ alignSelf: "flex-start" }}>
            Cho sinh viên · tiếng Việt có dấu và không dấu
          </span>
          <h1 className="lp-title">
            Hỏi slide của bạn, nhận câu trả lời <span className="mark">kèm số trang</span>
          </h1>
          <p className="muted lp-lead">
            Tải PDF slide hoặc giáo trình lên. Slide QA chỉ trả lời từ chính tài liệu đó, chỉ rõ trang nào, và tạo câu hỏi trắc nghiệm để bạn tự ôn.
          </p>
          <div className="lp-cta">
            <Link className="btn btn-primary lp-btn-lg" to={PATH.REGISTER}>
              Bắt đầu miễn phí
            </Link>
            <a className="btn btn-secondary lp-btn-lg" href="#cach-hoat-dong">
              Xem cách hoạt động
            </a>
          </div>
          <p className="small muted">Đây là công cụ hỗ trợ học. Bạn nên đối chiếu lại trang nguồn và tuân thủ quy định dùng AI của trường mình.</p>
        </div>
        <div className="lp-hero-art">
          <div className="card lp-art">
            <svg viewBox="0 0 360 240" width="100%" role="img" aria-label="Trang slide được tô vàng và câu trả lời có số nguồn">
              <rect x="70" y="26" width="150" height="190" rx="10" fill="#fff" stroke="#C9C5B8" />
              <rect x="88" y="48" width="60" height="9" rx="4.5" fill="#C9C5B8" />
              <rect x="88" y="72" width="114" height="7" rx="3.5" fill="#E2DFD6" />
              <rect x="84" y="96" width="122" height="20" rx="5" fill="#FFE066" />
              <rect x="88" y="102" width="108" height="8" rx="4" fill="#2A2300" opacity=".55" />
              <rect x="88" y="130" width="100" height="7" rx="3.5" fill="#E2DFD6" />
              <rect x="88" y="148" width="114" height="7" rx="3.5" fill="#E2DFD6" />
              <rect x="88" y="166" width="70" height="7" rx="3.5" fill="#E2DFD6" />
              <rect x="170" y="190" width="38" height="18" rx="9" fill="#0E6B63" />
              <text x="189" y="203" textAnchor="middle" fontFamily="Be Vietnam Pro,sans-serif" fontSize="10" fontWeight="700" fill="#fff">
                tr.2
              </text>
              <rect x="196" y="60" width="140" height="84" rx="14" fill="#0E6B63" />
              <path d="M212 144l-12 18 28-18z" fill="#0E6B63" />
              <rect x="212" y="78" width="96" height="8" rx="4" fill="#fff" opacity=".9" />
              <rect x="212" y="96" width="108" height="8" rx="4" fill="#fff" opacity=".9" />
              <rect x="212" y="114" width="52" height="8" rx="4" fill="#fff" opacity=".9" />
              <rect x="268" y="110" width="26" height="18" rx="6" fill="#FFE066" />
              <text x="281" y="123" textAnchor="middle" fontFamily="Be Vietnam Pro,sans-serif" fontSize="11" fontWeight="700" fill="#2A2300">
                1
              </text>
            </svg>
          </div>
        </div>
      </section>

      <section id="cach-hoat-dong" className="lp-pad lp-band">
        <div className="stack" style={{ gap: 8, maxWidth: 640 }}>
          <h2 className="h1">Ba bước, mọi thứ đều có nguồn</h2>
          <p className="muted">Không cần chuẩn bị gì ngoài file PDF bạn đã có.</p>
        </div>
        <div className="lp-grid lp-grid-steps">
          {STEPS.map((s, i) => (
            <div key={s.t} className="stack" style={{ gap: 10 }}>
              <div className="avatar" style={{ width: 44, height: 44, borderRadius: 12, fontSize: 18 }}>
                {i + 1}
              </div>
              <h3 className="h3">{s.t}</h3>
              <p className="muted small">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-pad lp-grid lp-grid-cards">
        {PROMISES.map((p) => (
          <div key={p.t} className="card card-pad stack" style={{ gap: 8 }}>
            <h3 className="h3">{p.t}</h3>
            <p className="small muted">{p.d}</p>
          </div>
        ))}
      </section>

      <section id="rieng-tu" className="lp-pad" style={{ paddingTop: 0, paddingBottom: 64 }}>
        <div className="card lp-privacy">
          <div className="stack" style={{ flex: "1 1 360px", gap: 10 }}>
            <h2 className="h2">Dữ liệu của bạn là của riêng bạn</h2>
            <p className="muted">Khi hỏi, chỉ vài đoạn liên quan được gửi tới nhà cung cấp AI, và chỉ sau khi bạn đồng ý rõ ràng. Bạn có thể rút lại đồng ý hoặc xóa tài khoản bất cứ lúc nào.</p>
          </div>
          <ul className="stack small" style={{ flex: "1 1 300px", gap: 8, margin: 0, padding: 0, listStyle: "none" }}>
            {PRIVACY.map((t) => (
              <li key={t} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <svg className="ic" viewBox="0 0 24 24" aria-hidden="true" style={{ color: "var(--primary)", flex: "none" }}>
                  <path d="M5 12l5 5 9-10" />
                </svg>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="lp-pad lp-foot small" style={{ flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, width: "100%" }}>
          <span className="muted">© 2026 Slide QA · Vận hành bởi {LEGAL.org} · Liên hệ: {LEGAL.email}</span>
          <span style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <Link to={PATH.PRIVACY} className="link-strong">
              Chính sách bảo vệ dữ liệu cá nhân
            </Link>
            <Link to={PATH.TERMS} className="link-strong">
              Điều khoản sử dụng
            </Link>
          </span>
        </div>
        <p className="tiny muted" style={{ margin: 0 }}>
          Slide QA là công cụ hỗ trợ học tập cá nhân, không thay thế giáo trình hay bài giảng của giảng viên.
        </p>
      </footer>
    </div>
  );
}
