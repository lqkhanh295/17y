import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

interface MemoryPhoto {
  id: string;
  url: string;
  alt: string;
  rotation?: string;
  aspect?: string;
}

const ALBUM_PHOTOS: MemoryPhoto[] = [
  // 1. Gala Banquet - The main gathering
  {
    id: 'alb-1',
    url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1800&q=85',
    alt: 'Bàn tiệc hội ngộ dưới ánh đèn vàng',
    rotation: 'rotate-0',
    aspect: 'aspect-[16/9]'
  },
  // 2. Early camera lens / F-Camp
  {
    id: 'alb-2',
    url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=85',
    alt: 'Ống kính máy ảnh tác nghiệp',
    rotation: '-rotate-1',
    aspect: 'aspect-[3/4]'
  },
  // 3. Birthday cake toast
  {
    id: 'alb-3',
    url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=85',
    alt: 'Thổi nến sinh nhật và nâng ly',
    rotation: 'rotate-1',
    aspect: 'aspect-[4/3]'
  },
  // 4. Yellow shirts by the beach
  {
    id: 'alb-4',
    url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1800&q=85',
    alt: 'Những chuyến đi sắc áo vàng bên bờ biển',
    rotation: 'rotate-0',
    aspect: 'aspect-[21/9]'
  },
  // 5. Bonfire night
  {
    id: 'alb-5',
    url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=85',
    alt: 'Đêm lửa trại và những câu chuyện',
    rotation: '-rotate-1.5',
    aspect: 'aspect-square'
  },
  // 6. Live stage
  {
    id: 'alb-6',
    url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1400&q=85',
    alt: 'Sân khấu âm nhạc và ánh sáng',
    rotation: 'rotate-1',
    aspect: 'aspect-[16/10]'
  },
  // 7. Creative studio table
  {
    id: 'alb-7',
    url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=85',
    alt: 'Bàn tròn ý tưởng và dựng bài',
    rotation: '-rotate-0.5',
    aspect: 'aspect-[4/3]'
  },
  // 8. Celebration crowd
  {
    id: 'alb-8',
    url: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1600&q=85',
    alt: 'Những nụ cười thanh xuân',
    rotation: 'rotate-0',
    aspect: 'aspect-[16/9]'
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
    <section id="memories" className="py-20 sm:py-36 px-4 sm:px-8 max-w-[1400px] mx-auto">
      
      {/* Scrapbook Section Divider */}
      <div className="border-b-2 border-csg-black/30 pb-4 mb-16 sm:mb-28 flex items-baseline justify-between">
        <span className="font-mono text-xs sm:text-sm font-bold tracking-[0.2em] uppercase text-csg-black/60">
          CUỐN KỶ YẾU // PHOTO ALBUM
        </span>
        <span className="font-editorial italic text-sm sm:text-base text-csg-black/70">
          "Có những nơi dù đã đi bao lâu, vẫn luôn có chỗ để trở về."
        </span>
      </div>

      {/* ================= THE ALBUM SPREADS ================= */}
      <div className="space-y-24 sm:space-y-44">
        
        {/* SPREAD 1: The Monumental Table - Full Spread Print */}
        <div className="relative">
          <div 
            onClick={() => setSelectedIndex(0)}
            className="group cursor-pointer bg-white p-2 sm:p-4 pb-6 sm:pb-8 shadow-poster-lg border border-csg-black/30 transition-transform duration-500 hover:-translate-y-1.5"
          >
            <div className="relative overflow-hidden bg-csg-muted">
              <img
                src={ALBUM_PHOTOS[0].url}
                alt={ALBUM_PHOTOS[0].alt}
                className="w-full aspect-[16/9] sm:aspect-[21/9] object-cover transition-transform duration-700 group-hover:scale-[1.01]"
                loading="lazy"
              />
              <div className="absolute bottom-3 right-3 bg-csg-paper/90 border border-csg-black px-2.5 py-1 font-mono text-[11px] font-bold text-csg-black opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shadow-sm">
                <ZoomIn className="w-3.5 h-3.5 text-csg-red" />
                <span>PHÓNG TO</span>
              </div>
            </div>
          </div>
        </div>

        {/* SPREAD 2: Asymmetric Hand-Placed Duo (Overlapping & Breathing Room) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-16 items-center">
          {/* Vertical Print (Slight tilt -1.5deg) */}
          <div 
            onClick={() => setSelectedIndex(1)}
            className="md:col-span-5 group cursor-pointer bg-white p-2 sm:p-3 pb-6 sm:pb-8 shadow-poster border border-csg-black/30 -rotate-1 hover:rotate-0 transition-transform duration-500 hover:-translate-y-1.5"
          >
            <div className="overflow-hidden bg-csg-muted">
              <img
                src={ALBUM_PHOTOS[1].url}
                alt={ALBUM_PHOTOS[1].alt}
                className="w-full aspect-[3/4] object-cover transition-transform duration-700 group-hover:scale-[1.01]"
                loading="lazy"
              />
            </div>
          </div>

          {/* Landscape Print Placed Off-Center with Editorial Air */}
          <div className="md:col-span-7 space-y-8 md:pl-6">
            <p className="font-editorial italic text-2xl sm:text-4xl text-csg-black/85 leading-snug max-w-md">
              "Những ngày đầu lăn xả sân trường, máy ảnh mượn và ngòi bút tuổi đôi mươi."
            </p>

            <div 
              onClick={() => setSelectedIndex(2)}
              className="group cursor-pointer bg-white p-2 sm:p-3 pb-6 sm:pb-8 shadow-poster border border-csg-black/30 rotate-1 hover:rotate-0 transition-transform duration-500 hover:-translate-y-1.5"
            >
              <div className="overflow-hidden bg-csg-muted">
                <img
                  src={ALBUM_PHOTOS[2].url}
                  alt={ALBUM_PHOTOS[2].alt}
                  className="w-full aspect-[16/10] object-cover transition-transform duration-700 group-hover:scale-[1.01]"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SPREAD 3: The Ocean Horizon & Sắc Áo Vàng (Wide Panoramic Print) */}
        <div className="relative">
          <div 
            onClick={() => setSelectedIndex(3)}
            className="group cursor-pointer bg-white p-2 sm:p-4 pb-6 sm:pb-8 shadow-poster-lg border border-csg-black/30 transition-transform duration-500 hover:-translate-y-1.5"
          >
            <div className="relative overflow-hidden bg-csg-muted">
              <img
                src={ALBUM_PHOTOS[3].url}
                alt={ALBUM_PHOTOS[3].alt}
                className="w-full aspect-[16/8] sm:aspect-[21/8] object-cover transition-transform duration-700 group-hover:scale-[1.01]"
                loading="lazy"
              />
              <div className="absolute bottom-3 right-3 bg-csg-paper/90 border border-csg-black px-2.5 py-1 font-mono text-[11px] font-bold text-csg-black opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shadow-sm">
                <ZoomIn className="w-3.5 h-3.5 text-csg-red" />
                <span>PHÓNG TO</span>
              </div>
            </div>
          </div>
        </div>

        {/* SPREAD 4: Organic Staggered Pair (Campfire & Stage Lights) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-16 items-start">
          <div 
            onClick={() => setSelectedIndex(4)}
            className="group cursor-pointer bg-white p-2 sm:p-3 pb-6 sm:pb-8 shadow-poster border border-csg-black/30 -rotate-1 hover:rotate-0 transition-transform duration-500 hover:-translate-y-1.5"
          >
            <div className="overflow-hidden bg-csg-muted">
              <img
                src={ALBUM_PHOTOS[4].url}
                alt={ALBUM_PHOTOS[4].alt}
                className="w-full aspect-square object-cover transition-transform duration-700 group-hover:scale-[1.01]"
                loading="lazy"
              />
            </div>
          </div>

          <div 
            onClick={() => setSelectedIndex(5)}
            className="group cursor-pointer bg-white p-2 sm:p-3 pb-6 sm:pb-8 shadow-poster border border-csg-black/30 rotate-1 hover:rotate-0 transition-transform duration-500 hover:-translate-y-1.5 sm:mt-16"
          >
            <div className="overflow-hidden bg-csg-muted">
              <img
                src={ALBUM_PHOTOS[5].url}
                alt={ALBUM_PHOTOS[5].alt}
                className="w-full aspect-[4/5] sm:aspect-square object-cover transition-transform duration-700 group-hover:scale-[1.01]"
                loading="lazy"
              />
            </div>
          </div>
        </div>

        {/* SPREAD 5: Studio Desk & Final Celebration Crowd */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-14 items-end">
          <div 
            onClick={() => setSelectedIndex(6)}
            className="md:col-span-5 group cursor-pointer bg-white p-2 sm:p-3 pb-6 sm:pb-8 shadow-poster border border-csg-black/30 -rotate-0.5 hover:rotate-0 transition-transform duration-500 hover:-translate-y-1.5"
          >
            <div className="overflow-hidden bg-csg-muted">
              <img
                src={ALBUM_PHOTOS[6].url}
                alt={ALBUM_PHOTOS[6].alt}
                className="w-full aspect-[4/3] object-cover transition-transform duration-700 group-hover:scale-[1.01]"
                loading="lazy"
              />
            </div>
          </div>

          <div 
            onClick={() => setSelectedIndex(7)}
            className="md:col-span-7 group cursor-pointer bg-white p-2 sm:p-3 pb-6 sm:pb-8 shadow-poster-lg border border-csg-black/30 transition-transform duration-500 hover:-translate-y-1.5"
          >
            <div className="overflow-hidden bg-csg-muted">
              <img
                src={ALBUM_PHOTOS[7].url}
                alt={ALBUM_PHOTOS[7].alt}
                className="w-full aspect-[16/10] object-cover transition-transform duration-700 group-hover:scale-[1.01]"
                loading="lazy"
              />
            </div>
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
            <X className="w-5 h-5" />
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
                <ChevronLeft className="w-4 h-4" />
                <span>TRƯỚC</span>
              </button>

              <span className="text-[#DCD5C4]/60">
                {selectedIndex + 1} / {ALBUM_PHOTOS.length}
              </span>

              <button
                onClick={handleNext}
                className="p-1 hover:text-csg-yellow transition-colors flex items-center gap-1"
                aria-label="Ảnh sau"
              >
                <span>TIẾP</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
