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
    src: '/images/csg/IMG_9688.JPG',
    alt: 'Đại hội Song Hành 2023 — Rực rỡ sắc vàng và hoa hướng dương',
    aspectRatio: 'landscape'
  },
  coverOffset: {
    id: 'photo-cover-offset',
    src: '/images/csg/IMG_9689.JPG',
    alt: 'Những đóa hướng dương và nụ cười rạng rỡ ngày Song Hành',
    aspectRatio: 'portrait'
  },
  camera: {
    id: 'photo-camera',
    src: '/images/csg/IMG_9692.JPG',
    alt: 'Năm mùa sinh nhật đáng nhớ — Từ 7th đến 11th Birthday của Cóc Sài Gòn',
    aspectRatio: 'portrait'
  },
  workspace: {
    id: 'photo-workspace',
    src: '/images/csg/IMG_9682.JPG',
    alt: 'Những đêm họp SaiGon Talk — Kết nối các thế hệ Cóc Sài Gòn trong mùa cách ly',
    aspectRatio: 'landscape'
  },
  beachPanoramic: {
    id: 'photo-beach',
    src: '/images/csg/IMG_9696.JPG',
    alt: 'Lá cờ Cóc Sài Gòn tung bay giữa nắng gió Tháp Chàm Po Klong Garai',
    aspectRatio: 'panoramic'
  },
  bonfire: {
    id: 'photo-bonfire',
    src: '/images/csg/IMG_9697.JPG',
    alt: 'Sắc áo vàng Cóc Sài Gòn tại Quảng trường Lâm Viên — Đà Lạt sương mù',
    aspectRatio: 'square'
  },
  stage: {
    id: 'photo-stage',
    src: '/images/csg/IMG_9686.PNG',
    alt: 'Đêm Đại hội Vọng Tiến — Bùng cháy nhiệt huyết tuổi trẻ Cóc Sài Gòn',
    aspectRatio: 'landscape'
  },
  celebrationToast: {
    id: 'photo-toast',
    src: '/images/csg/IMG_9699.JPG',
    alt: 'Nụ cười thanh xuân đón gió biển bên bờ kè đá xanh',
    aspectRatio: 'landscape'
  },
  gatheringCrowd: {
    id: 'photo-crowd',
    src: '/images/csg/IMG_9698.JPG',
    alt: 'Đại gia đình Cóc Sài Gòn tề tựu giữa rừng thông — 17 năm trọn một hành trình',
    aspectRatio: 'landscape'
  }
};

// Danh sách tuần tự cho Lightbox
export const ALL_PHOTOBOOK_IMAGES = Object.values(PHOTOBOOK_IMAGES);

// Thông tin sự kiện Gala 17Y tập trung (Dữ liệu xác thực)
export const GALA_EVENT_DETAILS = {
  title: 'ĐẠI TIỆC GALA 17Y',
  subtitle: 'Cóc Sài Gòn — 17 năm — 1 hành trình',
  time: '12.12.2026',
  dateIso: '2026-12-12T08:00:00+07:00',
  venue: 'Đồi Sứ Villa',
  address: 'Đồi Sứ Villa',
  dressCode: '',
  rsvpDeadline: '10.12.2026'
};
