import { QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { createQueryClient } from "src/apis/queryClient";
import { AuthProvider } from "src/contexts/AuthContext";
import { AppRoutes } from "src/routes/routes";

/** Dựng toàn bộ app (router + cache + phiên đăng nhập) tại một đường dẫn, với cache mới cho mỗi test. */
export function renderApp(path: string) {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter initialEntries={[path]}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
