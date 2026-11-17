import { useEffect, useState } from "react";
import Icon from "src/components/Icon/Icon";
import { toast } from "src/helpers/toast";

/** Dải cảnh báo ở đầu trang khi trình duyệt mất mạng; có mạng lại thì báo bằng toast rồi tự ẩn. */
export default function OfflineBanner() {
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const off = () => setOnline(false);
    const on = () => {
      setOnline(true);
      toast.success("Đã kết nối lại.");
    };
    window.addEventListener("offline", off);
    window.addEventListener("online", on);
    return () => {
      window.removeEventListener("offline", off);
      window.removeEventListener("online", on);
    };
  }, []);

  if (online) return null;
  return (
    <div className="offline-banner" role="status">
      <Icon name="wifiOff" size={18} />
      <span>Bạn đang offline. Dữ liệu có thể chưa mới và một số thao tác sẽ không hoạt động cho tới khi có mạng.</span>
    </div>
  );
}
