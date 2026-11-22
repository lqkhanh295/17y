/**
 * CÓC SÀI GÒN 17Y - PHOTO ARCHIVE DATA
 * 
 * Nguồn dữ liệu hình ảnh tập trung cho cuốn Photobook kỷ niệm 17 năm Cóc Sài Gòn.
 * Khi có bộ ảnh tư liệu thực tế, chỉ cần thay đổi đường dẫn `src` trong file này.
 * 
 * Lưu ý: Tuyệt đối không thêm mô tả bịa đặt, quote giả hay câu chuyện hư cấu.
 */

export interface PhotobookImage {
  id: string;
  src: string;
  alt: string;
  aspectRatio?: 'panoramic' | 'landscape' | 'portrait' | 'square';
}

export const PHOTOBOOK_IMAGES: Record<string, PhotobookImage> = {
  cover: {
    id: 'photo-cover',
    src: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1800&q=85',
    alt: 'Ảnh tư liệu 01',
    aspectRatio: 'landscape'
  },
  coverOffset: {
    id: 'photo-cover-offset',
    src: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=85',
    alt: 'Ảnh tư liệu 02',
    aspectRatio: 'portrait'
  },
  camera: {
    id: 'photo-camera',
    src: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=85',
    alt: 'Ảnh tư liệu 03',
    aspectRatio: 'portrait'
  },
  workspace: {
    id: 'photo-workspace',
    src: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=85',
    alt: 'Ảnh tư liệu 04',
    aspectRatio: 'landscape'
  },
  beachPanoramic: {
    id: 'photo-beach',
    src: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1800&q=85',
    alt: 'Ảnh tư liệu 05',
    aspectRatio: 'panoramic'
  },
  bonfire: {
    id: 'photo-bonfire',
    src: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=85',
    alt: 'Ảnh tư liệu 06',
    aspectRatio: 'square'
  },
  stage: {
    id: 'photo-stage',
    src: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1400&q=85',
    alt: 'Ảnh tư liệu 07',
    aspectRatio: 'landscape'
  },
  celebrationToast: {
    id: 'photo-toast',
    src: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=85',
    alt: 'Ảnh tư liệu 08',
    aspectRatio: 'landscape'
  },
  gatheringCrowd: {
    id: 'photo-crowd',
    src: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1600&q=85',
    alt: 'Ảnh tư liệu 09',
    aspectRatio: 'landscape'
  }
};

// Danh sách tuần tự cho Lightbox
export const ALL_PHOTOBOOK_IMAGES = Object.values(PHOTOBOOK_IMAGES);

// Thông tin sự kiện Gala 17Y tập trung (Dữ liệu xác thực)
export const GALA_EVENT_DETAILS = {
  title: 'ĐẠI TIỆC GALA 17Y',
  subtitle: 'Cóc Sài Gòn — Mười Bảy Năm Một Mái Nhà',
  time: '2 ngày • 12 & 13.12.2026',
  dateIso: '2026-12-12T08:00:00+07:00',
  venue: 'Đồi Sứ Villa',
  address: 'Đồi Sứ Villa',
  dressCode: '',
  rsvpDeadline: '10.12.2026'
};
