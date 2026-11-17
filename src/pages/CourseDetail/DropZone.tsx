import { useState } from "react";
import { MAX_UPLOAD_BYTES } from "src/constants/upload";
import { formatBytes } from "src/helpers/format";

/** Vùng kéo thả/chọn nhiều PDF (WEB-01). Là <label> bọc ô file nên bấm hoặc dùng bàn phím (Tab, Enter) đều mở được hộp chọn tệp. */
export default function DropZone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const [drag, setDrag] = useState(false);
  return (
    <label
      className={"dropzone" + (drag ? " drag" : "")}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        onFiles([...e.dataTransfer.files]);
      }}
    >
      <input
        type="file"
        accept="application/pdf,.pdf"
        multiple
        className="visually-hidden"
        onChange={(e) => {
          onFiles([...(e.target.files ?? [])]);
          e.target.value = ""; // chọn lại cùng tệp vẫn kích hoạt được
        }}
      />
      <svg className="ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 32, height: 32, color: "var(--primary)" }}>
        <path d="M12 16V4M7 9l5-5 5 5M4 20h16" />
      </svg>
      <span className="h3">Kéo thả PDF vào đây</span>
      <span className="small muted">
        hoặc <span style={{ color: "var(--primary-ink)", fontWeight: 600, textDecoration: "underline" }}>chọn tệp</span> · nhiều tệp cùng lúc · tối đa{" "}
        {formatBytes(MAX_UPLOAD_BYTES)} mỗi tệp · chỉ PDF có lớp chữ
      </span>
      <span className="tiny muted" style={{ maxWidth: 520 }}>
        Chỉ tải tài liệu bạn có quyền sử dụng. Slide của giảng viên chỉ dùng cá nhân, không chia sẻ.
      </span>
    </label>
  );
}
