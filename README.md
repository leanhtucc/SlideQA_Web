# Slide QA — Web

React 19 + TypeScript + Vite. Kế hoạch và thiết kế: `plan.md`.

## Chạy

```bash
npm install
cp .env.example .env        # VITE_API_URL trỏ tới backend (mặc định http://localhost:3000/api/v1)
npm run dev                 # http://localhost:5173 (đúng với CORS_ORIGIN mặc định của backend)
```

Backend: chạy ở `SlideQA_BE/backend-basic` với `LLM_PROVIDER=mock` để không cần khóa AI.
**Không đặt khóa bí mật nào trong `.env` của web**: mọi biến `VITE_*` đều lộ ra trình duyệt.

## Lệnh

| Lệnh | Việc |
| --- | --- |
| `npm test` | Vitest (client API, form, route guard, khôi phục phiên) |
| `npm run typecheck` | Kiểm tra kiểu |
| `npm run build` | Build production vào `dist/` (mỗi page là một chunk, tải lazy) |

## Cấu trúc `src/`

Theo mẫu [React-Folder-Structure](https://github.com/duthanhduoc/React-Folder-Structure/tree/master/src), bỏ phần Redux (không dùng). Import tuyệt đối dạng `src/...` (alias trong `vite.config.ts` và `tsconfig.json`).

```
src/
├─ @types/        kiểu toàn cục (user.d.ts, api.d.ts)
├─ App/           App.tsx: AuthProvider + Routes
├─ apis/          client.ts (gọi API, tự refresh token), auth.api.ts
├─ assets/css/    tokens.css (từ bản thiết kế), index.css
├─ components/    <Tên>/<Tên>.tsx: Alert, Field, Loading, Logo, Placeholder
├─ constants/     paths.ts (PATH)
├─ contexts/      AuthContext.tsx (thay cho store của Redux)
├─ guards/        AuthenticatedGuard, UnauthenticatedGuard
├─ helpers/       session.ts, validate.ts
├─ hooks/         useAuth.ts
├─ layouts/       AuthLayout, MainLayout
├─ pages/         <Tên>/<Tên>.tsx (+ .constants.ts cạnh nó): Login, Register, Home, ...
├─ routes/        routes.tsx gộp AuthRoutes, HomeRoutes, LegalRoutes (lazy + Suspense)
├─ test/          mockApi.ts (backend giả cho test)
├─ setupTests.ts
└─ main.tsx       điểm vào của Vite
```

Thêm một tính năng mới: tạo `pages/<Tên>/`, thêm route vào file `routes/*Routes.tsx` tương ứng, hằng đường dẫn vào `constants/paths.ts`.

Phiên: access token chỉ ở bộ nhớ; refresh token lưu `localStorage` để F5 vẫn đăng nhập.
