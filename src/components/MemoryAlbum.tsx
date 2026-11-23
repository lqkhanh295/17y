import React, { useState, useEffect, useCallback } from 'react';
import { CloseIcon, ChevronLeftIcon, ChevronRightIcon, ZoomInIcon } from 'naive-icons';

interface MemoryPhoto {
  id: string;
  url: string;
  alt: string;
  caption?: string;
  handwrittenNote?: string;
  tape?: boolean;
}

export const ALBUM_PHOTOS: MemoryPhoto[] = [
  // 1. Gala Banquet - The main gathering
  {
    id: 'alb-1',
    url: '/images/csg/IMG_9688.JPG',
    alt: 'Đại hội Cóc Sài Gòn 2023 — Song Hành',
    caption: 'Đại hội Cóc Sài Gòn 2023 — Song Hành',
    handwrittenNote: 'Đêm hoàng kim hội ngộ — Mười bảy năm một mái nhà',
    tape: true
  },
  // 2. Departure road trip
  {
    id: 'alb-2',
    url: '/images/csg/IMG_9695.JPG',
    alt: 'Xuất phát hành trình cùng màu áo vàng',
    caption: 'Xuất phát hành trình cùng màu áo vàng',
    handwrittenNote: 'Chuyến xe tuổi trẻ khởi hành',
    tape: true
  },
  // 3. Online workshop & talk
  {
    id: 'alb-3',
    url: '/images/csg/IMG_9682.JPG',
    alt: 'SaiGon Talk — Kết nối trực tuyến vượt mùa dịch',
    caption: 'SaiGon Talk — Kết nối trực tuyến vượt mùa dịch',
    handwrittenNote: 'Những buổi gặp gỡ không khoảng cách',
    tape: false
  },
  // 4. Yellow shirts by the sea
  {
    id: 'alb-4',
    url: '/images/csg/IMG_9699.JPG',
    alt: 'Cóc Sài Gòn đón gió biển bên bờ kè đá',
    caption: 'Cóc Sài Gòn đón gió biển bên bờ kè đá',
    handwrittenNote: 'Sóng biển, nắng vàng và thanh xuân',
    tape: true
  },
  // 5. Da Lat Lam Vien Square
  {
    id: 'alb-5',
    url: '/images/csg/IMG_9697.JPG',
    alt: 'Quảng trường Lâm Viên cùng cờ Cóc Vàng',
    caption: 'Quảng trường Lâm Viên cùng cờ Cóc Vàng',
    handwrittenNote: 'Đà Lạt sương mù nhưng lòng luôn ấm áp',
    tape: false
  },
  // 6. Live stage
  {
    id: 'alb-6',
    url: '/images/csg/IMG_9690.JPG',
    alt: 'Sân khấu Tổng kết kỳ — Phá Kén',
    caption: 'Sân khấu Tổng kết kỳ — Phá Kén',
    handwrittenNote: 'Cháy hết mình dưới ánh đèn sân khấu Cóc',
    tape: true
  },
  // 7. Vong Tien 2022
  {
    id: 'alb-7',
    url: '/images/csg/IMG_9686.PNG',
    alt: 'Đại hội Cóc Sài Gòn 2022 — Vọng Tiến',
    caption: 'Đại hội Cóc Sài Gòn 2022 — Vọng Tiến',
    handwrittenNote: 'Tự hào ghi nhận cống hiến các thế hệ',
    tape: false
  },
  // 8. Grand Pine Forest Gathering
  {
    id: 'alb-8',
    url: '/images/csg/IMG_9693.JPG',
    alt: 'Đại gia đình Cóc Sài Gòn giữa rừng thông Đà Lạt',
    caption: 'Đại gia đình Cóc Sài Gòn giữa rừng thông Đà Lạt',
    handwrittenNote: 'Nơi những người xa lạ thành anh em một nhà',
    tape: true
  }
];

export const MemoryAlbum: React.FC = () => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handlePrev = useCallback(() => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex - 1 + ALBUM_PHOTOS.length) % ALBUM_PHOTOS.length);
  }, [selectedIndex]);

  const handleNext = useCallback(() => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex + 1) % ALBUM_PHOTOS.length);
  }, [selectedIndex]);

  // Lock background scroll when lightbox is open
  useEffect(() => {
    if (selectedIndex !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedIndex]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === 'Escape') setSelectedIndex(null);
      else if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedIndex, handlePrev, handleNext]);

  return (
    <div id="memories" className="space-y-24 sm:space-y-36">
      
      {/* ================= PAGE SPREAD 01: SÂN TRƯỜNG & NHỮNG NGÀY ĐẦU ================= */}
      <div className="relative">
        <div className="flex items-center gap-3 border-b border-csg-black/15 pb-2 mb-8 sm:mb-12">
          <span className="font-mono text-xs uppercase tracking-widest text-csg-black/60 font-semibold">
            TRANG 01 — NHỮNG BƯỚC CHÂN ĐẦU TIÊN
          </span>
          <span className="text-csg-black/30">•</span>
          <span className="font-handwriting text-xl text-csg-red">
            "Máy ảnh mượn và ngòi bút tuổi đôi mươi"
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-14 items-center">
          {/* Vertical Print with Tape */}
          <div 
            onClick={() => setSelectedIndex(1)}
            className="md:col-span-5 group cursor-pointer bg-white p-2.5 sm:p-3.5 pb-7 sm:pb-9 shadow-paper-lg border border-csg-black/25 -rotate-1 hover:rotate-0 transition-transform duration-500 hover:-translate-y-1 relative"
          >
            {/* Washi Tape Strip */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-20 h-6 bg-[#E5DEC9]/85 border border-csg-black/10 backdrop-blur-[1px] rotate-1 shadow-sm pointer-events-none" />
            
            <div className="overflow-hidden bg-csg-muted">
              <img
                src={ALBUM_PHOTOS[1].url}
                alt={ALBUM_PHOTOS[1].alt}
                className="w-full aspect-[3/4] object-cover transition-transform duration-700 group-hover:scale-[1.01]"
                loading="lazy"
              />
            </div>
            <p className="font-handwriting text-xl sm:text-2xl text-csg-black/80 pt-3 text-center">
              {ALBUM_PHOTOS[1].handwrittenNote}
            </p>
          </div>

          {/* Right Editorial Note & Desk Photo */}
          <div className="md:col-span-7 space-y-6 md:pl-4">
            <p className="font-editorial italic text-2xl sm:text-3xl text-csg-black/80 leading-snug">
              "Có những buổi chiều tan học không ai về, cả bọn túm tụm quanh chiếc laptop dựng tin bài cho kịp giờ lên sóng."
            </p>

            <div 
              onClick={() => setSelectedIndex(2)}
              className="group cursor-pointer bg-white p-2.5 sm:p-3.5 pb-6 sm:pb-8 shadow-paper-lg border border-csg-black/25 rotate-1 hover:rotate-0 transition-transform duration-500 hover:-translate-y-1"
            >
              <div className="overflow-hidden bg-csg-muted">
                <img
                  src={ALBUM_PHOTOS[2].url}
                  alt={ALBUM_PHOTOS[2].alt}
                  className="w-full aspect-[16/10] object-cover transition-transform duration-700 group-hover:scale-[1.01]"
                  loading="lazy"
                />
              </div>
              <p className="font-handwriting text-lg sm:text-xl text-csg-black/75 pt-2 text-right pr-2">
                {ALBUM_PHOTOS[2].handwrittenNote}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ================= PAGE SPREAD 02: BỜ BIỂN & SẮC ÁO VÀNG ================= */}
      <div className="relative">
        <div className="flex items-center justify-between border-b border-csg-black/15 pb-2 mb-8 sm:mb-12">
          <span className="font-mono text-xs uppercase tracking-widest text-csg-black/60 font-semibold">
            TRANG 02 — SẮC ÁO VÀNG QUA NHỮNG MIỀN ĐẤT
          </span>
          <span className="px-2.5 py-0.5 bg-csg-yellow text-csg-black border border-csg-black font-mono text-[11px] font-bold uppercase -rotate-1">
            ★ TEAMBUILDING
          </span>
        </div>

        {/* Panoramic Print Laid Out Across The Page */}
        <div 
          onClick={() => setSelectedIndex(3)}
          className="group cursor-pointer bg-white p-3 sm:p-4 pb-7 sm:pb-10 shadow-paper-lg border border-csg-black/25 transition-transform duration-500 hover:-translate-y-1 relative"
        >
          {/* Subtle corner tape */}
          <div className="absolute -top-3 left-8 w-16 h-5 bg-[#E5DEC9]/80 border border-csg-black/10 -rotate-3 pointer-events-none" />
          <div className="absolute -top-3 right-8 w-16 h-5 bg-[#E5DEC9]/80 border border-csg-black/10 rotate-2 pointer-events-none" />

          <div className="relative overflow-hidden bg-csg-muted">
            <img
              src={ALBUM_PHOTOS[3].url}
              alt={ALBUM_PHOTOS[3].alt}
              className="w-full aspect-[16/8] sm:aspect-[21/8] object-cover transition-transform duration-700 group-hover:scale-[1.01]"
              loading="lazy"
            />
            <div className="absolute bottom-3 right-3 bg-csg-paper/90 border border-csg-black px-2.5 py-1 font-mono text-[11px] font-bold text-csg-black opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shadow-sm">
              <ZoomInIcon size={14} className="text-csg-red" />
              <span>XEM RÕ HƠN</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between pt-3 px-1 gap-1">
            <p className="font-editorial italic text-base text-csg-black/80">
              "Những chuyến xe nối dài tình anh em..."
            </p>
            <p className="font-handwriting text-xl text-csg-red">
              {ALBUM_PHOTOS[3].handwrittenNote}
            </p>
          </div>
        </div>
      </div>

      {/* ================= PAGE SPREAD 03: LỬA TRẠI & SÂN KHẤU ================= */}
      <div className="relative">
        <div className="flex items-center gap-3 border-b border-csg-black/15 pb-2 mb-8 sm:mb-12">
          <span className="font-mono text-xs uppercase tracking-widest text-csg-black/60 font-semibold">
            TRANG 03 — NHỮNG ĐÊM CHÁY HẾT MÌNH
          </span>
          <span className="text-csg-black/30">•</span>
          <span className="font-handwriting text-xl text-csg-black/75">
            "Âm nhạc, ánh lửa và những bài ca"
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-14 items-start">
          {/* Campfire Square Print */}
          <div 
            onClick={() => setSelectedIndex(4)}
            className="group cursor-pointer bg-white p-3 sm:p-4 pb-7 sm:pb-9 shadow-paper-lg border border-csg-black/25 -rotate-1 hover:rotate-0 transition-transform duration-500 hover:-translate-y-1 relative"
          >
            <div className="overflow-hidden bg-csg-muted">
              <img
                src={ALBUM_PHOTOS[4].url}
                alt={ALBUM_PHOTOS[4].alt}
                className="w-full aspect-square object-cover transition-transform duration-700 group-hover:scale-[1.01]"
                loading="lazy"
              />
            </div>
            <p className="font-handwriting text-xl sm:text-2xl text-csg-black/80 pt-3 text-center">
              {ALBUM_PHOTOS[4].handwrittenNote}
            </p>
          </div>

          {/* Stage Lights Print */}
          <div 
            onClick={() => setSelectedIndex(5)}
            className="group cursor-pointer bg-white p-3 sm:p-4 pb-7 sm:pb-9 shadow-paper-lg border border-csg-black/25 rotate-1 hover:rotate-0 transition-transform duration-500 hover:-translate-y-1 sm:mt-12 relative"
          >
            {/* Washi Tape */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-20 h-6 bg-[#E5DEC9]/85 border border-csg-black/10 backdrop-blur-[1px] -rotate-1 shadow-sm pointer-events-none" />

            <div className="overflow-hidden bg-csg-muted">
              <img
                src={ALBUM_PHOTOS[5].url}
                alt={ALBUM_PHOTOS[5].alt}
                className="w-full aspect-[4/3] sm:aspect-square object-cover transition-transform duration-700 group-hover:scale-[1.01]"
                loading="lazy"
              />
            </div>
            <p className="font-handwriting text-xl sm:text-2xl text-csg-black/80 pt-3 text-center">
              {ALBUM_PHOTOS[5].handwrittenNote}
            </p>
          </div>
        </div>
      </div>

      {/* ================= PAGE SPREAD 04: CẢM ƠN VÀ HỘI NGỘ ================= */}
      <div className="relative">
        <div className="flex items-center justify-between border-b border-csg-black/15 pb-2 mb-8 sm:mb-12">
          <span className="font-mono text-xs uppercase tracking-widest text-csg-black/60 font-semibold">
            TRANG 04 — 17 NĂM MỘT MÁI NHÀ
          </span>
          <span className="font-editorial italic text-sm text-csg-black/60 hidden sm:inline">
            "Những người xa lạ hoá người nhà"
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-14 items-center">
          {/* Cake & Toast */}
          <div 
            onClick={() => setSelectedIndex(6)}
            className="md:col-span-5 group cursor-pointer bg-white p-3 sm:p-4 pb-7 sm:pb-9 shadow-paper-lg border border-csg-black/25 -rotate-1 hover:rotate-0 transition-transform duration-500 hover:-translate-y-1"
          >
            <div className="overflow-hidden bg-csg-muted">
              <img
                src={ALBUM_PHOTOS[6].url}
                alt={ALBUM_PHOTOS[6].alt}
                className="w-full aspect-[4/3] object-cover transition-transform duration-700 group-hover:scale-[1.01]"
                loading="lazy"
              />
            </div>
            <p className="font-handwriting text-xl text-csg-black/80 pt-2 text-center">
              {ALBUM_PHOTOS[6].handwrittenNote}
            </p>
          </div>

          {/* Big Group Hug */}
          <div 
            onClick={() => setSelectedIndex(7)}
            className="md:col-span-7 group cursor-pointer bg-white p-3 sm:p-4 pb-7 sm:pb-9 shadow-paper-lg border border-csg-black/25 rotate-1 hover:rotate-0 transition-transform duration-500 hover:-translate-y-1 relative"
          >
            <div className="overflow-hidden bg-csg-muted">
              <img
                src={ALBUM_PHOTOS[7].url}
                alt={ALBUM_PHOTOS[7].alt}
                className="w-full aspect-[16/10] object-cover transition-transform duration-700 group-hover:scale-[1.01]"
                loading="lazy"
              />
            </div>
            <p className="font-handwriting text-2xl text-csg-red pt-3 text-center">
              {ALBUM_PHOTOS[7].handwrittenNote}
            </p>
          </div>
        </div>
      </div>

      {/* ================= IMMERSIVE DARKROOM LIGHTBOX ================= */}
      {selectedIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-[#11100E]/95 backdrop-blur-md animate-fadeIn"
          onClick={() => setSelectedIndex(null)}
        >
          {/* Close Button */}
          <button
            onClick={() => setSelectedIndex(null)}
            className="absolute top-6 right-6 z-30 p-2.5 bg-[#201E1A] hover:bg-csg-red text-[#F4EEDF] transition-colors border border-white/10"
            aria-label="Đóng xem chi tiết (Esc)"
          >
            <CloseIcon size={20} />
          </button>

          {/* Photo Stage */}
          <div 
            className="relative max-w-5xl w-full max-h-[85vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={ALBUM_PHOTOS[selectedIndex].url}
              alt={ALBUM_PHOTOS[selectedIndex].alt}
              className="max-h-[75vh] w-auto max-w-full object-contain border border-white/10 shadow-2xl"
            />

            {/* Bottom Controls */}
            <div className="w-full max-w-md mt-4 flex items-center justify-between text-xs font-mono text-[#DCD5C4]">
              <button
                onClick={handlePrev}
                className="p-1 hover:text-csg-yellow transition-colors flex items-center gap-1"
                aria-label="Ảnh trước"
              >
                <ChevronLeftIcon size={16} />
                <span>TRƯỚC</span>
              </button>

              <span className="text-[#DCD5C4]/70">
                {selectedIndex + 1} / {ALBUM_PHOTOS.length}
              </span>

              <button
                onClick={handleNext}
                className="p-1 hover:text-csg-yellow transition-colors flex items-center gap-1"
                aria-label="Ảnh sau"
              >
                <span>TIẾP</span>
                <ChevronRightIcon size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
