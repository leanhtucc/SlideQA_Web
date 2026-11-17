import { request } from "src/apis/client";
import { session } from "src/helpers/session";

function store(r: AuthResult): User {
  session.setAccess(r.accessToken);
  session.setRefresh(r.refreshToken);
  return r.user;
}

export async function register(input: { email: string; password: string; displayName: string; acceptTerms: true }): Promise<User> {
  return store(
    await request<AuthResult>("POST", "/auth/register", {
      body: input,
      auth: false,
    }),
  );
}

export async function login(input: { email: string; password: string }): Promise<User> {
  return store(
    await request<AuthResult>("POST", "/auth/login", {
      body: input,
      auth: false,
    }),
  );
}

/** Xóa phiên phía máy trước (luôn thành công), rồi báo server thu hồi refresh token nếu được. */
export async function logout(): Promise<void> {
  const rt = session.getRefresh();
  session.clear();
  if (rt)
    await request("POST", "/auth/logout", {
      body: { refreshToken: rt },
      auth: false,
    }).catch(() => undefined);
}

export const getMe = () => request<User>("GET", "/me");
