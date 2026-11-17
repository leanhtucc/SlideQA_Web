import { Navigate, Outlet, useLocation } from "react-router-dom";
import Loading from "src/components/Loading/Loading";
import { PATH } from "src/constants/paths";
import { useAuth } from "src/hooks/useAuth";

/** Chỉ cho người đã đăng nhập vào; chưa thì về /login và nhớ trang định vào. */
export default function AuthenticatedGuard() {
  const { status, retryRestore } = useAuth();
  const location = useLocation();
  if (status === "loading") return <Loading />;
  if (status === "error") {
    return (
      <div className="center-screen">
        <div className="stack" style={{ maxWidth: 420 }}>
          <div className="alert alert-err" role="alert">
            Không kết nối được máy chủ. Phiên đăng nhập của bạn vẫn được giữ.
          </div>
          <button className="btn btn-primary" onClick={retryRestore}>
            Thử lại
          </button>
        </div>
      </div>
    );
  }
  if (status === "guest") return <Navigate to={PATH.LOGIN} replace state={{ from: location.pathname + location.search }} />;
  return <Outlet />;
}
