import React, { useState, useEffect, useCallback } from 'react';
import { ZoomInIcon, CloseIcon, ChevronLeftIcon, ChevronRightIcon } from 'naive-icons';

export interface ExhibitionPhoto {
  id: string;
  plate: string;
  year: string;
  title: string;
  era: string;
  url: string;
  aspect: 'pano' | 'landscape' | 'portrait' | 'square';
}

const EXHIBITION_PHOTOS: ExhibitionPhoto[] = [
  {
    id: 'p-01',
    plate: 'PLATE 01',
    year: '2023',
    title: 'Đại Hội Cóc Sài Gòn • Song Hành',
    era: 'GALA ĐẠI HỘI',
    url: '/images/csg/IMG_9688.JPG',
    aspect: 'landscape'
  },
  {
    id: 'p-02',
    plate: 'PLATE 02',
    year: '2024',
    title: 'Khởi Hành Tác Nghiệp • Chuyến Xe Tuổi Trẻ',
    era: 'HÀNH TRÌNH TÁC NGHIỆP',
    url: '/images/csg/IMG_9695.JPG',
    aspect: 'landscape'
  },
  {
    id: 'p-03',
    plate: 'PLATE 03',
    year: '2022',
    title: 'Đại Hội Cóc Sài Gòn • Vọng Tiến',
    era: 'GALA ĐẠI HỘI',
    url: '/images/csg/IMG_9686.PNG',
    aspect: 'landscape'
  },
  {
    id: 'p-04',
    plate: 'PLATE 04',
    year: '2023',
    title: 'Dấu Chân Tháp Chàm • Po Klong Garai',
    era: 'HÀNH TRÌNH DI SẢN',
    url: '/images/csg/IMG_9696.JPG',
    aspect: 'pano'
  },
  {
    id: 'p-05',
    plate: 'PLATE 05',
    year: '2024',
    title: 'Quảng Trường Lâm Viên • Sắc Cờ Cóc Vàng',
    era: 'ĐÀ LẠT TRIP',
    url: '/images/csg/IMG_9697.JPG',
    aspect: 'landscape'
  },
  {
    id: 'p-06',
    plate: 'PLATE 06',
    year: '2024',
    title: 'Sân Khấu Tổng Kết Kỳ • Phá Kén',
    era: 'SPRING - SUMMER 2024',
    url: '/images/csg/IMG_9690.JPG',
    aspect: 'landscape'
  },
  {
    id: 'p-07',
    plate: 'PLATE 07',
    year: '2021',
    title: 'SaiGon Talk • Kết Nối Trực Tuyến Vượt Mùa Dịch',
    era: 'TALKSHOW & WORKSHOP',
    url: '/images/csg/IMG_9682.JPG',
    aspect: 'pano'
  },
  {
    id: 'p-08',
    plate: 'PLATE 08',
    year: '2024',
    title: 'Cóc Sài Gòn Đón Gió Biển • Nắng Vàng Tuổi Trẻ',
    era: 'HÀNH TRÌNH BIỂN',
    url: '/images/csg/IMG_9699.JPG',
    aspect: 'landscape'
  }
];

export const ExhibitionArchive: React.FC = () => {
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);

  const handlePrev = useCallback(() => {
    if (activePhotoIndex === null) return;
    setActivePhotoIndex((activePhotoIndex - 1 + EXHIBITION_PHOTOS.length) % EXHIBITION_PHOTOS.length);
  }, [activePhotoIndex]);

  const handleNext = useCallback(() => {
    if (activePhotoIndex === null) return;
    setActivePhotoIndex((activePhotoIndex + 1) % EXHIBITION_PHOTOS.length);
  }, [activePhotoIndex]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (activePhotoIndex === null) return;
      if (e.key === 'Escape') setActivePhotoIndex(null);
      else if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activePhotoIndex, handlePrev, handleNext]);

  const selectedPhoto = activePhotoIndex !== null ? EXHIBITION_PHOTOS[activePhotoIndex] : null;

  return (
    <section id="archive" className="py-20 sm:py-32 px-4 sm:px-8 max-w-[1400px] mx-auto">
      {/* Exhibition Header: Ultra Minimal */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b-2 border-csg-black pb-4 mb-16 sm:mb-24 gap-2">
        <div className="flex items-baseline gap-4">
          <span className="font-mono text-xs sm:text-sm font-bold text-csg-red tracking-widest uppercase">
            02 // ARCHIVE
          </span>
          <h2 className="text-2xl sm:text-4xl font-display font-extrabold uppercase tracking-tight text-csg-black">
            Kỷ Yếu Hình Ảnh 17 Năm
          </h2>
        </div>
        <span className="font-mono text-xs text-csg-black/60 tracking-wider">
          8 THƯỚC PHIM TƯ LIỆU • 2009 — 2026
        </span>
      </div>

      {/* ================= EXHIBITION COMPOSITION ================= */}
      <div className="space-y-24 sm:space-y-36">
        
        {/* MOVEMENT 1: The Monumental Opening Spread (Full-width hero photo) */}
        <div className="space-y-3">
          <div 
            onClick={() => setActivePhotoIndex(0)}
            className="group relative bg-csg-muted overflow-hidden border border-csg-black cursor-pointer"
          >
            <img
              src={EXHIBITION_PHOTOS[0].url}
              alt={EXHIBITION_PHOTOS[0].title}
              className="w-full aspect-[21/9] sm:aspect-[16/7] object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              loading="lazy"
            />
            <div className="absolute bottom-4 right-4 bg-csg-paper/90 border border-csg-black px-3 py-1 font-mono text-xs font-bold text-csg-black flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <ZoomInIcon size={14} className="text-csg-red" />
              <span>XEM LỚN</span>
            </div>
          </div>
          <div className="flex items-baseline justify-between font-mono text-xs text-csg-black/70 pt-1">
            <span className="font-bold text-csg-black">{EXHIBITION_PHOTOS[0].plate} // {EXHIBITION_PHOTOS[0].era}</span>
            <span>{EXHIBITION_PHOTOS[0].title} • {EXHIBITION_PHOTOS[0].year}</span>
          </div>
        </div>

        {/* MOVEMENT 2: Asymmetric Staggered Diptych (Portrait + Landscape with White Space) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-16 items-center">
          {/* Left: Tall Vertical Frame (Takes 5 cols) */}
          <div 
            onClick={() => setActivePhotoIndex(1)}
            className="md:col-span-5 group cursor-pointer space-y-2"
          >
            <div className="relative bg-csg-muted overflow-hidden border border-csg-black">
              <img
                src={EXHIBITION_PHOTOS[1].url}
                alt={EXHIBITION_PHOTOS[1].title}
                className="w-full aspect-[3/4] object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                loading="lazy"
              />
              <div className="absolute bottom-3 right-3 bg-csg-paper/90 border border-csg-black px-2 py-0.5 font-mono text-[11px] font-bold text-csg-black opacity-0 group-hover:opacity-100 transition-opacity">
                PHÓNG TO
              </div>
            </div>
            <div className="flex items-baseline justify-between font-mono text-xs text-csg-black/70">
              <span className="font-bold text-csg-black">{EXHIBITION_PHOTOS[1].plate}</span>
              <span>{EXHIBITION_PHOTOS[1].title}</span>
            </div>
          </div>

          {/* Right: Landscape Frame + Editorial Callout (Takes 7 cols, offset) */}
          <div className="md:col-span-7 space-y-8 md:pl-6">
            <p className="font-editorial italic text-2xl sm:text-3xl text-csg-black/85 leading-snug max-w-md">
              "Những ngày đầu lăn xả sân trường, máy ảnh mượn và ngòi bút tuổi đôi mươi."
            </p>

            <div 
              onClick={() => setActivePhotoIndex(2)}
              className="group cursor-pointer space-y-2"
            >
              <div className="relative bg-csg-muted overflow-hidden border border-csg-black">
                <img
                  src={EXHIBITION_PHOTOS[2].url}
                  alt={EXHIBITION_PHOTOS[2].title}
                  className="w-full aspect-[16/10] object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                  loading="lazy"
                />
                <div className="absolute bottom-3 right-3 bg-csg-paper/90 border border-csg-black px-2 py-0.5 font-mono text-[11px] font-bold text-csg-black opacity-0 group-hover:opacity-100 transition-opacity">
                  PHÓNG TO
                </div>
              </div>
              <div className="flex items-baseline justify-between font-mono text-xs text-csg-black/70">
                <span className="font-bold text-csg-black">{EXHIBITION_PHOTOS[2].plate}</span>
                <span>{EXHIBITION_PHOTOS[2].title} • {EXHIBITION_PHOTOS[2].year}</span>
              </div>
            </div>
          </div>
        </div>

        {/* MOVEMENT 3: Panoramic Beach & Bonfire Trio */}
        <div className="space-y-8">
          <div 
            onClick={() => setActivePhotoIndex(3)}
            className="group relative bg-csg-muted overflow-hidden border border-csg-black cursor-pointer space-y-2"
          >
            <div className="relative overflow-hidden">
              <img
                src={EXHIBITION_PHOTOS[3].url}
                alt={EXHIBITION_PHOTOS[3].title}
                className="w-full aspect-[21/9] sm:aspect-[16/7] object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                loading="lazy"
              />
              <div className="absolute bottom-4 right-4 bg-csg-paper/90 border border-csg-black px-3 py-1 font-mono text-xs font-bold text-csg-black opacity-0 group-hover:opacity-100 transition-opacity">
                XEM LỚN
              </div>
            </div>
          </div>
          <div className="flex items-baseline justify-between font-mono text-xs text-csg-black/70">
            <span className="font-bold text-csg-black">{EXHIBITION_PHOTOS[3].plate} // {EXHIBITION_PHOTOS[3].era}</span>
            <span>{EXHIBITION_PHOTOS[3].title} • {EXHIBITION_PHOTOS[3].year}</span>
          </div>

          {/* Sub-pair: Square Bonfire + Landscape Stage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
            <div 
              onClick={() => setActivePhotoIndex(4)}
              className="group cursor-pointer space-y-2"
            >
              <div className="relative bg-csg-muted overflow-hidden border border-csg-black">
                <img
                  src={EXHIBITION_PHOTOS[4].url}
                  alt={EXHIBITION_PHOTOS[4].title}
                  className="w-full aspect-square object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                  loading="lazy"
                />
              </div>
              <div className="flex items-baseline justify-between font-mono text-xs text-csg-black/70">
                <span className="font-bold text-csg-black">{EXHIBITION_PHOTOS[4].plate}</span>
                <span>{EXHIBITION_PHOTOS[4].title}</span>
              </div>
            </div>

            <div 
              onClick={() => setActivePhotoIndex(5)}
              className="group cursor-pointer space-y-2"
            >
              <div className="relative bg-csg-muted overflow-hidden border border-csg-black">
                <img
                  src={EXHIBITION_PHOTOS[5].url}
                  alt={EXHIBITION_PHOTOS[5].title}
                  className="w-full aspect-square sm:aspect-auto sm:h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                  loading="lazy"
                />
              </div>
              <div className="flex items-baseline justify-between font-mono text-xs text-csg-black/70">
                <span className="font-bold text-csg-black">{EXHIBITION_PHOTOS[5].plate}</span>
                <span>{EXHIBITION_PHOTOS[5].title}</span>
              </div>
            </div>
          </div>
        </div>

        {/* MOVEMENT 4: Editorial Desk & Grand Finale Crowd */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-end">
          <div 
            onClick={() => setActivePhotoIndex(6)}
            className="md:col-span-5 group cursor-pointer space-y-2"
          >
            <div className="relative bg-csg-muted overflow-hidden border border-csg-black">
              <img
                src={EXHIBITION_PHOTOS[6].url}
                alt={EXHIBITION_PHOTOS[6].title}
                className="w-full aspect-[4/3] object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                loading="lazy"
              />
            </div>
            <div className="flex items-baseline justify-between font-mono text-xs text-csg-black/70">
              <span className="font-bold text-csg-black">{EXHIBITION_PHOTOS[6].plate}</span>
              <span>{EXHIBITION_PHOTOS[6].title}</span>
            </div>
          </div>

          <div 
            onClick={() => setActivePhotoIndex(7)}
            className="md:col-span-7 group cursor-pointer space-y-2"
          >
            <div className="relative bg-csg-muted overflow-hidden border border-csg-black">
              <img
                src={EXHIBITION_PHOTOS[7].url}
                alt={EXHIBITION_PHOTOS[7].title}
                className="w-full aspect-[16/10] object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                loading="lazy"
              />
            </div>
            <div className="flex items-baseline justify-between font-mono text-xs text-csg-black/70">
              <span className="font-bold text-csg-black">{EXHIBITION_PHOTOS[7].plate}</span>
              <span>{EXHIBITION_PHOTOS[7].title}</span>
            </div>
          </div>
        </div>

      </div>

      {/* ================= FULLSCREEN DARKROOM LIGHTBOX ================= */}
      {selectedPhoto && activePhotoIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={selectedPhoto.title}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-[#100F0D]/95 backdrop-blur-md animate-fadeIn"
          onClick={() => setActivePhotoIndex(null)}
        >
          {/* Close Button */}
          <button
            onClick={() => setActivePhotoIndex(null)}
            className="absolute top-6 right-6 z-30 p-2.5 bg-[#201E1A] hover:bg-csg-red text-[#F4EEDF] transition-colors border border-white/10"
            aria-label="Đóng xem chi tiết (Esc)"
          >
            <CloseIcon size={20} />
          </button>

          {/* Main Photo Stage */}
          <div
            className="relative max-w-6xl w-full max-h-[85vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.title}
              className="max-h-[75vh] w-auto max-w-full object-contain border border-white/10 shadow-2xl"
            />

            {/* Lightbox Caption Bar */}
            <div className="w-full max-w-2xl mt-4 px-4 flex items-center justify-between text-xs font-mono text-[#DCD5C4]">
              <div>
                <span className="font-bold text-csg-yellow">{selectedPhoto.plate}</span>
                <span className="mx-2">•</span>
                <span className="text-white font-sans font-bold">{selectedPhoto.title}</span>
                <span className="mx-2">•</span>
                <span>NĂM {selectedPhoto.year}</span>
              </div>

              {/* Prev / Next controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrev}
                  className="p-1 hover:text-csg-yellow transition-colors"
                  aria-label="Ảnh trước"
                >
                  <ChevronLeftIcon size={20} />
                </button>
                <span>{activePhotoIndex + 1} / {EXHIBITION_PHOTOS.length}</span>
                <button
                  onClick={handleNext}
                  className="p-1 hover:text-csg-yellow transition-colors"
                  aria-label="Ảnh sau"
                >
                  <ChevronRightIcon size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
