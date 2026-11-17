# plan.md — Slide QA (bản Web, làm trước)

> Căn cứ: SRS "Slide QA (Web & Mobile)" (16/11/2026), mục 12.9: làm **P1 → P2 → P3 → P6**, mobile (P4, P5) hoãn.
> Trạng thái: **Đã chốt Q1–Q9, chờ bạn duyệt để bắt đầu B0**. Chưa viết dòng code nào cho tới khi bạn duyệt file này.

---

## Giai đoạn D — Thiết kế (làm TRƯỚC khi code, chờ duyệt)

Bản thiết kế: https://claude.ai/artifact/BHFHhsQRWgAvqKtwrmnw6U (25 artboard, riêng tư).
Hướng: "giấy & bút dạ quang" — nền giấy ấm, teal `#0E6B63` cho hành động, **vàng `#FFE066` chỉ dành cho nguồn trích dẫn**, phông Be Vietnam Pro, sáng/tối.
Gồm: Design system (màu, chữ, khoảng cách, bo góc, bóng) · Logo · Minh họa · Components · Modal & trạng thái · Luồng & logic · Landing · Đăng nhập/Đăng ký/Quên MK · Tổng quan · Chi tiết môn · Không gian học (sáng + tối) · Lịch sử · Cài đặt · Flashcard · Thống kê · Quiz (thiết lập/làm bài/kết quả) · 4 màn 360–390px.
Chưa thiết kế (cố ý): trang Quản trị S10 (Could, P7), nội dung trang Chính sách/Điều khoản (soạn bằng skill `vn-law-check` sau khi duyệt), màn đặt lại MK qua Google OAuth.
Khi duyệt: `tokens.css` của bản thiết kế → `SlideQAWeb/src/styles/tokens.css`; mỗi mục ở artboard Components → một component React.

---

## 0. Hiện trạng đã khảo sát (thực tế, không phải giả định)

| Thứ | Thực tế tìm thấy |
| --- | --- |
| `SlideQAWeb/` | **Trống** (thư mục dự án web) |
| `SlideQA_BE/backend-basic/` | Skeleton Express 5 + Prisma 6 + PostgreSQL (Docker) + bcrypt + JWT. Schema hiện chỉ có model `Todo` (mẫu). `app.ts` **rỗng**; `auth.routes.ts` chỉ có `// TODO`. Có Dockerfile, `docker-compose(.prod).yml`, git riêng |
| MVP `slide-qa` (`SlideQA_Code_v1.zip`, **đã đọc**) | ESM + `tsx`, ~270 dòng: `bm25.ts` (BM25 + bỏ dấu + bigram + ngưỡng độ phủ 0.3 + `chunkPages`), `pdf.ts` (`pdfjs-dist/legacy`, trích chữ từng trang), `llm.ts` (gọi Anthropic bằng `fetch`, 3 mode `llm/extractive/no-match`, `makeQuiz` loại câu sai trang), `store.ts` (db.json, sẽ bỏ), `server.ts` (sẽ viết lại), `bm25.test.ts` (7 test) |

Hệ quả: **Q2 đã giải quyết.** `bm25.ts`, `pdf.ts`, `bm25.test.ts` chuyển gần như nguyên sang BE (B5, B4); `llm.ts` tái dùng prompt/validate nhưng tách thành adapter (đọc key lúc import, không mock được, không retry). `store.ts`/`server.ts` bỏ. Phần còn lại của P1 (auth, DB, job, phân quyền, hội thoại, quiz lưu DB) viết mới trên skeleton.

**Lệch kỹ thuật phát hiện được (cần xử lý ở B0):**
- MVP là **ESM** (`"type":"module"`, import đuôi `.js`, chạy bằng `tsx`); `backend-basic` là CommonJS + `ts-node-dev`, nhưng tsconfig đã `module: nodenext`. `pdfjs-dist` chỉ có ESM → **chuyển BE sang ESM + `tsx`** (bỏ `ts-node-dev`).
- `tsconfig` BE bật `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`: mã MVP phải sửa vài chỗ (vd `idx.search(...)[0].chunk`).
- MVP dùng `typescript ^7.0.2`, `@types/node ^26`: kiểm tra phiên bản này cài được khi `npm install`; nếu không thì ghim theo BE (`^5.9`).
- Test MVP dùng `tsx --test` (`node:test`), khớp D9.

---

## 1. Mục tiêu

Sinh viên nạp PDF slide → hỏi đáp tiếng Việt (có/không dấu) và nhận câu trả lời **kèm số trang nguồn, bấm là PDF nhảy đúng trang** → tự ôn bằng quiz sinh từ chính tài liệu.

"Xong" của bản web = **M3** (SRS 12.9): một người dùng mới đi trọn đăng ký → nạp PDF → hỏi → bấm nguồn → làm quiz, mọi mục Should của web chạy; sau đó **M4** (đo NFR, deploy, thử với 3–5 bạn).

## 2. Phạm vi

**Trong phạm vi (bản web):** Auth, Môn học, Tài liệu (upload/xử lý nền/xem PDF), Hỏi đáp có trích dẫn, Quiz, Lịch sử, Flashcard, Thống kê, Cài đặt/xóa tài khoản/xuất dữ liệu, rate limit & hạn mức, deploy.

**Ngoài phạm vi:** toàn bộ mobile (P4, P5), P7 (OCR, PPTX, embedding, admin, iOS), học nhóm, thanh toán, chấm điểm thay giảng viên.

**Quy tắc cắt:** Must làm hết; Should làm ở P3; Could không làm.

---

## 3. Quyết định kỹ thuật đề xuất (bạn có thể đổi)

| # | Quyết định | Lý do |
| --- | --- | --- |
| D1 | Backend: **giữ Express 5 + TypeScript + Prisma + PostgreSQL** của `backend-basic` | Đã có sẵn, bạn đã quen; Prisma migrate thay cho SQL migration tay. Đổi tên package `goalbe` → `slideqa-api` |
| D2 | Mật khẩu: **bcrypt** (đã cài) | SRS cho phép argon2id *hoặc* bcrypt (NFR-05) |
| D3 | Web: **React + TypeScript + Vite**, React Router, **TanStack Query** (gọi API/polling), **pdf.js** (`react-pdf`/`pdfjs-dist`) | SRS 11; TanStack Query giải quyết sẵn polling 2s, retry, trạng thái loading/error |
| D4 | Validate input: **zod** ở mọi endpoint | Chặn lỗi ở trust boundary (NFR-10) |
| D5 | Job nền: **bảng `Job` trong PostgreSQL + 1 worker** cùng process API | Đúng SRS 11, không thêm Redis |
| D6 | Lưu file: **đĩa cục bộ (interface `Storage`) ở dev**, S3/Supabase Storage ở deploy | Interface nhỏ để đổi sau, tránh khóa nhà cung cấp |
| D7 | Tìm kiếm: **BM25 trong bộ nhớ theo từng user** (+ bỏ dấu tiếng Việt). Đo ở P6 mới quyết đổi sang full-text | SRS 11 |
| D8 | LLM: **Anthropic Messages API gọi từ server**, có **adapter + bản giả lập (mock)** để test không tốn tiền | NFR-11/14; CI không cần key thật |
| D9 | Test: backend `node:test` + supertest (DB test riêng); web Vitest + Testing Library; E2E bằng Playwright cho 1 luồng vàng | SRS 11 + đo "đã click thử thật" |
| D10 | Repo: **giữ 2 thư mục** (`SlideQA_BE/backend-basic` và `SlideQAWeb`), chưa lập monorepo/`shared` tới khi bắt đầu mobile. Kiểu API dùng chung bằng file `api-types.ts` sinh từ zod ở BE rồi copy sang web | Lười có chủ đích: `shared` chỉ có giá trị khi có client thứ 2 |

---

## 4. Câu hỏi cần bạn trả lời trước khi code (chặn việc)

| # | Câu hỏi | Mặc định nếu bạn không trả lời |
| --- | --- | --- |
| Q1 | Dừng ở **M3** hay đi đủ **M4 (deploy + đo)** cho bản nộp? | Đi đủ M4 |
| Q2 | ~~File MVP zip~~ **Đã có và đã đọc** (xem mục 0) | — |
| Q9 | Chuyển `backend-basic` sang **ESM + tsx** (như MVP) được không? | Có |
| Q3 | Có **khóa Anthropic API** + ngân sách/tháng không? (tôi sẽ **không** tự gọi API thật, bạn tự đặt vào `.env`) | Dev toàn bộ bằng mock + chế độ `extractive` |
| Q4 | Giảng viên yêu cầu mẫu SRS/báo cáo nào, có cho tải slide lên dịch vụ ngoài (Anthropic) không? | Làm theo SRS hiện có; consent gate bắt buộc |
| Q5 | Hosting dự kiến (Render/Railway/Fly/VPS/Supabase)? | Chưa chọn → hoãn tới P6, giữ code độc lập nhà cung cấp |
| Q6 | Tên sản phẩm/giao diện: có sẵn thiết kế Figma/brand không? | Tự làm UI sạch, theo skill `ui-ux-pro-max` + `frontend-design`, tiếng Việt có dấu |
| Q7 | Có muốn đăng nhập Google (P3) không — cần bạn tự tạo OAuth client | Làm ở P3 nếu bạn cấp client id |
| Q8 | Gửi email quên mật khẩu bằng dịch vụ nào (Resend/SMTP Gmail)? | Dev: in link ra console; prod: bạn chọn |

---

### Đã chốt (16/11/2026)

| # | Quyết định |
| --- | --- |
| Q1 | Đi đủ **M4** (P1+P2+P3+P6, ~180h) |
| Q2 | Đã có MVP zip (đã đọc) |
| Q3 | Dev bằng **mock LLM + extractive**; bạn tự đặt `ANTHROPIC_API_KEY` vào `.env` khi muốn thử thật, tôi không gọi API tính phí khi chưa hỏi |
| Q4 | Chưa hỏi giảng viên → consent bắt buộc, chỉ dùng cá nhân; **bạn hỏi trước khi nộp/cho bạn học thử (P6.7)**. Dev/test dùng slide tự tạo |
| Q5 | Chưa chọn hosting → quyết định ở P6 (Q5 deploy) |
| Q6 | Tôi tự thiết kế UI tiếng Việt, sáng/tối |
| Q7 | Làm Google login ở E2; **bạn tự tạo OAuth client** khi tới lượt |
| Q8 | Dev in link quên mật khẩu ra console; dịch vụ email thật chọn ở P6 |
| Q9 | Chuyển BE sang **ESM + tsx** |

## 5. Cấu trúc thư mục dự kiến

```
SlideQA_BE/backend-basic/
  prisma/schema.prisma            # 15 thực thể (SRS mục 9)
  src/
    app.ts, server.ts, config/env.ts
    middleware/ auth.ts, error.ts, rateLimit.ts, upload.ts
    modules/
      auth/ courses/ documents/ conversations/ quizzes/ flashcards/ stats/ me/
      (mỗi module: routes → controller → service → zod schema)
    lib/ storage/ (Storage interface), llm/ (Anthropic + Mock), search/ (BM25, vi-normalize), pdf/ (extract), jobs/ (worker)
  test/ (tích hợp + unit)
SlideQAWeb/
  src/
    api/ (client có tự refresh token, hooks TanStack Query)
    routes/ (WEB-S01…S09)   components/   features/ {auth,courses,documents,study,quiz,flashcards,stats,settings}
    lib/ (format, a11y helpers)   styles/ (design tokens, dark mode)
  e2e/ (Playwright)
  docs/ manual-checklist.md, eval-questions.md, legal-checklist.md
```

---

## 6. Lộ trình theo lát cắt (mỗi lát cắt **chạy được + có test + dừng báo cáo**)

Quy ước mỗi lát cắt: *Làm gì → File chính → Tiêu chí xong → Test → Điểm cần bạn duyệt*. Giờ lấy từ SRS (cột `h`), nhân hệ số thực tế sau lát cắt đầu.

### PHASE 1 — Backend nền tảng (48h) · mốc M1

| Lát | SRS | Làm gì | Tiêu chí xong | Test | h |
| --- | --- | --- | --- | --- | --- |
| **B0** | 1.1 | Dọn skeleton: **chuyển ESM + tsx**, chép `bm25.ts`+`bm25.test.ts` từ MVP vào `src/lib/search/` và chạy 7 test xanh, đổi tên package, `config/env.ts` (zod validate env), `app.ts` (helmet, CORS theo env, JSON limit, error handler thống nhất `{error:{code,message}}`), `/api/v1/health`, script `test`, `.env.example`; xóa model `Todo` | `npm run dev` lên; `GET /api/v1/health` trả `{ok, llmEnabled}` | 1 test health | 4 |
| **B1** | 1.2 | Viết **schema Prisma 15 thực thể** (User, RefreshToken, DeviceToken, Course, Document, Chunk, Conversation, Message, MessageSource, Quiz, QuizItem, QuizAttempt, AttemptAnswer, Flashcard, UsageLog) + thêm `Job`. Index `user_id`; quan hệ & cascade đúng quy tắc toàn vẹn (xóa Document giữ MessageSource/QuizItem, đánh dấu `documentDeleted`) | `prisma migrate dev` chạy trên DB trống | script seed 2 user | 6 |
| **B2** | 1.3 | **Auth**: register/login/refresh(xoay vòng)/logout; access 15', refresh 30 ngày, lưu **băm** refresh token; middleware `requireAuth`; rate limit login 5/phút/IP | Luồng đăng ký→đăng nhập→refresh→logout OK; token hết hạn trả 401; refresh cũ bị thu hồi | tích hợp: đúng/sai mật khẩu, email trùng 409, hết hạn, reuse refresh, 429 | 8 |
| **B3** | 1.4 | **Courses CRUD** lọc `userId`; chặn truy cập chéo = 404 | 2 tài khoản không thấy dữ liệu nhau | test chéo user (NFR-07) | 4 |
| **B4** | 1.5 | **Documents**: upload multipart (50MB, kiểm tra magic bytes `%PDF`, tên file do server sinh), `Storage`, `Job` + worker trích chữ từng trang → `Chunk` (giữ `page`, cắt đoạn dài vẫn giữ trang), đếm `empty_pages`, trạng thái processing/ready/failed, retry, đổi tên/chuyển môn, xóa (cả file + chunk), `GET /:id/file` hỗ trợ **Range** | PDF 100 trang → `ready`; PDF hỏng → `failed`; Range trả 206 | file lạ/quá lớn/PDF hỏng/PDF trang trống; xóa dọn file | 10 |
| **B5** | 1.6 | **Search BM25** theo user, chuẩn hóa tiếng Việt (bỏ dấu, lowercase, token), lọc phạm vi (tất cả/môn/tài liệu), ngưỡng "độ phủ từ khóa" → `no-match` | Có dấu & không dấu đều ra đúng trang; không thấy tài liệu người khác | ≥7 test (tái dùng MVP nếu có) + test cô lập user | 4 |
| **B6** | 1.7 | **Conversations/Messages**: tạo với scope, gửi câu hỏi → 3 chế độ `llm`/`extractive`/`no-match`; lưu `MessageSource` (page + snippet); LLM adapter + **Mock**; retry 2 lần backoff → fallback `extractive` (NFR-14); prompt ép "chỉ dùng ngữ cảnh, gắn [n]" | Không có key vẫn trả `extractive`; `no-match` **không gọi LLM** | mock LLM: ok / 5xx / không đủ căn cứ; kiểm tra log không chứa nội dung (NFR-08) | 6 |
| **B7** | 1.8 | **Quizzes**: tạo (gom ≤12.000 ký tự trong khoảng trang, 1–10 câu), validate (4 đáp án, `correct` 0–3, trang trong khoảng → loại câu sai), lưu; attempts: start/answer/finish tính điểm | Câu có trang sai bị loại; chấm đúng | mock LLM trả câu hỏng; điểm số | 6 |

**Cổng nghiệm thu P1 (báo cáo bằng chứng):** toàn bộ endpoint nhóm P1 qua test tích hợp; 2 tài khoản không đọc chéo; PDF 100 trang xử lý xong và tìm đúng trang.

### PHASE 2 — Web phiên bản 1 (56h) · mốc M2

| Lát | SRS | Làm gì | Tiêu chí xong | Test | h |
| --- | --- | --- | --- | --- | --- |
| **W1** | 2.1, 2.2 | Scaffold Vite+React+TS, router, design tokens (sáng), API client **tự refresh token** (1 request refresh chung khi nhiều 401 cùng lúc), route guard; màn **WEB-S01** đăng nhập/đăng ký, lỗi từng trường | Đăng ký/đăng nhập thật với BE; F5 vẫn giữ phiên | Vitest form + 1 test refresh | 10 |
| **W2** | 2.3 | **WEB-S02** tổng quan + CRUD môn; xóa môn có xác nhận **nêu số tài liệu/quiz bị xóa** | CRUD chạy; empty state | component test | 6 |
| **W3** | 2.4 | **WEB-S03** chi tiết môn: kéo-thả nhiều file, tiến độ từng file, polling 2s, badge processing/ready/failed, nút Thử lại, **cảnh báo trang trống**, thông báo "chỉ dùng cá nhân/quyền slide" khi tải lên | Tải 3 file song song, thấy trạng thái riêng | test validate đuôi/dung lượng; Playwright upload | 8 |
| **W4** | 2.5 | **WEB-S04 không gian học**: 2 cột (pdf.js trái, chat phải); bấm nguồn [n] → PDF cuộn đúng trang, tô sáng đoạn; chọn phạm vi; hiển thị mode (`extractive` có nhãn rõ) | Đúng trang trên bộ file mẫu; không reload | Playwright: hỏi→bấm nguồn→đúng trang | 14 |
| **W5** | 2.6, 2.7 | **WEB-S05** lịch sử (tìm/đổi tên/xóa) + **WEB-S06** quiz (thiết lập, làm bài chấm ngay, kết quả, giải thích + link trang) | Làm trọn 1 quiz, điểm lưu | component + 1 E2E | 12 |
| **W6** | 2.8 | **Consent gửi dữ liệu cho nhà cung cấp LLM** (lưu `llm_consent_at`, chặn hỏi/quiz nếu chưa đồng ý), lỗi mạng + thử lại **không mất câu hỏi đang soạn**, responsive 360px (dưới 768px 2 cột → 2 tab) | Chặn đúng khi chưa consent; giữ nháp | test consent gate; kiểm tra 360/768/1280 | 6 |
| **EVAL** | 12.9 | Dựng **bộ 20–30 câu hỏi thử** trên slide thật (`docs/eval-questions.md`), đo tỉ lệ đúng trang | Bảng kết quả → quyết định có cần embedding trước M3 | script đo | (trong 56h) |

**Cổng nghiệm thu P2:** đi trọn đăng ký→nạp PDF→hỏi→bấm nguồn→làm quiz theo `docs/manual-checklist.md`, có screenshot desktop + mobile-width.

### PHASE 3 — Web nâng cao (42h) · mốc M3

| Lát | SRS | Nội dung | h |
| --- | --- | --- | --- |
| **E1** | 3.1 | Quên/đặt lại mật khẩu (token hết hạn 30', gửi email theo Q8), hồ sơ, đổi mật khẩu, **xóa tài khoản** (xác nhận mật khẩu; xóa DB + file) | 8 |
| **E2** | 3.2 | Đăng nhập Google (cần OAuth client từ bạn) | 4 |
| **E3** | 3.3 | Hội thoại nhiều lượt: viết lại câu nối tiếp (bộ 5 câu test) | 5 |
| **E4** | 3.4, 3.5 | Đánh giá câu trả lời; báo câu quiz sai (loại khỏi lần sau); làm lại câu sai; quiz theo cả môn | 7 |
| **E5** | 3.6 | Flashcard + lịch lặp 1/3/7/14 ngày (WEB-S07) | 8 |
| **E6** | 3.7 | Thống kê tổng quan (WEB-S08) + dark mode | 4 |
| **E7** | 3.8 | Phát hiện tải trùng (`content_hash`), streaming câu trả lời (SSE), phím tắt (Enter/Shift+Enter/Ctrl+K), sao chép trích dẫn | 6 |

**Cổng P3:** mọi mục Should web chạy; flashcard & thống kê hiển thị số liệu từ quiz thật.

### PHASE 6 — Chất lượng, bảo mật, triển khai (34h) · mốc M4

| Lát | SRS | Nội dung | h |
| --- | --- | --- | --- |
| **Q1** | 6.1 | Rate limit hỏi đáp 30/giờ/user, hạn mức tài liệu/dung lượng, `UsageLog`, hiển thị mức dùng | 6 |
| **Q2** | 6.2 | Rà bảo mật: CORS, helmet, kiểm file, log không lộ nội dung, quét `npm audit`; dùng skill `security-and-hardening` | 6 |
| **Q3** | 6.3 | Đo NFR-01…03 trên dữ liệu thật → ghi bảng số + quyết định BM25 vs full-text | 6 |
| **Q4** | 6.4 | Sao lưu DB hằng ngày (giữ 7) + khôi phục thử 1 lần | 3 |
| **Q5** | 6.5 | Deploy BE+DB+Web, env, HTTPS, README (**cần bạn duyệt trước khi deploy**) | 6 |
| **Q6** | 6.6 | Xuất dữ liệu cá nhân (JSON + PDF gốc), hoàn thiện xóa tài khoản | 3 |
| **Q7** | 6.7 | Thử với 3–5 bạn, báo cáo ngắn (kiểm chứng giả định mục 2.1) | 4 |

**Cổng P6 (M4):** số NFR đã đo; chạy trên Internet; báo cáo thử nghiệm.

Tổng web: P1 48 + P2 56 + P3 42 + P6 34 = **180h** (≈12 tuần @15h/tuần, 7 tuần @25h/tuần). Ước lượng SRS, chưa hiệu chỉnh — **sau lát B2 tôi báo giờ thực để nhân lại hệ số**.

---

## 7. Luồng người dùng chính (web)

1. Khách → `/register` → đăng nhập → Tổng quan (trống: hướng dẫn tạo môn đầu tiên).
2. Tạo môn → vào môn → kéo-thả PDF → thấy "đang xử lý" → "sẵn sàng" (+ cảnh báo trang trống nếu có).
3. Lần hỏi đầu: hộp consent LLM → đồng ý → vào Không gian học → chọn phạm vi → hỏi → câu trả lời [n] → bấm nguồn → PDF nhảy đúng trang.
4. Quiz: chọn tài liệu + khoảng trang + số câu → làm từng câu → kết quả → làm lại câu sai / tạo flashcard.

## 8. Dữ liệu cần lưu
15 thực thể theo SRS mục 9 + `Job(id, type, payload, status, attempts, error, runAt)`. Bổ sung đề xuất: `Message.mode`, `Document.deletedFlag` trên MessageSource/QuizItem để thỏa quy tắc "xóa Document nhưng giữ nguồn". `UsageLog` **không** lưu nội dung.

## 9. Tuân thủ pháp luật VN (theo CLAUDE.md → skill `vn-law-check`)

Dự án có đăng nhập, form, upload tài liệu, AI gửi dữ liệu cho bên thứ ba, cookie/tracking → **phải rà soát**. Cổng pháp lý đặt ở: sau W6 (consent), sau E1 (xóa tài khoản), trước Q5 (deploy). Việc phải có:

- Trang **Chính sách bảo mật / Điều khoản** (soạn bằng skill, đặt ở footer + checkbox lúc đăng ký, **chưa tick sẵn**).
- **Consent riêng** cho việc gửi đoạn trích sang Anthropic (xử lý dữ liệu ở nước ngoài → nêu rõ bên nhận, mục đích); lưu thời điểm + phiên bản chính sách; cho **rút lại**.
- Quyền chủ thể dữ liệu: xem/sửa/xóa/xuất dữ liệu (đã có FR-AUTH-05/06, FR-SET-03).
- Tối thiểu hóa dữ liệu; không log nội dung; không analytics bên thứ ba ở v1 → **không cần cookie banner marketing**, chỉ nêu cookie thiết yếu (phiên).
- Nhãn "câu trả lời do AI tạo, kiểm tra lại nguồn" (minh bạch AI).
- Nhắc người dùng chỉ tải tài liệu mình có quyền dùng (bản quyền slide giảng viên).
- Nhắc: đây là rà soát kỹ thuật, **không phải tư vấn pháp lý**; việc đối chiếu điều khoản cụ thể sẽ làm bằng skill `vn-law-check` khi có code.

## 10. Cách VERIFY sau **mỗi** lát cắt (báo cáo cố định)

1. File đã tạo/sửa.  2. Test đã chạy + kết quả thật (lệnh + số pass/fail).  3. Flow đã click thử thật (Playwright/trình duyệt) + screenshot.  4. Desktop & 360px.  5. Trạng thái loading/empty/error.  6. Phần **chưa** kiểm + rủi ro còn lại.  7. Giờ thực vs giờ kế hoạch.

## 11. Rủi ro chính (rút từ SRS + khảo sát)

| Rủi ro | Giảm thiểu |
| --- | --- |
| Port mã MVP sang BE (ESM, tsconfig chặt hơn) | Làm ở B0/B4/B5; 7 test cũ phải xanh trước khi sửa tiếp |
| BM25 bỏ sót khi hỏi khác từ khóa | EVAL cuối P2; nếu tệ thì embedding (P7) đưa lên sớm |
| Chi phí LLM | Mock khi dev, hạn mức, `UsageLog`, chế độ extractive |
| LLM trả sai/gắn sai nguồn | Ép prompt, luôn hiện đoạn gốc, nút báo sai, nhãn AI |
| Refresh token race (nhiều tab) | Một promise refresh dùng chung ở client; test |
| pdf.js nặng/worker cấu hình Vite | Thử nghiệm sớm ở W4 (spike 2h) |
| Pháp lý dữ liệu cá nhân | Mục 9, cổng trước deploy |

## 12. Việc **bắt buộc dừng chờ bạn duyệt** (tôi sẽ không tự làm)

Deploy/đổi hạ tầng · chạy migrate trên DB thật · gửi email thật · dùng khóa Anthropic/Google thật (gọi tính phí) · xóa dữ liệu hàng loạt · tạo tài khoản dịch vụ ngoài · `git push`/commit (chỉ khi bạn bảo).

## 13. Bước tiếp theo sau khi bạn duyệt
Bắt đầu **B0** (4h): dọn skeleton + health + env + test đầu tiên → báo cáo theo mục 10 → chờ bạn "đi tiếp B1".
