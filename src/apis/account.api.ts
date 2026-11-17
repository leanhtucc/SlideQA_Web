import { request } from "src/apis/client";

/** Luôn thành công dù email có tồn tại hay không (server không lộ email nào đã đăng ký). */
export const forgotPassword = (email: string) => request<null>("POST", "/auth/forgot", { body: { email }, auth: false });
export const resetPassword = (token: string, password: string) => request<null>("POST", "/auth/reset", { body: { token, password }, auth: false });

export const updateProfile = (displayName: string) => request<User>("PATCH", "/me", { body: { displayName } });
/** Thành công thì mọi phiên bị thu hồi, người dùng phải đăng nhập lại. */
export const changePassword = (currentPassword: string, newPassword: string) => request<null>("POST", "/me/password", { body: { currentPassword, newPassword } });
export const deleteAccount = (password: string) => request<null>("DELETE", "/me", { body: { password } });
