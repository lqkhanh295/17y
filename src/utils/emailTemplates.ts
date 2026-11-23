import { RegistrationRecord } from '../types';

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
  templateType: 'DEPOSIT_ALUMNI' | 'DEPOSIT_ACTIVE' | 'FULL_100';
}

export function escapeHtml(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generate email payload (subject, html, text, templateType)
 * Khớp 100% chính xác từng dòng theo mẫu BTC cung cấp:
 * - Dạng chữ bình thường (plain text)
 * - Không chèn HTML/CSS
 * - Không chèn ảnh QR check-in
 */
export function generateEmailContent(
  record: RegistrationRecord,
  explicitTemplate?: 'AUTO' | 'DEPOSIT_ALUMNI' | 'DEPOSIT_ACTIVE' | 'FULL_100'
): EmailContent {
  const fullName = String(record?.fullName || 'Bạn').replace(/[\r\n]+/g, ' ').trim();
  const role = record?.role || 'ACTIVE';
  const phone = String(record?.personalPhone || '').replace(/[\r\n]+/g, ' ').trim();
  const ticketCode = String(record?.ticketCode || 'CSG17-VIP').replace(/[\r\n]+/g, ' ').trim();
  const isApproved100 = Boolean(record?.isApproved100);

  let templateType: 'DEPOSIT_ALUMNI' | 'DEPOSIT_ACTIVE' | 'FULL_100';
  if (explicitTemplate && explicitTemplate !== 'AUTO') {
    templateType = explicitTemplate;
  } else if (isApproved100 || record?.status === 'FULLY_PAID' || record?.remainingAmount === 0) {
    templateType = 'FULL_100';
  } else if (role === 'ALUMNI' || role === 'GUEST') {
    templateType = 'DEPOSIT_ALUMNI';
  } else {
    templateType = 'DEPOSIT_ACTIVE';
  }

  const transferSyntax = `CSG17 - ${fullName.toUpperCase()} - ${phone || 'SĐT'}`;
  const vietQrUrlAlumni = `https://img.vietqr.io/image/ICB-104881849322-compact2.png?amount=239000&addInfo=${encodeURIComponent(transferSyntax)}&accountName=NGUYEN%20PHUONG%20THAO`;
  const vietQrUrlActive = `https://img.vietqr.io/image/ICB-104881849322-compact2.png?amount=199000&addInfo=${encodeURIComponent(transferSyntax)}&accountName=NGUYEN%20PHUONG%20THAO`;

  const simpleHtml = (bodyText: string) => `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.7; color: #111111; max-width: 650px; margin: 0 auto; padding: 20px 0; white-space: pre-line;">
${escapeHtml(bodyText)}
</div>
`.trim();

  /* ================= TEMPLATE 1: DEPOSIT ALUMNI (KHỚP 100% MẪU BTC) ================= */
  if (templateType === 'DEPOSIT_ALUMNI') {
    const subject = `[CÓC SÀI GÒN] XÁC NHẬN THANH TOÁN PHÍ THAM DỰ SINH NHẬT CÓC SÀI GÒN 17 TUỔI`;
    const text = `Thân gửi ${fullName},
Ban Tổ Chức Cóc Sài Gòn đã nhận được khoản thanh toán đặt cọc 150.000 VNĐ của bạn cho buổi tiệc sinh nhật Cóc Sài Gòn 17 tuổi: The Next Signal. Cảm ơn bạn đã đăng ký tham dự!  Ban Tổ Chức rất mong được gặp bạn trong ngày sinh nhật đặc biệt sắp tới! 
Ban Tổ Chức xin gửi bạn thông tin thanh toán như sau:
Tổng phí tham dự: 389.000 VNĐ
Số tiền đã đặt cọc: 150.000 VNĐ
Số tiền còn lại cần thanh toán: 239.000 VNĐ
Bạn vui lòng hoàn tất khoản thanh toán còn lại trước 05.12.2026 để BTC có thể chuẩn bị chu đáo nhất cho sự hiện diện của bạn nhé! 
Nếu muốn thanh toán ngay, bạn có thể quét mã QR bên dưới để hoàn tất khoản phí còn lại 239.000 VNĐ.
Link VietQR: ${vietQrUrlAlumni}
Khi chuyển khoản, bạn đừng quên ghi nội dung theo cú pháp ${transferSyntax} để Ban Tổ Chức dễ dàng xác nhận nhé!
17 năm là hành trình được viết nên bởi nhiều thế hệ, và thật vui vì lần này chúng ta lại có dịp gặp nhau. Hẹn gặp bạn tại ngày hội ngộ của đại gia đình Cóc Sài Gòn!
Thân mến,
BAN TỔ CHỨC SINH NHẬT CÓC SÀI GÒN 17 TUỔI`;

    return { subject, html: simpleHtml(text), text, templateType };
  }

  /* ================= TEMPLATE 2: DEPOSIT ACTIVE (KHỚP 100% MẪU BTC) ================= */
  if (templateType === 'DEPOSIT_ACTIVE') {
    const subject = `[CÓC SÀI GÒN] XÁC NHẬN THANH TOÁN PHÍ THAM DỰ SINH NHẬT CÓC SÀI GÒN 17 TUỔI`;
    const text = `Thân gửi ${fullName},
Ban Tổ Chức Cóc Sài Gòn đã nhận được khoản thanh toán đặt cọc 150.000 VNĐ của bạn cho buổi tiệc sinh nhật Cóc Sài Gòn 17 tuổi: The Next Signal. Cảm ơn bạn đã đăng ký tham dự!  Ban Tổ Chức rất mong được gặp bạn trong ngày sinh nhật đặc biệt sắp tới! 
Ban Tổ Chức xin gửi bạn thông tin thanh toán như sau:
Tổng phí tham dự: 349.000 VNĐ
Số tiền đã đặt cọc: 150.000 VNĐ
Số tiền còn lại cần thanh toán: 199.000 VNĐ
Bạn vui lòng hoàn tất khoản thanh toán còn lại trước 05.12.2026 để BTC có thể chuẩn bị chu đáo nhất cho sự hiện diện của bạn nhé! 
Nếu muốn thanh toán ngay, bạn có thể quét mã QR bên dưới để hoàn tất khoản phí còn lại 199.000 VNĐ.
Link VietQR: ${vietQrUrlActive}
Khi chuyển khoản, bạn đừng quên ghi nội dung theo cú pháp ${transferSyntax} để Ban Tổ Chức dễ dàng xác nhận nhé!
17 năm là hành trình được viết nên bởi nhiều thế hệ, và thật vui vì lần này chúng ta lại có dịp gặp nhau. Hẹn gặp bạn tại ngày hội ngộ của đại gia đình Cóc Sài Gòn!
Thân mến,
BAN TỔ CHỨC SINH NHẬT CÓC SÀI GÒN 17 TUỔI`;

    return { subject, html: simpleHtml(text), text, templateType };
  }

  /* ================= TEMPLATE 3: FULL 100% (KHÔNG DÙNG MÃ CHECK-IN) ================= */
  const subject = `[CÓC SÀI GÒN] XÁC NHẬN ĐĂNG KÝ THÀNH CÔNG – SINH NHẬT CÓC SÀI GÒN 17 TUỔI`;
  const text = `Thân gửi ${fullName},
Ban Tổ Chức Cóc Sài Gòn xin xác nhận bạn đã hoàn tất đăng ký tham dự sự kiện sinh nhật 17 tuổi: The Next Signal. Vậy là bạn đã chính thức có một chỗ hẹn cùng đại gia đình Cóc Sài Gòn trong cột mốc đặc biệt này rồi!
17 năm là hành trình được viết nên bởi nhiều thế hệ, và mỗi người đều mang theo một mảnh ghép thật riêng trong câu chuyện ấy. Dù bạn đã từng đồng hành cùng Cóc từ những ngày đầu hay chỉ vừa mới bắt đầu hành trình của mình, chúng ta đều có chung một điểm hẹn mang tên Cóc Sài Gòn.
Hẹn gặp bạn tại Tiệc Sinh nhật Cóc Sài Gòn 17 tuổi: The Next Signal. Cùng nhau tạo nên một ngày hội ngộ thật đáng nhớ nhé!
Thân mến,
BAN TỔ CHỨC SINH NHẬT CÓC SÀI GÒN 17 TUỔI`;

  return { subject, html: simpleHtml(text), text, templateType: 'FULL_100' };
}
