import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "src/apis/client";

/** Chỉ thử lại khi mất mạng (tối đa 2 lần); lỗi có mã từ máy chủ (404, 422...) thì báo ngay. */
export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: (count, e) => e instanceof ApiError && e.status === 0 && count < 2,
        staleTime: 15_000,
      },
      mutations: { retry: false },
    },
  });
