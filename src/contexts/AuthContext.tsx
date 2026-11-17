import { useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as authApi from "src/apis/auth.api";
import * as consentApi from "src/apis/conversations.api";
import { ApiError, refreshSession, setSessionExpiredHandler } from "src/apis/client";
import { session } from "src/helpers/session";

/** loading: đang khôi phục phiên · error: không kết nối được khi khôi phục (giữ phiên, cho thử lại) */
export type AuthStatus = "loading" | "authed" | "guest" | "error";

export interface AuthValue {
  status: AuthStatus;
  user: User | null;
  /** true khi phiên vừa hết hạn giữa chừng: trang đăng nhập hiện thông báo */
  expired: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { email: string; password: string; displayName: string }) => Promise<void>;
  logout: () => Promise<void>;
  retryRestore: () => void;
  /** Người dùng đã từ chối gửi dữ liệu cho AI trong phiên này (không hỏi lại mỗi câu) */
  llmDeclined: boolean;
  /** Đồng ý (true) hoặc từ chối/rút lại (false) việc gửi đoạn tài liệu cho nhà cung cấp AI (FR-SET-01) */
  setLlmConsent: (granted: boolean) => Promise<void>;
}

export const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [expired, setExpired] = useState(false);
  const [llmDeclined, setLlmDeclined] = useState(false);
  const started = useRef(false);
  const queryClient = useQueryClient();

  const restore = useCallback(async () => {
    setStatus("loading");
    if (!session.getRefresh()) return setStatus("guest");
    try {
      if (!(await refreshSession())) return setStatus("guest");
      setUser(await authApi.getMe());
      setStatus("authed");
    } catch (e) {
      // Mất mạng: giữ phiên và cho thử lại. Lỗi khác: coi như chưa đăng nhập.
      if (e instanceof ApiError && e.status === 0) return setStatus("error");
      session.clear();
      setStatus("guest");
    }
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      queryClient.clear(); // dữ liệu của người cũ không được còn trong cache
      setUser(null);
      setExpired(true);
      setStatus("guest");
    });
    if (!started.current) {
      started.current = true; // StrictMode chạy effect hai lần
      void restore();
    }
    return () => setSessionExpiredHandler(null);
  }, [restore, queryClient]);

  const value = useMemo<AuthValue>(
    () => ({
      status,
      user,
      expired,
      login: async (email, password) => {
        setUser(await authApi.login({ email, password }));
        setExpired(false);
        setStatus("authed");
      },
      register: async (input) => {
        setUser(await authApi.register({ ...input, acceptTerms: true }));
        setExpired(false);
        setStatus("authed");
      },
      logout: async () => {
        await authApi.logout();
        queryClient.clear();
        setUser(null);
        setExpired(false);
        setLlmDeclined(false);
        setStatus("guest");
      },
      retryRestore: () => void restore(),
      llmDeclined,
      setLlmConsent: async (granted) => {
        const r = await consentApi.setLlmConsent(granted);
        setUser((u) => (u ? { ...u, llmConsentAt: r.llmConsentAt } : u));
        setLlmDeclined(!granted);
      },
    }),
    [status, user, expired, restore, queryClient, llmDeclined],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
