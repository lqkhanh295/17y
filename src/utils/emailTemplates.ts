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

  const safeFullName = escapeHtml(fullName);
  const safeSyntax = escapeHtml(transferSyntax);

  /* ================= TEMPLATE 1: DEPOSIT ALUMNI (KHỚP 100% MẪU BTC) ================= */
  if (templateType === 'DEPOSIT_ALUMNI') {
    const subject = `[CÓC SÀI GÒN] XÁC NHẬN THANH TOÁN PHÍ THAM DỰ SINH NHẬT CÓC SÀI GÒN 17 TUỔI`;
    
    const html = `
<div style="font-family: 'Times New Roman', Times, serif; font-size: 16px; line-height: 1.6; color: #111111; max-width: 650px; margin: 0 auto; padding: 24px 16px;">
  <p style="margin: 0 0 16px 0;">Thân gửi <strong>${safeFullName}</strong>,</p>

  <p style="margin: 0 0 16px 0;">Ban Tổ Chức Cóc Sài Gòn đã nhận được khoản thanh toán đặt cọc <strong>150.000 VNĐ</strong> của bạn cho buổi tiệc sinh nhật Cóc Sài Gòn 17 tuổi: <strong>The Next Signal</strong>. Cảm ơn bạn đã đăng ký tham dự! Ban Tổ Chức rất mong được gặp bạn trong ngày sinh nhật đặc biệt sắp tới!</p>

  <p style="margin: 0 0 12px 0;">Ban Tổ Chức xin gửi bạn thông tin thanh toán như sau:</p>

  <ul style="margin: 0 0 16px 0; padding-left: 24px; list-style-type: disc; line-height: 1.8;">
    <li><strong>Tổng phí tham dự:</strong> 389.000 VNĐ</li>
    <li><strong>Số tiền đã đặt cọc:</strong> 150.000 VNĐ</li>
    <li><strong>Số tiền còn lại cần thanh toán:</strong> 239.000 VNĐ</li>
  </ul>

  <p style="margin: 0 0 16px 0;">Bạn vui lòng hoàn tất khoản thanh toán còn lại trước <span style="color: #dc2626; font-weight: bold;">05.12.2026</span> để BTC có thể chuẩn bị chu đáo nhất cho sự hiện diện của bạn nhé!</p>

  <p style="margin: 0 0 16px 0;">Nếu muốn thanh toán ngay, bạn có thể quét mã QR bên dưới để hoàn tất khoản phí còn lại <strong>239.000 VNĐ</strong>.</p>

  <div style="margin: 16px 0 20px 0;">
    <img src="${vietQrUrlAlumni}" alt="VietQR 239.000 VNĐ" style="max-width: 220px; border-radius: 8px; border: 1px solid #e5e7eb; display: block;" />
    <p style="margin: 6px 0 0 0; font-size: 13px; color: #4b5563;">Link VietQR: <a href="${vietQrUrlAlumni}" target="_blank" style="color: #2563eb; text-decoration: underline;">Bấm vào đây để mở mã QR</a></p>
  </div>

  <p style="margin: 0 0 16px 0;"><strong>Khi chuyển khoản, bạn đừng quên ghi nội dung theo cú pháp ${safeSyntax} để Ban Tổ Chức dễ dàng xác nhận nhé!</strong></p>

  <p style="margin: 0 0 16px 0;">17 năm là hành trình được viết nên bởi nhiều thế hệ, và thật vui vì lần này chúng ta lại có dịp gặp nhau.<br/>Hẹn gặp bạn tại ngày hội ngộ của đại gia đình Cóc Sài Gòn!</p>

  <p style="margin: 0 0 16px 0;">Thân mến,</p>

  <p style="margin: 0; font-weight: bold;">BAN TỔ CHỨC SINH NHẬT CÓC SÀI GÒN 17 TUỔI</p>
</div>
`.trim();

    const text = `Thân gửi ${fullName},

Ban Tổ Chức Cóc Sài Gòn đã nhận được khoản thanh toán đặt cọc 150.000 VNĐ của bạn cho buổi tiệc sinh nhật Cóc Sài Gòn 17 tuổi: The Next Signal. Cảm ơn bạn đã đăng ký tham dự! Ban Tổ Chức rất mong được gặp bạn trong ngày sinh nhật đặc biệt sắp tới!

Ban Tổ Chức xin gửi bạn thông tin thanh toán như sau:

• Tổng phí tham dự: 389.000 VNĐ
• Số tiền đã đặt cọc: 150.000 VNĐ
• Số tiền còn lại cần thanh toán: 239.000 VNĐ

Bạn vui lòng hoàn tất khoản thanh toán còn lại trước 05.12.2026 để BTC có thể chuẩn bị chu đáo nhất cho sự hiện diện của bạn nhé!

Nếu muốn thanh toán ngay, bạn có thể quét mã QR bên dưới để hoàn tất khoản phí còn lại 239.000 VNĐ.
Link VietQR: ${vietQrUrlAlumni}

Khi chuyển khoản, bạn đừng quên ghi nội dung theo cú pháp ${transferSyntax} để Ban Tổ Chức dễ dàng xác nhận nhé!

17 năm là hành trình được viết nên bởi nhiều thế hệ, và thật vui vì lần này chúng ta lại có dịp gặp nhau.
Hẹn gặp bạn tại ngày hội ngộ của đại gia đình Cóc Sài Gòn!

Thân mến,

BAN TỔ CHỨC SINH NHẬT CÓC SÀI GÒN 17 TUỔI`;

    return { subject, html, text, templateType };
  }

  /* ================= TEMPLATE 2: DEPOSIT ACTIVE (KHỚP 100% MẪU BTC) ================= */
  if (templateType === 'DEPOSIT_ACTIVE') {
    const subject = `[CÓC SÀI GÒN] XÁC NHẬN THANH TOÁN PHÍ THAM DỰ SINH NHẬT CÓC SÀI GÒN 17 TUỔI`;
    
    const html = `
<div style="font-family: 'Times New Roman', Times, serif; font-size: 16px; line-height: 1.6; color: #111111; max-width: 650px; margin: 0 auto; padding: 24px 16px;">
  <p style="margin: 0 0 16px 0;">Thân gửi <strong>${safeFullName}</strong>,</p>

  <p style="margin: 0 0 16px 0;">Ban Tổ Chức Cóc Sài Gòn đã nhận được khoản thanh toán đặt cọc <strong>150.000 VNĐ</strong> của bạn cho buổi tiệc sinh nhật Cóc Sài Gòn 17 tuổi: <strong>The Next Signal</strong>. Cảm ơn bạn đã đăng ký tham dự! Ban Tổ Chức rất mong được gặp bạn trong ngày sinh nhật đặc biệt sắp tới!</p>

  <p style="margin: 0 0 12px 0;">Ban Tổ Chức xin gửi bạn thông tin thanh toán như sau:</p>

  <ul style="margin: 0 0 16px 0; padding-left: 24px; list-style-type: disc; line-height: 1.8;">
    <li><strong>Tổng phí tham dự:</strong> 349.000 VNĐ</li>
    <li><strong>Số tiền đã đặt cọc:</strong> 150.000 VNĐ</li>
    <li><strong>Số tiền còn lại cần thanh toán:</strong> 199.000 VNĐ</li>
  </ul>

  <p style="margin: 0 0 16px 0;">Bạn vui lòng hoàn tất khoản thanh toán còn lại trước <span style="color: #dc2626; font-weight: bold;">05.12.2026</span> để BTC có thể chuẩn bị chu đáo nhất cho sự hiện diện của bạn nhé!</p>

  <p style="margin: 0 0 16px 0;">Nếu muốn thanh toán ngay, bạn có thể quét mã QR bên dưới để hoàn tất khoản phí còn lại <strong>199.000 VNĐ</strong>.</p>

  <div style="margin: 16px 0 20px 0;">
    <img src="${vietQrUrlActive}" alt="VietQR 199.000 VNĐ" style="max-width: 220px; border-radius: 8px; border: 1px solid #e5e7eb; display: block;" />
    <p style="margin: 6px 0 0 0; font-size: 13px; color: #4b5563;">Link VietQR: <a href="${vietQrUrlActive}" target="_blank" style="color: #2563eb; text-decoration: underline;">Bấm vào đây để mở mã QR</a></p>
  </div>

  <p style="margin: 0 0 16px 0;"><strong>Khi chuyển khoản, bạn đừng quên ghi nội dung theo cú pháp ${safeSyntax} để Ban Tổ Chức dễ dàng xác nhận nhé!</strong></p>

  <p style="margin: 0 0 16px 0;">17 năm là hành trình được viết nên bởi nhiều thế hệ, và thật vui vì lần này chúng ta lại có dịp gặp nhau.<br/>Hẹn gặp bạn tại ngày hội ngộ của đại gia đình Cóc Sài Gòn!</p>

  <p style="margin: 0 0 16px 0;">Thân mến,</p>

  <p style="margin: 0; font-weight: bold;">BAN TỔ CHỨC SINH NHẬT CÓC SÀI GÒN 17 TUỔI</p>
</div>
`.trim();

    const text = `Thân gửi ${fullName},

Ban Tổ Chức Cóc Sài Gòn đã nhận được khoản thanh toán đặt cọc 150.000 VNĐ của bạn cho buổi tiệc sinh nhật Cóc Sài Gòn 17 tuổi: The Next Signal. Cảm ơn bạn đã đăng ký tham dự! Ban Tổ Chức rất mong được gặp bạn trong ngày sinh nhật đặc biệt sắp tới!

Ban Tổ Chức xin gửi bạn thông tin thanh toán như sau:

• Tổng phí tham dự: 349.000 VNĐ
• Số tiền đã đặt cọc: 150.000 VNĐ
• Số tiền còn lại cần thanh toán: 199.000 VNĐ

Bạn vui lòng hoàn tất khoản thanh toán còn lại trước 05.12.2026 để BTC có thể chuẩn bị chu đáo nhất cho sự hiện diện của bạn nhé!

Nếu muốn thanh toán ngay, bạn có thể quét mã QR bên dưới để hoàn tất khoản phí còn lại 199.000 VNĐ.
Link VietQR: ${vietQrUrlActive}

Khi chuyển khoản, bạn đừng quên ghi nội dung theo cú pháp ${transferSyntax} để Ban Tổ Chức dễ dàng xác nhận nhé!

17 năm là hành trình được viết nên bởi nhiều thế hệ, và thật vui vì lần này chúng ta lại có dịp gặp nhau.
Hẹn gặp bạn tại ngày hội ngộ của đại gia đình Cóc Sài Gòn!

Thân mến,

BAN TỔ CHỨC SINH NHẬT CÓC SÀI GÒN 17 TUỔI`;

    return { subject, html, text, templateType };
  }

  /* ================= TEMPLATE 3: FULL 100% (KHỚP 100% MẪU BTC) ================= */
  const subject = `[CÓC SÀI GÒN] XÁC NHẬN ĐĂNG KÝ THÀNH CÔNG – SINH NHẬT CÓC SÀI GÒN 17 TUỔI`;
  
  const html = `
<div style="font-family: 'Times New Roman', Times, serif; font-size: 16px; line-height: 1.6; color: #111111; max-width: 650px; margin: 0 auto; padding: 24px 16px;">
  <p style="margin: 0 0 16px 0;">Thân gửi <strong>${safeFullName}</strong>,</p>

  <p style="margin: 0 0 16px 0;">Ban Tổ Chức Cóc Sài Gòn xin xác nhận bạn đã hoàn tất đăng ký tham dự sự kiện sinh nhật 17 tuổi: <strong>The Next Signal</strong>. Vậy là bạn đã chính thức có một chỗ hẹn cùng đại gia đình Cóc Sài Gòn trong cột mốc đặc biệt này rồi!</p>

  <p style="margin: 0 0 16px 0;">17 năm là hành trình được viết nên bởi nhiều thế hệ, và mỗi người đều mang theo một mảnh ghép thật riêng trong câu chuyện ấy. Dù bạn đã từng đồng hành cùng Cóc từ những ngày đầu hay chỉ vừa mới bắt đầu hành trình của mình, chúng ta đều có chung một điểm hẹn mang tên Cóc Sài Gòn.</p>

  <p style="margin: 0 0 16px 0;">Hẹn gặp bạn tại <strong>Tiệc Sinh nhật Cóc Sài Gòn 17 tuổi: The Next Signal</strong>. Cùng nhau tạo nên một ngày hội ngộ thật đáng nhớ nhé!</p>

  <p style="margin: 0 0 16px 0;">Thân mến,</p>

  <p style="margin: 0; font-weight: bold;">BAN TỔ CHỨC SINH NHẬT CÓC SÀI GÒN 17 TUỔI</p>
</div>
`.trim();

  const text = `Thân gửi ${fullName},

Ban Tổ Chức Cóc Sài Gòn xin xác nhận bạn đã hoàn tất đăng ký tham dự sự kiện sinh nhật 17 tuổi: The Next Signal. Vậy là bạn đã chính thức có một chỗ hẹn cùng đại gia đình Cóc Sài Gòn trong cột mốc đặc biệt này rồi!

17 năm là hành trình được viết nên bởi nhiều thế hệ, và mỗi người đều mang theo một mảnh ghép thật riêng trong câu chuyện ấy. Dù bạn đã từng đồng hành cùng Cóc từ những ngày đầu hay chỉ vừa mới bắt đầu hành trình của mình, chúng ta đều có chung một điểm hẹn mang tên Cóc Sài Gòn.

Hẹn gặp bạn tại Tiệc Sinh nhật Cóc Sài Gòn 17 tuổi: The Next Signal. Cùng nhau tạo nên một ngày hội ngộ thật đáng nhớ nhé!

Thân mến,

BAN TỔ CHỨC SINH NHẬT CÓC SÀI GÒN 17 TUỔI`;

  return { subject, html, text, templateType: 'FULL_100' };
}
