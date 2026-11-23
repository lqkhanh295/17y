export interface CalendarEventRecord {
  id?: string;
  fullName?: string;
  mssv?: string;
  ticketCode?: string;
  gmail?: string;
}

export const CSG_EVENT_DETAILS = {
  title: 'CÓC SÀI GÒN 17th BIRTHDAY: THE NEXT SIGNAL',
  dateFormatted: '12.12.2026',
  timeFormatted: '17:00 - 22:00',
  startUtc: '20261212T100000Z', // 17:00 GMT+7
  endUtc: '20261212T150000Z',   // 22:00 GMT+7
  location: 'Đồi Sứ Villa'
};

/**
 * Generate 1-click Google Calendar Event Link
 */
export function createGoogleCalendarUrl(record?: CalendarEventRecord): string {
  const { title, startUtc, endUtc, location, dateFormatted, timeFormatted } = CSG_EVENT_DETAILS;
  
  const attendeeInfo = record?.fullName
    ? `\nNgười tham dự: ${record.fullName}${record.mssv ? ` (${record.mssv})` : ''}\n`
    : '';

  const details = `Đại tiệc sinh nhật Cóc Sài Gòn 17 tuổi: THE NEXT SIGNAL!
Thời gian: ${timeFormatted} ngày ${dateFormatted}
Địa điểm: ${location}
${attendeeInfo}
Cùng nhau tạo nên một đêm hội ngộ 17 năm thanh xuân áo vàng thật rực rỡ và đáng nhớ!`;

  let url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startUtc}/${endUtc}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
  
  if (record?.gmail) {
    url += `&add=${encodeURIComponent(record.gmail)}`;
  }
  
  return url;
}

/**
 * Generate iCalendar (.ics) string for download or email invitation
 */
export function generateIcsContent(record?: CalendarEventRecord): string {
  const { title, startUtc, endUtc, location } = CSG_EVENT_DETAILS;
  const uid = `csg17y-${record?.id || Date.now()}@cocsaigon.com`;
  const fullName = record?.fullName || 'Thành viên Cóc Sài Gòn';
  const ticketCode = record?.ticketCode || 'CSG17';
  const attendeeEmail = record?.gmail;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Coc Sai Gon//CSG 17Y Event//VI',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
    `DTSTART:${startUtc}`,
    `DTEND:${endUtc}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:Đại tiệc sinh nhật Cóc Sài Gòn 17 tuổi: THE NEXT SIGNAL!\\nThời gian: 17:00 - 22:00 ngày 12.12.2026\\nĐịa điểm: ${location}\\nHọ và tên: ${fullName}\\nMã vé: ${ticketCode}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    attendeeEmail ? `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=${fullName}:mailto:${attendeeEmail}` : '',
    'ORGANIZER;CN=Ban Tổ Chức Cóc Sài Gòn:mailto:no-reply@cocsaigon.com',
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Nhắc lịch: Đại tiệc sinh nhật Cóc Sài Gòn 17th BIRTHDAY: THE NEXT SIGNAL (12.12.2026)!',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n');
}

/**
 * Download .ics file in browser
 */
export function downloadIcsFile(record?: CalendarEventRecord): void {
  const content = generateIcsContent(record);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `CSG17Y_${record?.mssv || 'Event'}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
