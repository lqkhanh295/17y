import nodemailer from 'nodemailer';

// Formatting helper
function formatCurrency(amount) {
  if (typeof amount !== 'number') {
    amount = parseInt(amount, 10) || 0;
  }
  return amount.toLocaleString('vi-VN') + ' VNĐ';
}

/**
 * Generate email payload (subject, html, text, templateType)
 * based on user status or explicit templateType
 */
export function generateEmailContent(record, explicitTemplate) {
  const fullName = record.fullName || 'Bạn';
  const role = record.role || 'ACTIVE';
  const phone = record.personalPhone || '';
  const ticketCode = record.ticketCode || 'CSG17-VIP';
  const ticketToken = record.ticketToken || record.ticketCode || record.id;
  const isApproved100 = Boolean(record.isApproved100);

  // Determine template:
  // 1) DEPOSIT_ALUMNI: Alumni deposit (389k total, 150k deposit, 239k remaining)
  // 2) DEPOSIT_ACTIVE: Active deposit (349k total, 150k deposit, 199k remaining)
  // 3) FULL_100: Full approval / completed payment with Check-in QR
  let templateType = explicitTemplate;
  if (!templateType) {
    if (isApproved100 || record.status === 'FULLY_PAID' || record.remainingAmount === 0) {
      templateType = 'FULL_100';
    } else if (role === 'ALUMNI') {
      templateType = 'DEPOSIT_ALUMNI';
    } else {
      templateType = 'DEPOSIT_ACTIVE';
    }
  }

  const transferSyntax = `CSG17 - ${fullName.toUpperCase()} - ${phone || 'SDT'}`;

  // Shared responsive email wrapper styling
  const emailWrapper = (title, bodyContent) => `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      background-color: #0E0D0C;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #2D2823;
      line-height: 1.6;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #0E0D0C;
      padding: 30px 10px;
    }
    .main-card {
      max-width: 600px;
      margin: 0 auto;
      background-color: #FFFFFF;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.35);
      border: 1px solid #2A2420;
    }
    .header-banner {
      background: linear-gradient(135deg, #1C1917 0%, #26211C 100%);
      padding: 36px 32px 28px;
      text-align: center;
      border-bottom: 3px solid #F5C400;
    }
    .content-body {
      padding: 32px;
      color: #26211C;
      font-size: 15px;
    }
    .info-card {
      background: #FAF7F2;
      border: 1px solid #E8E2D8;
      border-radius: 12px;
      padding: 20px 24px;
      margin: 22px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px dashed #DDD5C7;
      font-size: 14px;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .qr-container {
      background: #FFFFFF;
      border: 2px dashed #D97706;
      border-radius: 14px;
      padding: 20px;
      text-align: center;
      margin: 24px 0;
      display: inline-block;
      width: 100%;
      box-sizing: border-box;
    }
    .highlight-badge {
      display: inline-block;
      background: #FEF3C7;
      color: #92400E;
      font-weight: 700;
      font-size: 13px;
      padding: 4px 12px;
      border-radius: 9999px;
      border: 1px solid #FDE68A;
      margin-bottom: 12px;
    }
    .syntax-box {
      background: #1C1917;
      color: #F5C400;
      font-family: 'Courier New', Courier, monospace;
      font-size: 15px;
      font-weight: bold;
      padding: 12px 16px;
      border-radius: 8px;
      text-align: center;
      letter-spacing: 0.5px;
      margin: 12px 0;
    }
    .footer {
      background-color: #161311;
      color: #9CA3AF;
      font-size: 12px;
      text-align: center;
      padding: 24px;
      border-top: 1px solid #2B2520;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="main-card">
      <!-- Header with CSG Logo / Title -->
      <div class="header-banner">
        <div style="font-size: 11px; letter-spacing: 2.5px; text-transform: uppercase; color: #F5C400; font-weight: 800; margin-bottom: 6px;">
          ✦ CLB TRUYỀN THÔNG CÓC SÀI GÒN ✦
        </div>
        <h1 style="color: #FFFFFF; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">
          SINH NHẬT CÓC SÀI GÒN 17 TUỔI
        </h1>
        <div style="color: #E5E7EB; font-size: 13px; font-weight: 500; margin-top: 4px; letter-spacing: 1px;">
          THE NEXT SIGNAL • 12.12.2026
        </div>
      </div>

      <!-- Main Body -->
      <div class="content-body">
        ${bodyContent}
      </div>

      <!-- Footer -->
      <div class="footer">
        <p style="margin: 0 0 6px 0; color: #E5E7EB; font-weight: 600;">
          BAN TỔ CHỨC SINH NHẬT CÓC SÀI GÒN 17 TUỔI
        </p>
        <p style="margin: 0 0 8px 0; color: #9CA3AF;">
          Trường Đại học FPT TP. Hồ Chí Minh • TP. Thủ Đức
        </p>
        <p style="margin: 0; font-size: 11px; color: #6B7280;">
          Email tự động được gửi từ hệ thống đăng ký Cóc Sài Gòn 17 tuổi.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;

  /* ================= TEMPLATE 1: DEPOSIT ALUMNI ================= */
  if (templateType === 'DEPOSIT_ALUMNI') {
    const subject = `[CÓC SÀI GÒN] XÁC NHẬN THANH TOÁN PHÍ THAM DỰ SINH NHẬT CÓC SÀI GÒN 17 TUỔI`;
    const remainingAmount = 239000;
    const vietQrUrl = `https://img.vietqr.io/image/ICB-104881849322-compact2.png?amount=239000&addInfo=${encodeURIComponent(transferSyntax)}&accountName=NGUYEN%20PHUONG%20THAO`;

    const html = emailWrapper(
      subject,
      `
      <p style="font-size: 16px; margin-top: 0;"><strong>Thân gửi ${fullName},</strong></p>
      
      <p>
        Ban Tổ Chức Cóc Sài Gòn đã nhận được khoản thanh toán đặt cọc <strong>150.000 VNĐ</strong> của bạn cho buổi tiệc sinh nhật <strong>Cóc Sài Gòn 17 tuổi: The Next Signal</strong>. Cảm ơn bạn đã đăng ký tham dự! Ban Tổ Chức rất mong được gặp bạn trong ngày sinh nhật đặc biệt sắp tới!
      </p>

      <div class="info-card">
        <div style="font-weight: 700; color: #92400E; font-size: 13px; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.5px;">
          📋 THÔNG TIN THANH TOÁN CỦA BẠN (CỰU THÀNH VIÊN)
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #4B5563; font-size: 14px;">Họ và tên:</td>
            <td style="padding: 8px 0; font-weight: 600; text-align: right; color: #1F2937;">${fullName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #4B5563; font-size: 14px; border-top: 1px dashed #E5E7EB;">Tổng phí tham dự:</td>
            <td style="padding: 8px 0; font-weight: 700; text-align: right; color: #1F2937; border-top: 1px dashed #E5E7EB;">389.000 VNĐ</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #059669; font-size: 14px; border-top: 1px dashed #E5E7EB;">Số tiền đã đặt cọc:</td>
            <td style="padding: 8px 0; font-weight: 700; text-align: right; color: #059669; border-top: 1px dashed #E5E7EB;">150.000 VNĐ</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #DC2626; font-size: 14px; font-weight: 600; border-top: 1px dashed #E5E7EB;">Số tiền còn lại cần thanh toán:</td>
            <td style="padding: 8px 0; font-weight: 800; text-align: right; color: #DC2626; font-size: 16px; border-top: 1px dashed #E5E7EB;">239.000 VNĐ</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #FEF2F2; border-left: 4px solid #DC2626; padding: 14px 16px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0; color: #991B1B; font-size: 14px; font-weight: 600;">
          ⏰ Hạn hoàn tất thanh toán:
        </p>
        <p style="margin: 4px 0 0; color: #B91C1C; font-size: 14px;">
          Bạn vui lòng hoàn tất khoản thanh toán còn lại trước <strong>05.12.2026</strong> để BTC có thể chuẩn bị chu đáo nhất cho sự hiện diện của bạn nhé!
        </p>
      </div>

      <p style="margin-top: 24px;">
        Nếu muốn thanh toán ngay, bạn có thể quét mã QR bên dưới để hoàn tất khoản phí còn lại <strong>239.000 VNĐ</strong>:
      </p>

      <div class="qr-container">
        <div class="highlight-badge">MÃ VIETQR THANH TOÁN 239.000 VNĐ</div>
        <div style="margin: 12px auto; max-width: 280px;">
          <img src="${vietQrUrl}" alt="VietQR 239.000 VNĐ" style="width: 100%; max-width: 260px; height: auto; border-radius: 8px; border: 1px solid #E5E7EB;" />
        </div>
        <div style="font-size: 13px; color: #4B5563; margin-top: 8px;">
          Ngân hàng: <strong>VietinBank (ICB)</strong> • STK: <strong>104881849322</strong><br/>
          Chủ tài khoản: <strong>NGUYEN PHUONG THAO</strong>
        </div>
        <div style="margin-top: 12px; font-size: 12px; color: #6B7280;">Cú pháp chuyển khoản:</div>
        <div class="syntax-box">${transferSyntax}</div>
      </div>

      <p style="font-size: 13px; color: #4B5563; font-style: italic;">
        Khi chuyển khoản, bạn đừng quên ghi nội dung theo cú pháp <strong>${transferSyntax}</strong> để Ban Tổ Chức dễ dàng xác nhận nhé!
      </p>

      <p style="margin-top: 24px; color: #374151;">
        17 năm là hành trình được viết nên bởi nhiều thế hệ, và thật vui vì lần này chúng ta lại có dịp gặp nhau. Hẹn gặp bạn tại ngày hội ngộ của đại gia đình Cóc Sài Gòn!
      </p>

      <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #E5E7EB;">
        <p style="margin: 0; color: #4B5563;">Thân mến,</p>
        <p style="margin: 4px 0 0; font-weight: 800; color: #1F2937; letter-spacing: 0.5px;">
          BAN TỔ CHỨC SINH NHẬT CÓC SÀI GÒN 17 TUỔI
        </p>
      </div>
      `
    );

    const text = `[CÓC SÀI GÒN] XÁC NHẬN THANH TOÁN PHÍ THAM DỰ SINH NHẬT CÓC SÀI GÒN 17 TUỔI

Thân gửi ${fullName},

Ban Tổ Chức Cóc Sài Gòn đã nhận được khoản thanh toán đặt cọc 150.000 VNĐ của bạn cho buổi tiệc sinh nhật Cóc Sài Gòn 17 tuổi: The Next Signal. Cảm ơn bạn đã đăng ký tham dự! Ban Tổ Chức rất mong được gặp bạn trong ngày sinh nhật đặc biệt sắp tới!

Ban Tổ Chức xin gửi bạn thông tin thanh toán như sau:
Tổng phí tham dự: 389.000 VNĐ
Số tiền đã đặt cọc: 150.000 VNĐ
Số tiền còn lại cần thanh toán: 239.000 VNĐ

Bạn vui lòng hoàn tất khoản thanh toán còn lại trước 05.12.2026 để BTC có thể chuẩn bị chu đáo nhất cho sự hiện diện của bạn nhé!

Nếu muốn thanh toán ngay, bạn có thể quét mã QR bên dưới để hoàn tất khoản phí còn lại 239.000 VNĐ:
Link VietQR: ${vietQrUrl}

Thông tin chuyển khoản:
- Ngân hàng: VietinBank (ICB)
- Số tài khoản: 104881849322
- Chủ tài khoản: NGUYEN PHUONG THAO
- Số tiền: 239.000 VNĐ
- Cú pháp chuyển khoản: ${transferSyntax}

Khi chuyển khoản, bạn đừng quên ghi nội dung theo cú pháp CSG17 - [HỌ VÀ TÊN] - SĐT để Ban Tổ Chức dễ dàng xác nhận nhé!

17 năm là hành trình được viết nên bởi nhiều thế hệ, và thật vui vì lần này chúng ta lại có dịp gặp nhau. Hẹn gặp bạn tại ngày hội ngộ của đại gia đình Cóc Sài Gòn!

Thân mến,
BAN TỔ CHỨC SINH NHẬT CÓC SÀI GÒN 17 TUỔI`;

    return { subject, html, text, templateType };
  }

  /* ================= TEMPLATE 2: DEPOSIT ACTIVE ================= */
  if (templateType === 'DEPOSIT_ACTIVE') {
    const subject = `[CÓC SÀI GÒN] XÁC NHẬN THANH TOÁN PHÍ THAM DỰ SINH NHẬT CÓC SÀI GÒN 17 TUỔI`;
    const remainingAmount = 199000;
    const vietQrUrl = `https://img.vietqr.io/image/ICB-104881849322-compact2.png?amount=199000&addInfo=${encodeURIComponent(transferSyntax)}&accountName=NGUYEN%20PHUONG%20THAO`;

    const html = emailWrapper(
      subject,
      `
      <p style="font-size: 16px; margin-top: 0;"><strong>Thân gửi ${fullName},</strong></p>
      
      <p>
        Ban Tổ Chức Cóc Sài Gòn đã nhận được khoản thanh toán đặt cọc <strong>150.000 VNĐ</strong> của bạn cho buổi tiệc sinh nhật <strong>Cóc Sài Gòn 17 tuổi: The Next Signal</strong>. Cảm ơn bạn đã đăng ký tham dự! Ban Tổ Chức rất mong được gặp bạn trong ngày sinh nhật đặc biệt sắp tới!
      </p>

      <div class="info-card">
        <div style="font-weight: 700; color: #059669; font-size: 13px; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.5px;">
          📋 THÔNG TIN THANH TOÁN CỦA BẠN (THÀNH VIÊN HIỆN TẠI)
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #4B5563; font-size: 14px;">Họ và tên:</td>
            <td style="padding: 8px 0; font-weight: 600; text-align: right; color: #1F2937;">${fullName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #4B5563; font-size: 14px; border-top: 1px dashed #E5E7EB;">Tổng phí tham dự:</td>
            <td style="padding: 8px 0; font-weight: 700; text-align: right; color: #1F2937; border-top: 1px dashed #E5E7EB;">349.000 VNĐ</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #059669; font-size: 14px; border-top: 1px dashed #E5E7EB;">Số tiền đã đặt cọc:</td>
            <td style="padding: 8px 0; font-weight: 700; text-align: right; color: #059669; border-top: 1px dashed #E5E7EB;">150.000 VNĐ</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #DC2626; font-size: 14px; font-weight: 600; border-top: 1px dashed #E5E7EB;">Số tiền còn lại cần thanh toán:</td>
            <td style="padding: 8px 0; font-weight: 800; text-align: right; color: #DC2626; font-size: 16px; border-top: 1px dashed #E5E7EB;">199.000 VNĐ</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #FEF2F2; border-left: 4px solid #DC2626; padding: 14px 16px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0; color: #991B1B; font-size: 14px; font-weight: 600;">
          ⏰ Hạn hoàn tất thanh toán:
        </p>
        <p style="margin: 4px 0 0; color: #B91C1C; font-size: 14px;">
          Bạn vui lòng hoàn tất khoản thanh toán còn lại trước <strong>05.12.2026</strong> để BTC có thể chuẩn bị chu đáo nhất cho sự hiện diện của bạn nhé!
        </p>
      </div>

      <p style="margin-top: 24px;">
        Nếu muốn thanh toán ngay, bạn có thể quét mã QR bên dưới để hoàn tất khoản phí còn lại <strong>199.000 VNĐ</strong>:
      </p>

      <div class="qr-container">
        <div class="highlight-badge">MÃ VIETQR THANH TOÁN 199.000 VNĐ</div>
        <div style="margin: 12px auto; max-width: 280px;">
          <img src="${vietQrUrl}" alt="VietQR 199.000 VNĐ" style="width: 100%; max-width: 260px; height: auto; border-radius: 8px; border: 1px solid #E5E7EB;" />
        </div>
        <div style="font-size: 13px; color: #4B5563; margin-top: 8px;">
          Ngân hàng: <strong>VietinBank (ICB)</strong> • STK: <strong>104881849322</strong><br/>
          Chủ tài khoản: <strong>NGUYEN PHUONG THAO</strong>
        </div>
        <div style="margin-top: 12px; font-size: 12px; color: #6B7280;">Cú pháp chuyển khoản:</div>
        <div class="syntax-box">${transferSyntax}</div>
      </div>

      <p style="font-size: 13px; color: #4B5563; font-style: italic;">
        Khi chuyển khoản, bạn đừng quên ghi nội dung theo cú pháp <strong>${transferSyntax}</strong> để Ban Tổ Chức dễ dàng xác nhận nhé!
      </p>

      <p style="margin-top: 24px; color: #374151;">
        17 năm là hành trình được viết nên bởi nhiều thế hệ, và thật vui vì lần này chúng ta lại có dịp gặp nhau. Hẹn gặp bạn tại ngày hội ngộ của đại gia đình Cóc Sài Gòn!
      </p>

      <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #E5E7EB;">
        <p style="margin: 0; color: #4B5563;">Thân mến,</p>
        <p style="margin: 4px 0 0; font-weight: 800; color: #1F2937; letter-spacing: 0.5px;">
          BAN TỔ CHỨC SINH NHẬT CÓC SÀI GÒN 17 TUỔI
        </p>
      </div>
      `
    );

    const text = `[CÓC SÀI GÒN] XÁC NHẬN THANH TOÁN PHÍ THAM DỰ SINH NHẬT CÓC SÀI GÒN 17 TUỔI

Thân gửi ${fullName},

Ban Tổ Chức Cóc Sài Gòn đã nhận được khoản thanh toán đặt cọc 150.000 VNĐ của bạn cho buổi tiệc sinh nhật Cóc Sài Gòn 17 tuổi: The Next Signal. Cảm ơn bạn đã đăng ký tham dự! Ban Tổ Chức rất mong được gặp bạn trong ngày sinh nhật đặc biệt sắp tới!

Ban Tổ Chức xin gửi bạn thông tin thanh toán như sau:
Tổng phí tham dự: 349.000 VNĐ
Số tiền đã đặt cọc: 150.000 VNĐ
Số tiền còn lại cần thanh toán: 199.000 VNĐ

Bạn vui lòng hoàn tất khoản thanh toán còn lại trước 05.12.2026 để BTC có thể chuẩn bị chu đáo nhất cho sự hiện diện của bạn nhé!

Nếu muốn thanh toán ngay, bạn có thể quét mã QR bên dưới để hoàn tất khoản phí còn lại 199.000 VNĐ:
Link VietQR: ${vietQrUrl}

Thông tin chuyển khoản:
- Ngân hàng: VietinBank (ICB)
- Số tài khoản: 104881849322
- Chủ tài khoản: NGUYEN PHUONG THAO
- Số tiền: 199.000 VNĐ
- Cú pháp chuyển khoản: ${transferSyntax}

Khi chuyển khoản, bạn đừng quên ghi nội dung theo cú pháp CSG17 - [HỌ VÀ TÊN] - SĐT để Ban Tổ Chức dễ dàng xác nhận nhé!

17 năm là hành trình được viết nên bởi nhiều thế hệ, và thật vui vì lần này chúng ta lại có dịp gặp nhau. Hẹn gặp bạn tại ngày hội ngộ của đại gia đình Cóc Sài Gòn!

Thân mến,
BAN TỔ CHỨC SINH NHẬT CÓC SÀI GÒN 17 TUỔI`;

    return { subject, html, text, templateType };
  }

  /* ================= TEMPLATE 3: FULL 100% CONFIRMATION WITH QR ================= */
  const subject = `[CÓC SÀI GÒN] XÁC NHẬN ĐĂNG KÝ THÀNH CÔNG – SINH NHẬT CÓC SÀI GÒN 17 TUỔI`;
  const qrCheckinUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(ticketToken)}`;

  const html = emailWrapper(
    subject,
    `
    <p style="font-size: 16px; margin-top: 0;"><strong>Thân gửi ${fullName},</strong></p>
    
    <p>
      Ban Tổ Chức Cóc Sài Gòn xin xác nhận bạn đã hoàn tất đăng ký tham dự sự kiện sinh nhật <strong>17 tuổi: The Next Signal</strong>. Vậy là bạn đã chính thức có một chỗ hẹn cùng đại gia đình Cóc Sài Gòn trong cột mốc đặc biệt này rồi!
    </p>

    <p>
      Để chuẩn bị cho ngày hội ngộ, Ban Tổ Chức gửi bạn mã Check-in cá nhân bên dưới:
    </p>

    <div class="qr-container" style="border: 2px solid #F5C400; background: #FFFDF5;">
      <div style="font-size: 12px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #B45309; margin-bottom: 8px;">
        ✦ VÉ MỜI THAM DỰ CHÍNH THỨC ✦
      </div>
      <div style="font-size: 18px; font-weight: 800; color: #1F2937; margin-bottom: 14px;">
        MÃ CHECK-IN CỦA BẠN
      </div>

      <div style="margin: 0 auto; max-width: 240px; padding: 12px; background: #FFFFFF; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #E5E7EB;">
        <img src="${qrCheckinUrl}" alt="Mã QR Check-in" style="width: 100%; max-width: 216px; height: auto; display: block; margin: 0 auto;" />
      </div>

      <div style="margin-top: 16px; text-align: left; background: #FFFFFF; border-radius: 8px; padding: 14px 18px; border: 1px solid #E5E7EB;">
        <div style="font-size: 13px; color: #4B5563; margin-bottom: 4px;">
          Mã vé: <strong style="font-family: monospace; font-size: 15px; color: #059669;">${ticketCode}</strong>
        </div>
        <div style="font-size: 13px; color: #4B5563; margin-bottom: 4px;">
          Họ và tên: <strong style="color: #1F2937;">${fullName}</strong>
        </div>
        <div style="font-size: 13px; color: #4B5563; margin-bottom: 4px;">
          Thời gian: <strong style="color: #1F2937;">12.12.2026</strong>
        </div>
        <div style="font-size: 13px; color: #4B5563;">
          Trạng thái vé: <strong style="color: #059669;">ĐÃ HOÀN TẤT 100%</strong>
        </div>
      </div>
    </div>

    <div style="background-color: #ECFDF5; border-left: 4px solid #059669; padding: 14px 16px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0; color: #065F46; font-size: 14px;">
        📌 <strong>Lưu ý quan trọng:</strong> Bạn vui lòng lưu lại mã QR này và xuất trình tại khu vực Check-in vào ngày diễn ra sự kiện để Ban Tổ Chức hỗ trợ xác nhận thông tin và đón tiếp bạn nhé!
      </p>
    </div>

    <p style="margin-top: 24px; color: #374151; line-height: 1.7;">
      17 năm là hành trình được viết nên bởi nhiều thế hệ, và mỗi người đều mang theo một mảnh ghép thật riêng trong câu chuyện ấy. Dù bạn đã từng đồng hành cùng Cóc từ những ngày đầu hay chỉ vừa mới bắt đầu hành trình của mình, chúng ta đều có chung một điểm hẹn mang tên Cóc Sài Gòn.
    </p>

    <p style="color: #374151; font-weight: 600;">
      Hẹn gặp bạn tại Tiệc Sinh nhật Cóc Sài Gòn 17 tuổi: The Next Signal. Cùng nhau tạo nên một ngày hội ngộ thật đáng nhớ nhé!
    </p>

    <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #E5E7EB;">
      <p style="margin: 0; color: #4B5563;">Thân mến,</p>
      <p style="margin: 4px 0 0; font-weight: 800; color: #1F2937; letter-spacing: 0.5px;">
        BAN TỔ CHỨC SINH NHẬT CÓC SÀI GÒN 17 TUỔI
      </p>
    </div>
    `
  );

  const text = `[CÓC SÀI GÒN] XÁC NHẬN ĐĂNG KÝ THÀNH CÔNG – SINH NHẬT CÓC SÀI GÒN 17 TUỔI

Thân gửi ${fullName},

Ban Tổ Chức Cóc Sài Gòn xin xác nhận bạn đã hoàn tất đăng ký tham dự sự kiện sinh nhật 17 tuổi: The Next Signal. Vậy là bạn đã chính thức có một chỗ hẹn cùng đại gia đình Cóc Sài Gòn trong cột mốc đặc biệt này rồi!

Để chuẩn bị cho ngày hội ngộ, Ban Tổ Chức gửi bạn mã Check-in cá nhân bên dưới:

MÃ CHECK-IN CỦA BẠN
Link mã QR: ${qrCheckinUrl}
Mã vé: ${ticketCode}
Họ và tên: ${fullName}
Thời gian: 12.12.2026

Bạn vui lòng lưu lại mã QR này và xuất trình tại khu vực Check-in vào ngày diễn ra sự kiện để Ban Tổ Chức hỗ trợ xác nhận thông tin và đón tiếp bạn nhé!

17 năm là hành trình được viết nên bởi nhiều thế hệ, và mỗi người đều mang theo một mảnh ghép thật riêng trong câu chuyện ấy. Dù bạn đã từng đồng hành cùng Cóc từ những ngày đầu hay chỉ vừa mới bắt đầu hành trình của mình, chúng ta đều có chung một điểm hẹn mang tên Cóc Sài Gòn.

Hẹn gặp bạn tại Tiệc Sinh nhật Cóc Sài Gòn 17 tuổi: The Next Signal. Cùng nhau tạo nên một ngày hội ngộ thật đáng nhớ nhé!

Thân mến,
BAN TỔ CHỨC SINH NHẬT CÓC SÀI GÒN 17 TUỔI`;

  return { subject, html, text, templateType: 'FULL_100' };
}

/**
 * Create transport based on ENV or fallback to simulated/ethereal mode
 */
function createMailTransporter() {
  const host = process.env.SMTP_HOST || (process.env.GMAIL_USER ? 'smtp.gmail.com' : null);
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;

  if (host && user && pass) {
    return {
      transporter: nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass }
      }),
      isConfigured: true,
      sender: process.env.EMAIL_FROM || `"Ban Tổ Chức Cóc Sài Gòn" <${user}>`
    };
  }

  return {
    transporter: null,
    isConfigured: false,
    sender: `"Ban Tổ Chức Cóc Sài Gòn" <no-reply@cocsaigon.com>`
  };
}

/**
 * Send email to registrant
 */
export async function sendRegistrationEmail(record, options = {}) {
  const toEmail = record.gmail || options.toEmail;
  if (!toEmail) {
    return {
      success: false,
      message: 'Không tìm thấy địa chỉ email của người đăng ký.'
    };
  }

  const { subject, html, text, templateType } = generateEmailContent(record, options.templateType);
  const { transporter, isConfigured, sender } = createMailTransporter();

  const mailOptions = {
    from: sender,
    to: toEmail,
    subject,
    text,
    html
  };

  const timestamp = new Date().toISOString();

  // If real SMTP is configured, send through it
  if (isConfigured && transporter) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`[EmailService] Sent email (${templateType}) to ${toEmail} -> MessageId: ${info.messageId}`);
      return {
        success: true,
        sent: true,
        isConfigured: true,
        templateType,
        to: toEmail,
        subject,
        messageId: info.messageId,
        timestamp
      };
    } catch (err) {
      console.error(`[EmailService] SMTP error sending to ${toEmail}:`, err);
      return {
        success: false,
        error: err.message,
        isConfigured: true,
        templateType,
        to: toEmail,
        timestamp
      };
    }
  }

  // Fallback: Simulation/Dev mode (No SMTP configured)
  console.log(`[EmailService - DEV MODE] Email queued & simulated for ${toEmail}:
  Template: ${templateType}
  Subject: ${subject}
  Time: ${timestamp}`);

  return {
    success: true,
    sent: true,
    isConfigured: false,
    simulated: true,
    templateType,
    to: toEmail,
    subject,
    previewHtml: html,
    timestamp,
    message: 'Hệ thống đã tạo và gửi email (chế độ Test/Demo, SMTP chưa được cấu hình trong .env)'
  };
}
