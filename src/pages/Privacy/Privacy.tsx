import { Link } from "react-router-dom";
import { PATH } from "src/constants/paths";
import Legal, { H2, LEGAL } from "src/pages/Legal/Legal";

/*
 * BẢN NHÁP soạn theo skill vn-law-check từ mã nguồn; cần người có chuyên môn pháp lý xem lại trước khi ra mắt.
 * Căn cứ: Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 (Điều 4, 9, 10, 14, 20), Nghị định 356/2025/NĐ-CP (Điều 5, 6).
 * Xóa khối chú thích này khi đăng chính thức.
 */
export default function Privacy() {
  return (
    <Legal title="Chính sách bảo vệ dữ liệu cá nhân">
      <p>
        Slide QA giúp bạn hỏi đáp và ôn tập từ chính các tệp slide PDF của bạn. Trang này nói rõ chúng tôi thu thập dữ liệu gì, dùng để làm gì, gửi cho ai và bạn kiểm soát nó thế nào.
      </p>

      <H2>1. Chúng tôi là ai</H2>
      <p>
        {LEGAL.org} (&quot;chúng tôi&quot;) là bên kiểm soát dữ liệu cá nhân thu thập qua Slide QA. Mọi yêu cầu về dữ liệu cá nhân, gửi tới: <b>{LEGAL.email}</b>.
      </p>

      <H2>2. Dữ liệu chúng tôi thu thập và mục đích</H2>
      <table className="card" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th align="left">Dữ liệu</th>
            <th align="left">Dùng để</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Email, tên hiển thị, mật khẩu (chỉ lưu dạng đã băm, không đọc lại được)</td>
            <td>Tạo và đăng nhập tài khoản; gửi liên kết đặt lại mật khẩu</td>
          </tr>
          <tr>
            <td>Mã tài khoản Google, nếu bạn đăng nhập bằng Google</td>
            <td>Đăng nhập; chúng tôi không nhận mật khẩu Google của bạn</td>
          </tr>
          <tr>
            <td>Tên tệp PDF, nội dung PDF và chữ trích ra từ từng trang</td>
            <td>Tìm đoạn liên quan, trả lời kèm trích dẫn trang, tạo quiz và thẻ ghi nhớ</td>
          </tr>
          <tr>
            <td>Môn học (tên, mã, học kỳ, ngày thi) bạn nhập</td>
            <td>Sắp xếp tài liệu</td>
          </tr>
          <tr>
            <td>Câu hỏi, câu trả lời, đánh giá hữu ích/chưa tốt, quiz, kết quả làm bài, thẻ ghi nhớ</td>
            <td>Lưu lịch sử học, thống kê tiến độ, gợi ý chỗ hay sai</td>
          </tr>
          <tr>
            <td>Loại trình duyệt (User-Agent) của mỗi phiên đăng nhập; thời điểm đồng ý điều khoản và đồng ý dùng AI</td>
            <td>Quản lý phiên; chứng minh bạn đã đồng ý khi cần</td>
          </tr>
          <tr>
            <td>Số lượt gọi AI và số token</td>
            <td>Giới hạn lạm dụng, theo dõi chi phí; không chứa nội dung</td>
          </tr>
        </tbody>
      </table>
      <p>Chúng tôi không dùng dữ liệu cho mục đích khác ngoài bảng trên mà chưa hỏi bạn, không bán dữ liệu và không gửi quảng cáo.</p>
      <p>
        Slide của bạn có thể chứa thông tin cá nhân của người khác (tên giảng viên, bạn học...). Hãy chỉ tải tài liệu bạn có quyền sử dụng và <b>đừng tải tài liệu mật</b>.
      </p>

      <H2>3. Dùng AI và gửi dữ liệu ra bên ngoài</H2>
      <p>
        Khi bạn hỏi hoặc tạo quiz, và <b>chỉ khi bạn đã đồng ý</b> ở hộp thoại hiện lần đầu, chúng tôi gửi tới nhà cung cấp AI (Anthropic) câu hỏi của bạn, vài câu hỏi trước đó trong cùng hội thoại và
        vài đoạn slide liên quan nhất (không phải cả tài liệu). Việc này giúp soạn câu trả lời. Nhà cung cấp AI đặt ở nước ngoài.
      </p>
      <p>
        Chưa đồng ý, hoặc đã rút lại, thì không có dữ liệu nào gửi cho nhà cung cấp AI: bạn chỉ nhận các đoạn gốc liên quan. Bạn rút lại bất cứ lúc nào ở <b>Cài đặt</b>. Chúng tôi không ghi nội
        dung câu hỏi và tài liệu vào nhật ký máy chủ.
      </p>
      <p>Câu trả lời do AI tạo có thể sai hoặc thiếu. Hãy luôn kiểm tra lại ở trang nguồn được trích dẫn.</p>

      <H2>4. Nơi lưu trữ và các bên xử lý dữ liệu</H2>
      <ul>
        <li>Cơ sở dữ liệu (tài khoản, văn bản trích từ PDF, lịch sử học): Supabase, máy chủ đặt tại Ireland (EU).</li>
        <li>Tệp PDF gốc: [KIỂM TRA: Supabase Storage hoặc ổ đĩa máy chủ, ghi đúng nơi đặt khi triển khai].</li>
        <li>Máy chủ ứng dụng: Northflank, khu vực [KIỂM TRA: ghi đúng khu vực khi triển khai].</li>
        <li>Đăng nhập bằng Google (nếu bạn chọn): Google nhận thông tin đăng nhập theo chính sách của Google.</li>
        <li>Phông chữ: trang tải phông Be Vietnam Pro từ Google Fonts nên Google thấy địa chỉ IP của bạn khi mở trang. [KIỂM TRA: bỏ dòng này nếu đã tự lưu phông trên máy chủ của mình].</li>
        <li>Email đặt lại mật khẩu: [KIỂM TRA: ghi tên nhà cung cấp gửi email khi đã chọn].</li>
      </ul>
      <p>Các dịch vụ trên đặt hoặc có thể xử lý dữ liệu ở nước ngoài, nên việc này là chuyển dữ liệu cá nhân xuyên biên giới theo Điều 20 Luật 91/2025.</p>

      <H2>5. Cookie và lưu trữ trong trình duyệt</H2>
      <p>
        Slide QA không dùng cookie quảng cáo hay công cụ theo dõi hành vi. Trình duyệt của bạn chỉ lưu những thứ cần để dùng dịch vụ: mã phiên đăng nhập và lựa chọn giao diện sáng/tối. Đăng xuất sẽ xóa
        mã phiên.
      </p>

      <H2>6. Thời gian lưu</H2>
      <ul>
        <li>Dữ liệu tài khoản và học tập được lưu cho tới khi bạn xóa chúng hoặc xóa tài khoản.</li>
        <li>Xóa một tài liệu: xóa luôn văn bản trích và tệp gốc. Xóa tài khoản (ở Cài đặt): xóa toàn bộ dữ liệu của bạn và các tệp PDF.</li>
        <li>Phiên đăng nhập hết hạn sau 30 ngày; liên kết đặt lại mật khẩu hết hạn sau 30 phút.</li>
        <li>Bản sao lưu của nhà cung cấp cơ sở dữ liệu: [KIỂM TRA: ghi thời gian lưu sao lưu của gói Supabase đang dùng].</li>
      </ul>

      <H2>7. Quyền của bạn</H2>
      <p>Bạn có quyền biết, xem, chỉnh sửa, yêu cầu cung cấp và xóa dữ liệu; đồng ý hoặc rút lại sự đồng ý; hạn chế hoặc phản đối việc xử lý; khiếu nại, tố cáo theo pháp luật.</p>
      <ul>
        <li>Tự làm ngay trong ứng dụng: sửa tên hiển thị, đổi mật khẩu, rút lại đồng ý dùng AI, xóa tài liệu, xóa tài khoản (Cài đặt).</li>
        <li>
          Yêu cầu khác (ví dụ nhận bản sao dữ liệu): gửi email tới <b>{LEGAL.email}</b>. Chúng tôi phản hồi và hướng dẫn trong 2 ngày làm việc; cho xem, chỉnh sửa, cung cấp dữ liệu trong 10 ngày (15
          ngày nếu cần bên thứ ba cùng thực hiện); xử lý yêu cầu rút đồng ý, hạn chế, phản đối trong 15 ngày; xóa dữ liệu trong 20 ngày (30 ngày nếu cần bên thứ ba cùng thực hiện). Yêu cầu phức tạp
          có thể được gia hạn một lần, kèm lý do.
        </li>
      </ul>

      <H2>8. Độ tuổi</H2>
      <p>
        Slide QA dành cho người học từ đủ 16 tuổi. [KIỂM TRA: chủ dự án xác nhận mốc tuổi với người làm luật.] Nếu bạn là cha mẹ hoặc người giám hộ và thấy trẻ dưới độ tuổi này đã tạo tài khoản, hãy
        liên hệ để chúng tôi xóa.
      </p>

      <H2>9. Bảo mật và sự cố</H2>
      <p>
        Mật khẩu được băm, phiên đăng nhập dùng mã ngắn hạn và mã làm mới xoay vòng, mỗi người chỉ truy cập được dữ liệu của chính mình. Không hệ thống nào an toàn tuyệt đối. Nếu xảy ra lộ, mất dữ liệu
        cá nhân, chúng tôi thông báo cho cơ quan chuyên trách theo quy định. [KIỂM TRA: chỉ giữ câu sau nếu chủ dự án làm được: "Chúng tôi cũng báo cho bạn nếu dữ liệu của bạn bị ảnh hưởng."]
      </p>

      <H2>10. Thay đổi chính sách</H2>
      <p>
        Khi thay đổi loại dữ liệu hoặc mục đích xử lý, chúng tôi thông báo trong ứng dụng và xin lại sự đồng ý nếu cần. Xem thêm{" "}
        <Link to={PATH.TERMS} className="link-strong">
          Điều khoản sử dụng
        </Link>
        .
      </p>
    </Legal>
  );
}
