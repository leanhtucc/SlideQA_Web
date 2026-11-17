import { lazy, Suspense } from "react";
import { Navigate, type RouteObject } from "react-router-dom";
import Loading from "src/components/Loading/Loading";
import { PATH } from "src/constants/paths";
import AuthenticatedGuard from "src/guards/AuthenticatedGuard";

const Home = lazy(() => import("src/pages/Home/Home"));
const CourseDetail = lazy(() => import("src/pages/CourseDetail/CourseDetail"));
const Study = lazy(() => import("src/pages/Study/Study"));
const History = lazy(() => import("src/pages/History/History"));
const Quizzes = lazy(() => import("src/pages/Quizzes/Quizzes"));
const Attempt = lazy(() => import("src/pages/Attempt/Attempt"));
const Settings = lazy(() => import("src/pages/Settings/Settings"));

/** Vùng đã đăng nhập; các màn W2 trở đi (môn học, học, quiz...) thêm vào đây. */
const homeRoutes: RouteObject[] = [
  {
    element: <AuthenticatedGuard />,
    children: [
      {
        path: PATH.HOME,
        element: (
          <Suspense fallback={<Loading />}>
            <Home />
          </Suspense>
        ),
      },
      {
        path: PATH.COURSE,
        element: (
          <Suspense fallback={<Loading />}>
            <CourseDetail />
          </Suspense>
        ),
      },
      {
        path: PATH.STUDY,
        element: (
          <Suspense fallback={<Loading />}>
            <Study />
          </Suspense>
        ),
      },
      {
        path: PATH.HISTORY,
        element: (
          <Suspense fallback={<Loading />}>
            <History />
          </Suspense>
        ),
      },
      {
        path: PATH.QUIZZES,
        element: (
          <Suspense fallback={<Loading />}>
            <Quizzes />
          </Suspense>
        ),
      },
      {
        path: PATH.ATTEMPT,
        element: (
          <Suspense fallback={<Loading />}>
            <Attempt />
          </Suspense>
        ),
      },
      {
        path: PATH.SETTINGS,
        element: (
          <Suspense fallback={<Loading />}>
            <Settings />
          </Suspense>
        ),
      },
    ],
  },
  { path: PATH.ROOT, element: <Navigate to={PATH.HOME} replace /> },
];

export default homeRoutes;
