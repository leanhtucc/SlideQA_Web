import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  // Import tuyệt đối dạng `src/...` (khớp tsconfig paths), giống cấu trúc mẫu.
  resolve: { alias: { src: "/src" } },
  // Cổng 5173 khớp CORS_ORIGIN mặc định của backend.
  server: { port: 5173, strictPort: true },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/setupTests.ts",
    css: false,
    fileParallelism: false,
  },
});
