/**
 * CÓC SÀI GÒN 17Y - PHOTOBOOK DATA ARCHIVE
 * 
 * Lưu trữ tập trung toàn bộ dữ liệu hình ảnh và nội dung của cuốn Photobook 17 năm.
 * Khi có bộ ảnh sự kiện chính thức của CLB Cóc Sài Gòn, bạn chỉ cần thay đổi đường dẫn `src`
 * trong file này mà KHÔNG cần phải sửa đổi bất kỳ mã nguồn layout nào.
 */

export interface PhotobookImage {
  id: string;
  src: string;
  alt: string;
  aspectRatio?: 'panoramic' | 'landscape' | 'portrait' | 'square';
  note?: string; // Ghi chú tối giản (nếu có, không bịa đặt sự kiện)
  year?: string;
}

export const PHOTOBOOK_IMAGES: Record<string, PhotobookImage> = {
  // 1. Ảnh khai mở: Bàn tiệc đại hội ngộ
  cover: {
    id: 'photo-cover',
    src: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1800&q=85',
    alt: 'Bàn tiệc đại hội ngộ dưới ánh đèn ấm áp',
    aspectRatio: 'landscape',
    note: 'Bàn tiệc hội ngộ',
    year: '2026'
  },
  // 2. Ảnh phụ khai mở: Khoảnh khắc nụ cười
  coverOffset: {
    id: 'photo-cover-offset',
    src: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=85',
    alt: 'Những nụ cười đồng đội',
    aspectRatio: 'portrait',
    note: 'Tuổi trẻ cùng nhau'
  },
  // 3. Ảnh tác nghiệp / góc máy sân trường
  camera: {
    id: 'photo-camera',
    src: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=85',
    alt: 'Góc máy tác nghiệp',
    aspectRatio: 'portrait',
    year: '2009 — 2026'
  },
  // 4. Bàn tròn làm việc / thảo luận
  workspace: {
    id: 'photo-workspace',
    src: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=85',
    alt: 'Bàn tròn làm việc và sáng tạo',
    aspectRatio: 'landscape'
  },
  // 5. Toàn cảnh bãi biển / teambuilding
  beachPanoramic: {
    id: 'photo-beach',
    src: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1800&q=85',
    alt: 'Những chuyến đi sắc áo vàng bên bờ biển',
    aspectRatio: 'panoramic',
    note: 'Những chuyến xe nối dài tình anh em'
  },
  // 6. Đêm lửa trại
  bonfire: {
    id: 'photo-bonfire',
    src: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=85',
    alt: 'Đêm lửa trại ấm áp',
    aspectRatio: 'square'
  },
  // 7. Sân khấu âm nhạc và ánh sáng
  stage: {
    id: 'photo-stage',
    src: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1400&q=85',
    alt: 'Sân khấu âm nhạc và ánh sáng',
    aspectRatio: 'landscape'
  },
  // 8. Khoảnh khắc nâng ly và thổi nến
  celebrationToast: {
    id: 'photo-toast',
    src: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=85',
    alt: 'Nâng ly chúc mừng sinh nhật',
    aspectRatio: 'landscape'
  },
  // 9. Vòng tay gắn kết và niềm vui
  gatheringCrowd: {
    id: 'photo-crowd',
    src: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1600&q=85',
    alt: 'Vòng tay gắn kết các thế hệ',
    aspectRatio: 'landscape'
  }
};

// Danh sách tuần tự cho Lightbox
export const ALL_PHOTOBOOK_IMAGES = Object.values(PHOTOBOOK_IMAGES);

// Thông tin sự kiện Gala 17Y tập trung
export const GALA_EVENT_DETAILS = {
  title: 'ĐẠI TIỆC GALA 17Y',
  subtitle: 'Cóc Sài Gòn — Mười Bảy Năm Một Mái Nhà',
  time: '18:00 • Thứ Bảy, 19.12.2026',
  dateIso: '2026-12-19T18:00:00+07:00',
  venue: 'Asiana Plaza Tân Phú, TP. Hồ Chí Minh',
  address: '45-47 Vườn Lài, P. Phú Thọ Hòa, Q. Tân Phú, TP. HCM',
  dressCode: 'Sắc Áo Vàng Truyền Thống (Yellow & White Gold)',
  rsvpDeadline: '15.12.2026'
};
