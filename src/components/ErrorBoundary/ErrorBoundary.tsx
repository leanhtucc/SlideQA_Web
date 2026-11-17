import { Component, type ErrorInfo, type ReactNode } from "react";
import Button from "src/components/Button/Button";
import Icon from "src/components/Icon/Icon";

interface State {
  failed: boolean;
}

/** Chốt chặn cuối: lỗi bất ngờ khi vẽ giao diện thì hiện màn hình xin lỗi có nút tải lại, thay vì trang trắng. */
export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Không ghi nội dung người dùng; chỉ lỗi kỹ thuật để dev xem trong console.
    console.error("UI crashed:", error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="center-screen">
        <div className="state state-error card" role="alert" style={{ maxWidth: 480 }}>
          <span className="state-icon state-icon-generic">
            <Icon name="alert" size={28} />
          </span>
          <h1 className="h3">Ứng dụng gặp lỗi bất ngờ</h1>
          <p className="muted state-msg">Rất tiếc, có gì đó không ổn. Dữ liệu của bạn vẫn an toàn. Hãy tải lại trang để tiếp tục.</p>
          <div className="state-actions">
            <Button onClick={() => window.location.reload()}>
              <Icon name="refresh" size={16} />
              Tải lại trang
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
