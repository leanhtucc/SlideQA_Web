import { lazy, Suspense } from "react";
import type { RouteObject } from "react-router-dom";
import Loading from "src/components/Loading/Loading";
import { PATH } from "src/constants/paths";
import UnauthenticatedGuard from "src/guards/UnauthenticatedGuard";

const Login = lazy(() => import("src/pages/Login/Login"));
const Register = lazy(() => import("src/pages/Register/Register"));
const ForgotPassword = lazy(() => import("src/pages/ForgotPassword/ForgotPassword"));
const ResetPassword = lazy(() => import("src/pages/ResetPassword/ResetPassword"));

const page = (el: React.ReactNode) => <Suspense fallback={<Loading />}>{el}</Suspense>;

/** Đăng nhập, đăng ký (chỉ cho khách) và quên mật khẩu. */
const authRoutes: RouteObject[] = [
  {
    element: <UnauthenticatedGuard />,
    children: [
      { path: PATH.LOGIN, element: page(<Login />) },
      { path: PATH.REGISTER, element: page(<Register />) },
    ],
  },
  { path: PATH.FORGOT_PASSWORD, element: page(<ForgotPassword />) },
  { path: PATH.RESET_PASSWORD, element: page(<ResetPassword />) },
];

export default authRoutes;
