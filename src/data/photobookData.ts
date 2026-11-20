/**
 * CÓC SÀI GÒN 17Y - ARCHIVAL PHOTO DATA
 * 
 * Lưu trữ tập trung tư liệu hình ảnh của Cóc Sài Gòn 17 năm.
 * Khi có bộ ảnh sự kiện thực tế, chỉ cần thay đổi đường dẫn `src`
 * trong file này mà KHÔNG cần phải sửa đổi bất kỳ mã nguồn layout nào.
 * 
 * Tuyệt đối không thêm mô tả bịa đặt, quote giả hay câu chuyện hư cấu.
 */

export interface PhotobookImage {
  id: string;
  src: string;
  alt: string;
  aspectRatio?: 'panoramic' | 'landscape' | 'portrait' | 'square';
  archiveCode: string;
}

export const PHOTOBOOK_IMAGES: Record<string, PhotobookImage> = {
  cover: {
    id: 'photo-cover',
    src: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1800&q=85',
    alt: 'Ảnh tư liệu Cóc Sài Gòn 01',
    aspectRatio: 'landscape',
    archiveCode: 'CSG-ARC-01'
  },
  coverOffset: {
    id: 'photo-cover-offset',
    src: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=85',
    alt: 'Ảnh tư liệu Cóc Sài Gòn 02',
    aspectRatio: 'portrait',
    archiveCode: 'CSG-ARC-02'
  },
  camera: {
    id: 'photo-camera',
    src: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=85',
    alt: 'Ảnh tư liệu Cóc Sài Gòn 03',
    aspectRatio: 'portrait',
    archiveCode: 'CSG-ARC-03'
  },
  workspace: {
    id: 'photo-workspace',
    src: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=85',
    alt: 'Ảnh tư liệu Cóc Sài Gòn 04',
    aspectRatio: 'landscape',
    archiveCode: 'CSG-ARC-04'
  },
  beachPanoramic: {
    id: 'photo-beach',
    src: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1800&q=85',
    alt: 'Ảnh tư liệu Cóc Sài Gòn 05',
    aspectRatio: 'panoramic',
    archiveCode: 'CSG-ARC-05'
  },
  bonfire: {
    id: 'photo-bonfire',
    src: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=85',
    alt: 'Ảnh tư liệu Cóc Sài Gòn 06',
    aspectRatio: 'square',
    archiveCode: 'CSG-ARC-06'
  },
  stage: {
    id: 'photo-stage',
    src: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1400&q=85',
    alt: 'Ảnh tư liệu Cóc Sài Gòn 07',
    aspectRatio: 'landscape',
    archiveCode: 'CSG-ARC-07'
  },
  celebrationToast: {
    id: 'photo-toast',
    src: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=85',
    alt: 'Ảnh tư liệu Cóc Sài Gòn 08',
    aspectRatio: 'landscape',
    archiveCode: 'CSG-ARC-08'
  },
  gatheringCrowd: {
    id: 'photo-crowd',
    src: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1600&q=85',
    alt: 'Ảnh tư liệu Cóc Sài Gòn 09',
    aspectRatio: 'landscape',
    archiveCode: 'CSG-ARC-09'
  }
};

// Danh sách tuần tự cho Lightbox
export const ALL_PHOTOBOOK_IMAGES = Object.values(PHOTOBOOK_IMAGES);

// Thông tin sự kiện Gala 17Y tập trung (Dữ liệu xác thực)
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
