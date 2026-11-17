import { Link } from "react-router-dom";
import { ApiError } from "src/apis/client";
import { ErrorState } from "src/components/State/State";
import { PATH } from "src/constants/paths";

export default function NotFound() {
  return (
    <main className="center-screen">
      <ErrorState error={new ApiError(404, "not_found", "")} title="Không tìm thấy trang" message="Đường dẫn này không tồn tại hoặc đã được chuyển đi.">
        <Link to={PATH.ROOT} className="btn btn-primary">
          Về trang chủ
        </Link>
      </ErrorState>
    </main>
  );
}
