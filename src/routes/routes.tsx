import { lazy, Suspense } from "react";
import { BrowserRouter, useRoutes } from "react-router-dom";
import Loading from "src/components/Loading/Loading";
import authRoutes from "./AuthRoutes";
import homeRoutes from "./HomeRoutes";
import legalRoutes from "./LegalRoutes";

const NotFound = lazy(() => import("src/pages/NotFound/NotFound"));

/** Gộp route của từng tính năng; tách riêng để test bằng MemoryRouter. */
export function AppRoutes() {
  return useRoutes([
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
}

export default function Routes() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
