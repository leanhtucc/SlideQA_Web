import { lazy, Suspense } from "react";
import type { RouteObject } from "react-router-dom";
import Loading from "src/components/Loading/Loading";
import { PATH } from "src/constants/paths";

const Terms = lazy(() => import("src/pages/Terms/Terms"));
const Privacy = lazy(() => import("src/pages/Privacy/Privacy"));

const page = (el: React.ReactNode) => <Suspense fallback={<Loading />}>{el}</Suspense>;

/** Điều khoản và chính sách: xem được cả khi chưa đăng nhập. */
const legalRoutes: RouteObject[] = [
  { path: PATH.TERMS, element: page(<Terms />) },
  { path: PATH.PRIVACY, element: page(<Privacy />) },
];

export default legalRoutes;
