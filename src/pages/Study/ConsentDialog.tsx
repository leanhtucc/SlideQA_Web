import { useState } from "react";
import { Link } from "react-router-dom";
import Modal from "src/components/Modal/Modal";
import { PATH } from "src/constants/paths";

interface Props {
  open: boolean;
  /** Đóng bằng Esc/bấm nền: không gửi câu hỏi, chưa quyết định gì */
  onClose: () => void;
  onChoose: (granted: boolean) => void;
  busy: boolean;
}

/** Đồng ý gửi đoạn tài liệu cho nhà cung cấp AI trước lần hỏi đầu tiên (FR-SET-01). */
export default function ConsentDialog({ open, onClose, onChoose, busy }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Cho phép gửi đoạn tài liệu tới nhà cung cấp AI?">
      <Body onChoose={onChoose} busy={busy} onClose={onClose} />
    </Modal>
  );
}

function Body({ onChoose, busy }: Omit<Props, "open" | "onClose"> & { onClose: () => void }) {
  const [agree, setAgree] = useState(false);
  return (
    <>
      <p className="small">
        Khi bạn hỏi, Slide QA gửi <b>chỉ vài đoạn liên quan nhất</b> (không phải cả tài liệu) tới nhà cung cấp AI để soạn câu trả lời. Dữ liệu này được xử lý ở nước ngoài. Đừng tải
        tài liệu mật.
      </p>
      <ul className="small muted" style={{ margin: 0, paddingLeft: 18 }}>
        <li>Bạn có thể rút lại ở Cài đặt, khi đó chỉ còn chế độ trả về đoạn gốc.</li>
        <li>Nội dung câu hỏi và tài liệu không được ghi vào nhật ký.</li>
      </ul>
      <label className="check">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        <span>
          Tôi đã đọc{" "}
          <Link to={PATH.PRIVACY} target="_blank" className="link-strong">
            Chính sách bảo vệ dữ liệu cá nhân
          </Link>{" "}
          và đồng ý với việc gửi dữ liệu này.
        </span>
      </label>
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => onChoose(false)}>
          Không, chỉ xem đoạn gốc
        </button>
        <button type="button" className="btn btn-primary" disabled={!agree || busy} onClick={() => onChoose(true)}>
          Đồng ý và tiếp tục
        </button>
      </div>
    </>
  );
}
