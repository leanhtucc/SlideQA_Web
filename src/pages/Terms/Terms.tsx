import { Link } from "react-router-dom";
import { PATH } from "src/constants/paths";
import Legal, { H2, LEGAL } from "src/pages/Legal/Legal";

/*
 * BẢN NHÁP soạn theo skill vn-law-check; cần người có chuyên môn pháp lý xem lại trước khi ra mắt
 * (đặc biệt: giới hạn trách nhiệm, độ tuổi, luật áp dụng). Xóa khối chú thích này khi đăng chính thức.
 */
export default function Terms() {
  return (
    <Legal title="Điều khoản sử dụng">
      <p>
        Khi tạo tài khoản và dùng Slide QA do {LEGAL.org} vận hành, bạn đồng ý với các điều khoản dưới đây. Cách chúng tôi xử lý dữ liệu cá nhân nằm ở{" "}
        <Link to={PATH.PRIVACY} className="link-strong">
          Chính sách bảo vệ dữ liệu cá nhân
        </Link>
        .
      </p>

      <H2>1. Dịch vụ</H2>
      <p>
        Slide QA cho bạn tải slide PDF của mình, hỏi đáp có trích dẫn trang, làm quiz và ôn bằng thẻ ghi nhớ. Đây là công cụ hỗ trợ học tập, không thay thế giáo trình, bài giảng hay lời giảng viên.
      </p>

      <H2>2. Câu trả lời do AI tạo</H2>
      <p>
        Câu trả lời và câu hỏi quiz có thể do AI tạo và có thể sai hoặc thiếu. Hãy kiểm tra lại ở trang nguồn được trích dẫn trước khi dựa vào chúng cho bài thi hay bài nộp. Chúng tôi không đảm bảo kết
        quả học tập.
      </p>

      <H2>3. Tài khoản</H2>
      <ul>
        <li>Bạn cung cấp thông tin đúng và tự giữ bí mật mật khẩu; hoạt động dưới tài khoản của bạn do bạn chịu trách nhiệm.</li>
        <li>Dịch vụ dành cho người từ đủ 16 tuổi. [KIỂM TRA: xác nhận mốc tuổi với người làm luật.]</li>
        <li>Bạn có thể xóa tài khoản bất cứ lúc nào ở Cài đặt; khi đó dữ liệu của bạn bị xóa.</li>
      </ul>

      <H2>4. Tài liệu bạn tải lên</H2>
      <ul>
        <li>Bạn chỉ tải tài liệu mình có quyền sử dụng, không vi phạm bản quyền hay quyền của người khác, và không tải tài liệu mật hoặc chứa thông tin cá nhân nhạy cảm của người khác.</li>
        <li>Bạn vẫn là chủ sở hữu tài liệu. Bạn cho chúng tôi quyền lưu, xử lý và hiển thị lại tài liệu đó cho riêng bạn, chỉ để cung cấp dịch vụ.</li>
        <li>Chúng tôi không chia sẻ tài liệu của bạn cho người dùng khác.</li>
      </ul>

      <H2>5. Điều không được làm</H2>
      <ul>
        <li>Dùng dịch vụ vào mục đích trái pháp luật, hoặc tải nội dung vi phạm pháp luật.</li>
        <li>Cố truy cập dữ liệu của người khác, dò quét, tấn công hay làm quá tải hệ thống.</li>
        <li>Dùng công cụ tự động để gửi hàng loạt câu hỏi, vượt giới hạn sử dụng (hiện có giới hạn số lượt hỏi và tạo quiz mỗi giờ).</li>
        <li>Bán lại hoặc cho người khác dùng chung tài khoản.</li>
      </ul>
      <p>Vi phạm nghiêm trọng có thể dẫn tới khóa tài khoản.</p>

      <H2>6. Tính sẵn sàng và thay đổi dịch vụ</H2>
      <p>Chúng tôi cố gắng duy trì dịch vụ ổn định nhưng không cam kết hoạt động liên tục. Tính năng có thể thay đổi, tạm dừng hoặc chấm dứt; nếu chấm dứt, chúng tôi báo trước hợp lý để bạn kịp lấy lại tài liệu của mình.</p>

      <H2>7. Giới hạn trách nhiệm</H2>
      <p>
        Trong phạm vi pháp luật cho phép, dịch vụ được cung cấp &quot;như hiện có&quot;. Chúng tôi không chịu trách nhiệm cho thiệt hại gián tiếp phát sinh từ việc dựa vào câu trả lời của AI hay từ việc gián đoạn dịch vụ.
        Điều này không loại trừ trách nhiệm mà pháp luật không cho phép loại trừ. [KIỂM TRA: người làm luật xem lại điều khoản này.]
      </p>

      <H2>8. Thay đổi điều khoản</H2>
      <p>Khi điều khoản thay đổi đáng kể, chúng tôi thông báo trong ứng dụng; bạn tiếp tục dùng sau khi được thông báo và đồng ý lại nếu được yêu cầu.</p>

      <H2>9. Luật áp dụng và liên hệ</H2>
      <p>
        Điều khoản này theo pháp luật Việt Nam. Thắc mắc và khiếu nại: <b>{LEGAL.email}</b>.
      </p>
    </Legal>
  );
}
