import { Navigate, Outlet } from "react-router-dom";
import Loading from "src/components/Loading/Loading";
import { PATH } from "src/constants/paths";
import { useAuth } from "src/hooks/useAuth";

/** Trang dành cho khách (đăng nhập, đăng ký): đã đăng nhập thì chuyển vào trang chính. */
export default function UnauthenticatedGuard() {
  const { status } = useAuth();
  if (status === "loading") return <Loading />;
  if (status === "authed") return <Navigate to={PATH.HOME} replace />;
  return <Outlet />;
}
