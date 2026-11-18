import { Link, NavLink, useNavigate } from "react-router-dom";
import Logo from "src/components/Logo/Logo";
import { PATH } from "src/constants/paths";
import { useAuth } from "src/hooks/useAuth";

// Chỉ liệt kê mục đã có màn hình; mỗi lát W3+ thêm mục của mình vào đây (thiết kế có đủ 8 mục).
const NAV = [
  {
    to: PATH.HOME,
    label: "Tổng quan",
    icon: "M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  },
  {
    to: PATH.QUIZZES,
    label: "Quiz",
    icon: "M9 9a3 3 0 1 1 4 2.8c-.7.4-1 1-1 1.7M12 17h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
  },
  {
    to: PATH.FLASHCARDS,
    label: "Thẻ ghi nhớ",
    icon: "M4 7h13v11H4zM7 4h13v11",
  },
  {
    to: PATH.STATS,
    label: "Thống kê",
    icon: "M4 20V10M10 20V4M16 20v-8M22 20H2",
  },
  {
    to: PATH.HISTORY,
    label: "Lịch sử",
    icon: "M12 7v5l3 2M3 12a9 9 0 1 0 3-6.7M3 4v4h4",
  },
  {
    to: PATH.SETTINGS,
    label: "Cài đặt",
    icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12l2-1-2-4-2 .6a7 7 0 0 0-1.6-1L15 4h-4l-.4 2.6a7 7 0 0 0-1.6 1L7 7 5 11l2 1a7 7 0 0 0 0 2l-2 1 2 4 2-.6a7 7 0 0 0 1.6 1L11 20h4l.4-2.6a7 7 0 0 0 1.6-1l2 .6 2-4-2-1a7 7 0 0 0 0-2z",
  },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initials = (user?.displayName ?? "?")
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="sidebar">
      <Link to={PATH.HOME} aria-label="Slide QA, về tổng quan">
        <Logo size={30} />
      </Link>
      <nav className="nav" aria-label="Chính">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}>
            <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
              <path d={n.icon} />
            </svg>
            {n.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-user">
        <span className="avatar" aria-hidden="true">
          {initials}
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            className="h4"
            title={user?.displayName}
            style={{
              fontSize: 14,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {user?.displayName}
          </div>
          <div className="tiny muted">Người học</div>
        </div>
        <button
          className="btn btn-ghost btn-sm btn-icon"
          aria-label="Đăng xuất"
          title="Đăng xuất"
          onClick={async () => {
            await logout();
            navigate(PATH.LOGIN, { replace: true });
          }}
        >
          <svg className="ic ic-sm" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
