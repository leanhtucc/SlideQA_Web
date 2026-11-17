import { lazy, Suspense } from "react";
import { BrowserRouter, useRoutes } from "react-router-dom";
import ErrorBoundary from "src/components/ErrorBoundary/ErrorBoundary";
import Loading from "src/components/Loading/Loading";
import OfflineBanner from "src/components/OfflineBanner/OfflineBanner";
import Toaster from "src/components/Toaster/Toaster";
import authRoutes from "./AuthRoutes";
import homeRoutes from "./HomeRoutes";
import legalRoutes from "./LegalRoutes";

const NotFound = lazy(() => import("src/pages/NotFound/NotFound"));

/** Gộp route của từng tính năng; tách riêng để test bằng MemoryRouter. */
export function AppRoutes() {
  const element = useRoutes([
    ...authRoutes,
    ...legalRoutes,
    ...homeRoutes,
    {
      path: "*",
      element: (
        <Suspense fallback={<Loading />}>
          <NotFound />
        </Suspense>
      ),
    },
  ]);
  // Banner mất mạng và nơi vẽ toast nằm ngoài từng trang để luôn hiện; ErrorBoundary chặn lỗi vẽ giao diện.
  return (
    <ErrorBoundary>
      <OfflineBanner />
      {element}
      <Toaster />
    </ErrorBoundary>
  );
}

export default function Routes() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
