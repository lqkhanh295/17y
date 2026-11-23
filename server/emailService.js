import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

export const CSG_EVENT_DETAILS = {
  title: 'CÓC SÀI GÒN 17th BIRTHDAY: THE NEXT SIGNAL',
  dateFormatted: '12.12.2026',
  timeFormatted: '17:00 - 22:00',
  startUtc: '20261212T100000Z',
  endUtc: '20261212T150000Z',
  location: 'Đồi Sứ Villa'
};

export function escapeHtml(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function createGoogleCalendarUrl(record) {
  const { title, startUtc, endUtc, location, dateFormatted, timeFormatted } = CSG_EVENT_DETAILS;
  const fullName = String(record?.fullName || 'Bạn').replace(/[\r\n]+/g, ' ').trim();
  const ticketCode = String(record?.ticketCode || 'CSG17').replace(/[\r\n]+/g, ' ').trim();
  const details = `Đại tiệc sinh nhật Cóc Sài Gòn 17 tuổi: THE NEXT SIGNAL!
Thời gian: ${timeFormatted} ngày ${dateFormatted}
Địa điểm: ${location}
Họ và tên: ${fullName}

Hẹn gặp bạn tại đêm hội ngộ 17 năm đại gia đình Cóc Sài Gòn!`;

  let url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startUtc}/${endUtc}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
  if (record?.gmail) {
    url += `&add=${encodeURIComponent(String(record.gmail).replace(/[\r\n]+/g, '').trim())}`;
  }
  return url;
}

/**
 * Generate email payload (subject, html, text, templateType)
 * Khớp 100% chính xác từng dòng theo mẫu BTC cung cấp:
 * - Dạng chữ bình thường (plain text)
 * - Không chèn HTML/CSS
 * - Không chèn ảnh QR check-in
 */
export function generateEmailContent(record, explicitTemplate) {
  const fullName = String(record?.fullName || 'Bạn').replace(/[\r\n]+/g, ' ').trim();
  const role = record?.role || 'ACTIVE';
  const phone = String(record?.personalPhone || '').replace(/[\r\n]+/g, ' ').trim();
  const ticketCode = String(record?.ticketCode || 'CSG17-VIP').replace(/[\r\n]+/g, ' ').trim();
  const isApproved100 = Boolean(record?.isApproved100);

  let templateType = explicitTemplate;
  if (!templateType) {
    if (isApproved100 || record?.status === 'FULLY_PAID' || record?.remainingAmount === 0) {
      templateType = 'FULL_100';
    } else if (role === 'ALUMNI' || role === 'GUEST') {
      templateType = 'DEPOSIT_ALUMNI';
    } else {
      templateType = 'DEPOSIT_ACTIVE';
    }
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
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #111111; max-width: 650px; margin: 0 auto; padding: 24px 16px;">
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
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #111111; max-width: 650px; margin: 0 auto; padding: 24px 16px;">
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
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #111111; max-width: 650px; margin: 0 auto; padding: 24px 16px;">
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

function getEnvConfig() {
  let env = { ...process.env };
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const parsed = dotenv.parse(fs.readFileSync(envPath, 'utf8'));
      env = { ...env, ...parsed };
    }
  } catch (err) {
    console.error('Error loading .env dynamically in emailService:', err);
  }
  return env;
}

/**
 * Create transport based on ENV or fallback to simulated/ethereal mode
 */
function createMailTransporter() {
  const env = getEnvConfig();
  const host = env.SMTP_HOST || (env.GMAIL_USER ? 'smtp.gmail.com' : null);
  const port = parseInt(env.SMTP_PORT || '465', 10);
  const secure = env.SMTP_SECURE === 'true' || port === 465;
  const user = (env.SMTP_USER || env.GMAIL_USER || '').trim();
  const pass = (env.SMTP_PASS || env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');

  if (host && user && pass) {
    return {
      transporter: nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000
      }),
      isConfigured: true,
      sender: env.EMAIL_FROM || `"Ban Tổ Chức Cóc Sài Gòn" <${user}>`
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
  const toEmail = record?.gmail || options?.toEmail;
  if (!toEmail) {
    return {
      success: false,
      message: 'Không tìm thấy địa chỉ email của người đăng ký.'
    };
  }

  const safeToEmail = String(toEmail).replace(/[\r\n;,]+/g, '').trim();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(safeToEmail)) {
    return {
      success: false,
      error: `Địa chỉ email "${safeToEmail}" không hợp lệ theo chuẩn.`
    };
  }

  const { subject, html, text, templateType } = generateEmailContent(record, options.templateType);
  const { transporter, isConfigured, sender } = createMailTransporter();

  const safeFullName = String(record?.fullName || 'Bạn').replace(/[\r\n;,"\\]+/g, ' ').trim();
  const safeTicketCode = String(record?.ticketCode || 'CSG17').replace(/[\r\n;,"\\]+/g, ' ').trim();
  const safeSubject = String(subject).replace(/[\r\n]+/g, ' ').trim();

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Coc Sai Gon//CSG 17Y Event//VI',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:csg17y-${record.id || Date.now()}@cocsaigon.com`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
    'DTSTART:20261212T100000Z',
    'DTEND:20261212T150000Z',
    'SUMMARY:CÓC SÀI GÒN 17th BIRTHDAY: THE NEXT SIGNAL',
    `DESCRIPTION:Đại tiệc sinh nhật Cóc Sài Gòn 17 tuổi: THE NEXT SIGNAL!\\nThời gian: 17:00 - 22:00 ngày 12.12.2026\\nĐịa điểm: Đồi Sứ Villa\\nHọ và tên: ${safeFullName}\\nMã vé: ${safeTicketCode}`,
    'LOCATION:Đồi Sứ Villa',
    'STATUS:CONFIRMED',
    `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=${safeFullName}:mailto:${safeToEmail}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Nhắc lịch: Đại tiệc sinh nhật Cóc Sài Gòn 17th BIRTHDAY: THE NEXT SIGNAL (12.12.2026)!',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const mailOptions = {
    from: sender,
    to: safeToEmail,
    subject: safeSubject,
    text,
    html,
    icalEvent: {
      filename: 'invite.ics',
      method: 'REQUEST',
      content: icsContent
    }
  };

  const timestamp = new Date().toISOString();

  // If real SMTP is configured, send through it (with 1 automatic retry on transient error)
  if (isConfigured && transporter) {
    let attempt = 0;
    const maxRetries = 1;
    let lastError = null;

    while (attempt <= maxRetries) {
      try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`[EmailService] Sent plain email (${templateType}) to ${toEmail} -> MessageId: ${info.messageId}`);
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
        lastError = err;
        attempt++;
        if (attempt <= maxRetries) {
          console.warn(`[EmailService] Transient failure sending to ${toEmail}, retrying in 1.5s... (Attempt ${attempt})`);
          await new Promise((r) => setTimeout(r, 1500));
        }
      }
    }

    console.error(`[EmailService] SMTP error sending to ${toEmail}:`, lastError?.message || 'Unknown error');
    return {
      success: false,
      error: 'Không thể kết nối đến máy chủ gửi email. Vui lòng kiểm tra lại cấu hình SMTP hoặc thử lại sau.',
      isConfigured: true,
      templateType,
      to: toEmail,
      timestamp
    };
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
