import { useState } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "src/apis/client";
import Alert from "src/components/Alert/Alert";
import { PATH } from "src/constants/paths";
import { useAuth } from "src/hooks/useAuth";
import MainLayout from "src/layouts/MainLayout";
import ConsentDialog from "src/pages/Study/ConsentDialog";

/** Cài đặt (FR-SET-01): xem, cấp hoặc rút lại đồng ý gửi đoạn tài liệu cho nhà cung cấp AI. */
export default function Settings() {
  const { user, setLlmConsent } = useAuth();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const granted = !!user?.llmConsentAt;

  async function change(value: boolean) {
    setBusy(true);
    setError(null);
    try {
      await setLlmConsent(value);
      setAsking(false);
    } catch (e) {
      setAsking(false);
      setError(e instanceof ApiError ? e.message : "Không lưu được lựa chọn, hãy thử lại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <MainLayout>
      <div className="content" style={{ maxWidth: 760, width: "100%" }}>
        <h1 className="h1">Cài đặt</h1>
        <section className="card card-pad stack" aria-labelledby="ai-title">
          <h2 id="ai-title" className="h2">
            Gửi đoạn tài liệu cho nhà cung cấp AI
          </h2>
          <p className="small">
            Khi bạn hỏi hoặc tạo quiz, chỉ vài đoạn liên quan nhất được gửi tới nhà cung cấp AI ở nước ngoài. Không có đồng ý này, hỏi đáp chỉ trả về đoạn gốc và không tạo được
            quiz. Xem{" "}
            <Link to={PATH.PRIVACY} className="link-strong">
              Chính sách bảo vệ dữ liệu cá nhân
            </Link>
            .
          </p>
          {error && <Alert>{error}</Alert>}
          <p role="status">
            Trạng thái hiện tại: <b>{granted ? "Đã đồng ý" : "Chưa đồng ý"}</b>
          </p>
          {granted ? (
            <button className="btn btn-secondary" style={{ alignSelf: "flex-start" }} disabled={busy} onClick={() => change(false)}>
              {busy ? "Đang lưu…" : "Rút lại đồng ý"}
            </button>
          ) : (
            <button className="btn btn-primary" style={{ alignSelf: "flex-start" }} disabled={busy} onClick={() => setAsking(true)}>
              Đồng ý gửi dữ liệu
            </button>
          )}
        </section>
      </div>
      <ConsentDialog open={asking} onClose={() => setAsking(false)} onChoose={change} busy={busy} />
    </MainLayout>
  );
}
