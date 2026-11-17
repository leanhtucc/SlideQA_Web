/** Dung lượng tối đa mỗi tệp PDF (khớp backend, FR-DOC-01) */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
/** Số tệp tải lên cùng lúc; các tệp còn lại xếp hàng chờ */
export const MAX_PARALLEL_UPLOADS = 2;
/** Chu kỳ hỏi lại trạng thái khi còn tài liệu đang xử lý (UC-02 bước 6) */
export const POLL_MS = 2000;
