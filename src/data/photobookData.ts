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
  title?: string;
  sub?: string;
  description?: string;
  aspectRatio?: 'panoramic' | 'landscape' | 'portrait' | 'square';
}

export const PHOTOBOOK_IMAGES: Record<string, PhotobookImage> = {
  cover: {
    id: 'photo-cover',
    src: '/images/csg/IMG_9688.JPG',
    alt: '01. ĐẠI HỘI SONG HÀNH 2023',
    title: '01. ĐẠI HỘI SONG HÀNH 2023',
    sub: 'Tháng 10.2023',
    description: 'Đằng sau mỗi thành quả là những con người đã dành một phần tuổi trẻ để xây dựng Cóc Sài Gòn. Đại hội là dịp để những đóng góp ấy được trân trọng và ghi nhận.',
    aspectRatio: 'landscape'
  },
  coverOffset: {
    id: 'photo-cover-offset',
    src: '/images/csg/IMG_9689.JPG',
    alt: 'Hoa hướng dương ngày Song Hành',
    title: 'Nụ cười hướng dương',
    sub: 'Tháng 10.2023',
    description: 'Nụ cười rạng rỡ và sắc vàng hướng dương của ngày hội ngộ Song Hành.',
    aspectRatio: 'portrait'
  },
  camera: {
    id: 'photo-camera',
    src: '/images/csg/IMG_9692.JPG',
    alt: '04. NHỮNG MÙA SINH NHẬT CÓC SÀI GÒN (7TH - 11TH)',
    title: '04. NHỮNG MÙA SINH NHẬT CÓC SÀI GÒN (7TH - 11TH)',
    sub: '2016 - 2020',
    description: 'Mỗi mùa sinh nhật là một lần nhìn lại. Những gương mặt có thể đổi thay, nhưng tình cảm và tâm huyết dành cho Cóc Sài Gòn vẫn được các thế hệ gìn giữ.',
    aspectRatio: 'portrait'
  },
  workspace: {
    id: 'photo-workspace',
    src: '/images/csg/IMG_9682.JPG',
    alt: '02. SAIGON TALK - DẤU ẤN MÙA GIÃN CÁCH',
    title: '02. SAIGON TALK - DẤU ẤN MÙA GIÃN CÁCH',
    sub: 'Mùa giãn cách 2021',
    description: 'Giữa những biến động của đại dịch, các thế hệ thành viên vẫn nỗ lực duy trì hoạt động, để hành trình của Cóc Sài Gòn không dừng lại ngay cả trong những giai đoạn khó khăn nhất.',
    aspectRatio: 'landscape'
  },
  beachPanoramic: {
    id: 'photo-beach',
    src: '/images/csg/IMG_9696.JPG',
    alt: '03. CÓC SÀI GÒN - HÀNH TRÌNH ĐẾN PO KLONG GARAI',
    title: '03. CÓC SÀI GÒN - HÀNH TRÌNH ĐẾN PO KLONG GARAI',
    description: 'Những chuyến đi đưa chúng ta đến nhiều vùng đất mới. Và trong hành trình ấy, những người đồng đội cũng dần trở thành những người thân thuộc.',
    aspectRatio: 'panoramic'
  },
  bonfire: {
    id: 'photo-bonfire',
    src: '/images/csg/IMG_9697.JPG',
    alt: '05. DẤU CHÂN CÓC SÀI GÒN TẠI ĐÀ LẠT',
    title: '05. DẤU CHÂN CÓC SÀI GÒN TẠI ĐÀ LẠT',
    sub: 'Cao nguyên Lâm Viên',
    description: 'Có những tình bạn bắt đầu từ công việc, nhưng được vun đắp qua những chuyến đi và trở thành một phần đáng nhớ trong những năm tháng đại học.',
    aspectRatio: 'square'
  },
  stage: {
    id: 'photo-stage',
    src: '/images/csg/IMG_9686.PNG',
    alt: '06. ĐẠI HỘI VỌNG TIẾN 2022',
    title: '06. ĐẠI HỘI VỌNG TIẾN 2022',
    description: 'Những nỗ lực được ghi nhận, những thành quả được trân trọng. Mỗi kỳ Đại hội cũng là dịp để thế hệ hôm nay tiếp nhận niềm tin và trách nhiệm từ những người đi trước.',
    aspectRatio: 'landscape'
  },
  celebrationToast: {
    id: 'photo-toast',
    src: '/images/csg/IMG_9699.JPG',
    alt: '07. NHỮNG CHUYẾN ĐI CÙNG CÓC SÀI GÒN',
    title: '07. NHỮNG CHUYẾN ĐI CÙNG CÓC SÀI GÒN',
    description: 'Sau này, có lẽ điều chúng ta nhớ không chỉ là những dự án đã thực hiện, mà còn là những chuyến đi và những người đã từng ở bên cạnh mình.',
    aspectRatio: 'landscape'
  },
  gatheringCrowd: {
    id: 'photo-crowd',
    src: '/images/csg/IMG_9698.JPG',
    alt: '08. CÓC SÀI GÒN - 17 NĂM TIẾP NỐI',
    title: '08. CÓC SÀI GÒN - 17 NĂM TIẾP NỐI',
    description: '17 năm được vun đắp bởi nhiều thế hệ. Có người đến, có người trưởng thành và rời đi, nhưng những giá trị vẫn được tiếp nối. Đó là cách Cóc Sài Gòn trở thành một gia đình và hơn cả một câu lạc bộ.',
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
