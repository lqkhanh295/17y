import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

interface MemoryItem {
  id: string;
  url: string;
  alt: string;
  caption?: string;
  aspect?: string;
}

const MEMORIES: MemoryItem[] = [
  {
    id: 'm-1',
    url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1800&q=85',
    alt: 'Bàn tiệc ấm cúng dưới ánh đèn vàng',
    caption: 'Bàn tiệc hội ngộ • Đêm hoàng kim',
  },
  {
    id: 'm-2',
    url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=85',
    alt: 'Góc máy tác nghiệp sân trường',
    caption: 'Những góc máy lăn xả',
  },
  {
    id: 'm-3',
    url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=85',
    alt: 'Khoảnh khắc nâng ly và thổi nến',
    caption: 'Thổi nến sinh nhật',
  },
  {
    id: 'm-4',
    url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1800&q=85',
    alt: 'Biển xanh và màu áo truyền thống',
    caption: 'Những chuyến đi sắc áo vàng',
  },
  {
    id: 'm-5',
    url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=85',
    alt: 'Lửa trại đêm và nụ cười đồng đội',
    caption: 'Đêm lửa trại không ngủ',
  },
  {
    id: 'm-6',
    url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1400&q=85',
    alt: 'Sân khấu âm nhạc và ánh sáng',
    caption: 'Cháy hết mình trên sân khấu',
  },
  {
    id: 'm-7',
    url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=85',
    alt: 'Bàn tròn thảo luận và sáng tạo',
    caption: 'Những đêm dựng bài',
  },
  {
    id: 'm-8',
    url: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1600&q=85',
    alt: 'Vòng tay gắn kết của các thế hệ',
    caption: 'Nơi thanh xuân hội tụ',
  }
];

export const MemoryAlbum: React.FC = () => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handlePrev = useCallback(() => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex - 1 + MEMORIES.length) % MEMORIES.length);
  }, [selectedIndex]);

  const handleNext = useCallback(() => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex + 1) % MEMORIES.length);
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
    <section id="memories" className="py-24 sm:py-36 px-4 sm:px-8 max-w-[1400px] mx-auto">
      {/* Section Header: Minimal & Emotional */}
      <div className="border-b-2 border-csg-black pb-4 mb-16 sm:mb-24 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
        <h2 className="text-2xl sm:text-4xl font-display font-extrabold uppercase tracking-tight text-csg-black">
          Kỷ Niệm Qua Những Năm Tháng
        </h2>
        <span className="font-editorial italic text-base sm:text-lg text-csg-black/70">
          "Chỉ cần nhìn những bức ảnh, là nhớ lại."
        </span>
      </div>

      {/* Fluid Photo Journey */}
      <div className="space-y-24 sm:space-y-40">
        
        {/* 1. Monumental Full-Bleed Opening Photo */}
        <div 
          onClick={() => setSelectedIndex(0)}
          className="group relative cursor-pointer overflow-hidden border-2 border-csg-black shadow-poster-lg transition-transform duration-500 hover:-translate-y-1"
        >
          <img
            src={MEMORIES[0].url}
            alt={MEMORIES[0].alt}
            className="w-full aspect-[16/9] sm:aspect-[21/9] object-cover transition-transform duration-700 group-hover:scale-[1.015]"
            loading="lazy"
          />
          <div className="absolute bottom-4 right-4 bg-csg-paper/95 border border-csg-black px-3 py-1 font-mono text-xs font-bold text-csg-black flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <ZoomIn className="w-3.5 h-3.5 text-csg-red" />
            <span>XEM ẢNH</span>
          </div>
        </div>

        {/* 2. Asymmetric Dialogue: Tall Portrait Left + Landscape Right with Generous Whitespace */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-16 items-center">
          <div 
            onClick={() => setSelectedIndex(1)}
            className="md:col-span-5 group cursor-pointer overflow-hidden border-2 border-csg-black shadow-poster transition-transform duration-500 hover:-translate-y-1"
          >
            <img
              src={MEMORIES[1].url}
              alt={MEMORIES[1].alt}
              className="w-full aspect-[3/4] object-cover transition-transform duration-700 group-hover:scale-[1.015]"
              loading="lazy"
            />
          </div>

          <div className="md:col-span-7 space-y-6 md:pl-8">
            <p className="font-editorial italic text-2xl sm:text-4xl text-csg-black/80 leading-snug max-w-lg">
              "Những ngày đầu lăn xả sân trường, máy ảnh mượn và ngòi bút tuổi đôi mươi."
            </p>
            <div 
              onClick={() => setSelectedIndex(2)}
              className="group cursor-pointer overflow-hidden border-2 border-csg-black shadow-poster transition-transform duration-500 hover:-translate-y-1"
            >
              <img
                src={MEMORIES[2].url}
                alt={MEMORIES[2].alt}
                className="w-full aspect-[16/10] object-cover transition-transform duration-700 group-hover:scale-[1.015]"
                loading="lazy"
              />
            </div>
          </div>
        </div>

        {/* 3. The Sea & Sunsets (Full Panoramic Horizon) */}
        <div 
          onClick={() => setSelectedIndex(3)}
          className="group relative cursor-pointer overflow-hidden border-2 border-csg-black shadow-poster-lg transition-transform duration-500 hover:-translate-y-1"
        >
          <img
            src={MEMORIES[3].url}
            alt={MEMORIES[3].alt}
            className="w-full aspect-[16/8] sm:aspect-[21/8] object-cover transition-transform duration-700 group-hover:scale-[1.015]"
            loading="lazy"
          />
          <div className="absolute bottom-4 right-4 bg-csg-paper/95 border border-csg-black px-3 py-1 font-mono text-xs font-bold text-csg-black flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <ZoomIn className="w-3.5 h-3.5 text-csg-red" />
            <span>XEM ẢNH</span>
          </div>
        </div>

        {/* 4. Candid Pair: Campfire Smiles & Music Stage */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-14 items-start">
          <div 
            onClick={() => setSelectedIndex(4)}
            className="group cursor-pointer overflow-hidden border-2 border-csg-black shadow-poster transition-transform duration-500 hover:-translate-y-1"
          >
            <img
              src={MEMORIES[4].url}
              alt={MEMORIES[4].alt}
              className="w-full aspect-square object-cover transition-transform duration-700 group-hover:scale-[1.015]"
              loading="lazy"
            />
          </div>

          <div 
            onClick={() => setSelectedIndex(5)}
            className="group cursor-pointer overflow-hidden border-2 border-csg-black shadow-poster transition-transform duration-500 hover:-translate-y-1 sm:mt-12"
          >
            <img
              src={MEMORIES[5].url}
              alt={MEMORIES[5].alt}
              className="w-full aspect-square sm:aspect-[4/5] object-cover transition-transform duration-700 group-hover:scale-[1.015]"
              loading="lazy"
            />
          </div>
        </div>

        {/* 5. Editorial Desk & Grand Celebration Finale */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-14 items-end">
          <div 
            onClick={() => setSelectedIndex(6)}
            className="md:col-span-5 group cursor-pointer overflow-hidden border-2 border-csg-black shadow-poster transition-transform duration-500 hover:-translate-y-1"
          >
            <img
              src={MEMORIES[6].url}
              alt={MEMORIES[6].alt}
              className="w-full aspect-[4/3] object-cover transition-transform duration-700 group-hover:scale-[1.015]"
              loading="lazy"
            />
          </div>

          <div 
            onClick={() => setSelectedIndex(7)}
            className="md:col-span-7 group cursor-pointer overflow-hidden border-2 border-csg-black shadow-poster-lg transition-transform duration-500 hover:-translate-y-1"
          >
            <img
              src={MEMORIES[7].url}
              alt={MEMORIES[7].alt}
              className="w-full aspect-[16/10] object-cover transition-transform duration-700 group-hover:scale-[1.015]"
              loading="lazy"
            />
          </div>
        </div>

      </div>

      {/* ================= LIGHTBOX MODAL ================= */}
      {selectedIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-[#11100E]/95 backdrop-blur-md animate-fadeIn"
          onClick={() => setSelectedIndex(null)}
        >
          <button
            onClick={() => setSelectedIndex(null)}
            className="absolute top-6 right-6 z-30 p-2.5 bg-[#201E1A] hover:bg-csg-red text-[#F4EEDF] transition-colors border border-white/10"
            aria-label="Đóng (Esc)"
          >
            <X className="w-5 h-5" />
          </button>

          <div 
            className="relative max-w-5xl w-full max-h-[85vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={MEMORIES[selectedIndex].url}
              alt={MEMORIES[selectedIndex].alt}
              className="max-h-[75vh] w-auto max-w-full object-contain border border-white/10 shadow-2xl"
            />

            <div className="w-full max-w-xl mt-4 px-2 flex items-center justify-between text-xs font-mono text-[#DCD5C4]">
              <span className="font-sans font-medium text-white">{MEMORIES[selectedIndex].caption}</span>

              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrev}
                  className="p-1 hover:text-csg-yellow transition-colors"
                  aria-label="Ảnh trước"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span>{selectedIndex + 1} / {MEMORIES.length}</span>
                <button
                  onClick={handleNext}
                  className="p-1 hover:text-csg-yellow transition-colors"
                  aria-label="Ảnh sau"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
