import { useEffect, useRef, useState } from "react";
import Button from "src/components/Button/Button";
import { Link } from "react-router-dom";
import { ApiError } from "src/apis/client";
import Alert from "src/components/Alert/Alert";
import Modal from "src/components/Modal/Modal";
import { PATH } from "src/constants/paths";
import { useAuth } from "src/hooks/useAuth";

interface GsiId {
  initialize: (cfg: { client_id: string; callback: (r: { credential?: string }) => void; ux_mode?: string }) => void;
  renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
}
declare global {
  interface Window {
    google?: { accounts?: { id?: GsiId } };
  }
}

const GSI_SRC = "https://accounts.google.com/gsi/client";
let loading: Promise<GsiId> | null = null;

/** Nạp thư viện Google Identity Services một lần duy nhất. */
function loadGsi(): Promise<GsiId> {
  const ready = window.google?.accounts?.id;
  if (ready) return Promise.resolve(ready);
  loading ??= new Promise<GsiId>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = GSI_SRC;
    s.async = true;
    s.onload = () => (window.google?.accounts?.id ? resolve(window.google.accounts.id) : reject(new Error("gsi")));
    s.onerror = () => reject(new Error("gsi"));
    document.head.appendChild(s);
  }).catch((e) => {
    loading = null; // cho phép thử lại lần sau (mất mạng, bị chặn...)
    throw e;
  });
  return loading;
}

/** Nút "Đăng nhập bằng Google". Ẩn hẳn khi chưa cấu hình VITE_GOOGLE_CLIENT_ID. Người dùng mới phải đồng ý điều khoản trước khi tạo tài khoản. */
export default function GoogleButton({ mode }: { mode: "signin" | "signup" }) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  const { loginWithGoogle } = useAuth();
  const host = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null); // credential đang chờ người dùng đồng ý điều khoản
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const loginRef = useRef(loginWithGoogle);
  loginRef.current = loginWithGoogle;

  async function submit(credential: string, acceptTerms?: boolean) {
    setError(null);
    setBusy(true);
    try {
      await loginRef.current(credential, acceptTerms);
      // Đã đăng nhập: UnauthenticatedGuard tự chuyển vào trang chính.
    } catch (e) {
      if (e instanceof ApiError && e.code === "terms_required") {
        setAgree(false);
        setPending(credential);
      } else {
        setPending(null);
        setError(e instanceof ApiError ? e.message : "Không đăng nhập được bằng Google, hãy thử lại.");
      }
    } finally {
      setBusy(false);
    }
  }
  const submitRef = useRef(submit);
  submitRef.current = submit;

  useEffect(() => {
    if (!clientId || !host.current) return;
    let alive = true;
    loadGsi().then(
      (gsi) => {
        if (!alive || !host.current) return;
        gsi.initialize({ client_id: clientId, callback: (r) => r.credential && void submitRef.current(r.credential) });
        gsi.renderButton(host.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: mode === "signup" ? "signup_with" : "signin_with",
          locale: "vi",
          width: Math.max(200, Math.min(380, (host.current.clientWidth || 320) - 24)),
        }); // iframe của Google rộng hơn width khoảng 20px
      },
      () => alive && setError("Không tải được đăng nhập Google. Hãy kiểm tra kết nối hoặc dùng email."),
    );
    return () => {
      alive = false;
    };
  }, [clientId, mode]);

  if (!clientId) return null;
  return (
    <div className="stack" style={{ gap: 12 }}>
      <div className="small muted center" aria-hidden="true">
        hoặc
      </div>
      {error && <Alert>{error}</Alert>}
      <div ref={host} style={{ display: "flex", justifyContent: "center", minHeight: 44 }} />
      <Modal open={!!pending} onClose={() => setPending(null)} title="Tạo tài khoản bằng Google">
        <div className="stack" style={{ gap: 14 }}>
          <p className="small">Đây là lần đầu bạn dùng Slide QA. Hãy đồng ý các điều khoản dưới đây để tạo tài khoản.</p>
          <label className="check">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <span>
              Tôi đã đọc và đồng ý với{" "}
              <Link to={PATH.TERMS} target="_blank" className="link-strong">
                Điều khoản sử dụng
              </Link>{" "}
              và{" "}
              <Link to={PATH.PRIVACY} target="_blank" className="link-strong">
                Chính sách bảo vệ dữ liệu cá nhân
              </Link>
              .
            </span>
          </label>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setPending(null)}>
              Hủy
            </button>
            <Button variant="primary" disabled={!agree || busy} loading={busy} loadingText="Đang tạo…" onClick={() => pending && void submit(pending, true)}>
              Đồng ý và tạo tài khoản
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
