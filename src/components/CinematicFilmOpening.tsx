import React, { useState, useEffect, useRef } from 'react';
import { Film, ArrowRight, Sparkles, Volume2, VolumeX } from 'lucide-react';

interface CinematicFilmOpeningProps {
  onComplete: () => void;
}

interface MemorySlide {
  year: string;
  era: string;
  title: string;
  caption: string;
  frameCode: string;
  imgUrl: string;
}

const ARCHIVE_SLIDES: MemorySlide[] = [
  {
    year: '2009',
    era: 'KHỞI ĐẦU TÁC NGHIỆP',
    title: 'Những Thước Phim Mộc Mạc Đầu Tiên',
    caption: 'Kíp máy ảnh và ngòi bút đầu tiên đặt nền móng cho CLB Truyền thông Cóc Sài Gòn tại ĐH FPT.',
    frameCode: 'EXP-01 • F-CAMP 2009',
    imgUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80'
  },
  {
    year: '2017',
    era: 'THANH XUÂN RỰC RỠ',
    title: 'Sắc Áo Vàng & Chuyến Đi Bất Tận',
    caption: 'Lửa trại Vũng Tàu, tiếng hò reo vang dội bãi biển, nơi tình đồng đội hóa thành gia đình.',
    frameCode: 'EXP-09 • VŨNG TÀU 2017',
    imgUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80'
  },
  {
    year: '2025 - 2026',
    era: 'HỘI TỤ 17 NĂM',
    title: 'Đêm Hoàng Kim • Trở Về Nhà',
    caption: 'Bàn tiệc ấm cúng nơi các thế hệ tiền bối và đàn em cùng nâng ly mừng 17 năm sắc áo vàng.',
    frameCode: 'EXP-17 • GALA ASIANA 17Y',
    imgUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80'
  }
];

export const CinematicFilmOpening: React.FC<CinematicFilmOpeningProps> = ({ onComplete }) => {
  // Phase state: 
  // 'awakening' (0-800ms) -> 'frames' (800-2300ms) -> 'reveal' (2300-3400ms) -> 'transition' (3400-3900ms)
  const [phase, setPhase] = useState<'awakening' | 'frames' | 'reveal' | 'transition'>('awakening');
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const timersRef = useRef<number[]>([]);

  // Function to finish and clean up
  const finishIntro = () => {
    sessionStorage.setItem('csg17y_film_intro_viewed', 'true');
    setIsExiting(true);
    const exitTimer = window.setTimeout(() => {
      onComplete();
    }, 350);
    timersRef.current.push(exitTimer);
  };

  const handleSkip = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    // Clear any pending timers
    timersRef.current.forEach(timer => clearTimeout(timer));
    timersRef.current = [];
    finishIntro();
  };

  useEffect(() => {
    // 1. Accessibility Check: if user prefers reduced motion, skip intro immediately
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      sessionStorage.setItem('csg17y_film_intro_viewed', 'true');
      onComplete();
      return;
    }

    // 2. Preload archival images to avoid any white flash or layout shift
    ARCHIVE_SLIDES.forEach(slide => {
      const img = new Image();
      img.src = slide.imgUrl;
    });

    // 3. Listen for Escape key for immediate keyboard skip
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // 4. Orchestrated Cinematic Timeline (Total 3.8s)
    // T = 0ms: Film Awakening (projector turns on, shutter flicker)
    // T = 800ms: Frame 1 (2009)
    const t1 = window.setTimeout(() => {
      setPhase('frames');
      setActiveFrameIndex(0);
    }, 800);

    // T = 1500ms: Frame 2 (2017)
    const t2 = window.setTimeout(() => {
      setActiveFrameIndex(1);
    }, 1500);

    // T = 2200ms: Frame 3 locks in (2025/2026)
    const t3 = window.setTimeout(() => {
      setActiveFrameIndex(2);
    }, 2200);

    // T = 2400ms: The 17-Year Reveal typography appears
    const t4 = window.setTimeout(() => {
      setPhase('reveal');
    }, 2400);

    // T = 3400ms: Seamless transition into main hero layout
    const t5 = window.setTimeout(() => {
      setPhase('transition');
      finishIntro();
    }, 3450);

    timersRef.current.push(t1, t2, t3, t4, t5);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      timersRef.current.forEach(timer => clearTimeout(timer));
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cóc Sài Gòn 17Y - Thước phim kỷ niệm 17 năm"
      className={`fixed inset-0 z-50 flex flex-col justify-between bg-[#141210] text-[#F4EEDF] select-none transition-all duration-500 ease-out overflow-hidden ${
        isExiting ? 'opacity-0 scale-[1.03] pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Analog Projector Grain & Subtle Optical Exposure Flicker */}
      <div className="absolute inset-0 pointer-events-none z-20 film-grain opacity-60" />
      <div 
        className="absolute inset-0 pointer-events-none z-10 bg-radial-vignette opacity-80"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(244, 197, 66, 0.04) 0%, rgba(14, 13, 11, 0.95) 85%)'
        }}
      />

      {/* Subtle Analog Film Scanlines & Vertical Film Scratches */}
      <div className="absolute inset-0 pointer-events-none z-20 opacity-20 bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]" />

      {/* ================= TOP METADATA & SKIP BAR ================= */}
      <header className="relative z-30 px-4 sm:px-8 py-4 sm:py-5 flex items-center justify-between border-b border-[#F4EEDF]/15 bg-[#141210]/80 backdrop-blur-sm">
        {/* Archival Roll Code */}
        <div className="flex items-center gap-3 font-mono text-[11px] sm:text-xs text-[#F4C542] tracking-widest uppercase">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B94D35] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#B94D35]" />
          </span>
          <span className="font-bold hidden xs:inline">ARCHIVE REEL // VOL. 17</span>
          <span className="text-[#F4EEDF]/40">•</span>
          <span className="text-[#F4EEDF]/80">35MM FILM • 2009 - 2026</span>
          <span className="text-[#F4EEDF]/40 hidden md:inline">•</span>
          <span className="text-[#DCD5C4] hidden md:inline">ISO 400</span>
        </div>

        {/* Skip Button */}
        <button
          onClick={handleSkip}
          aria-label="Bỏ qua phần giới thiệu phim (Phím tắt: Esc)"
          className="group px-3.5 py-1.5 bg-[#20231F] hover:bg-[#F4C542] text-[#F4EEDF] hover:text-[#20231F] border border-[#F4EEDF]/30 hover:border-[#20231F] font-mono text-[11px] sm:text-xs font-bold tracking-wider transition-all duration-200 flex items-center gap-2 shadow-sm cursor-pointer"
        >
          <span>BỎ QUA INTRO</span>
          <span className="text-[10px] text-[#F4EEDF]/60 group-hover:text-[#20231F]/70 font-normal">[Esc]</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </header>

      {/* ================= MAIN 35MM FILM STRIP PROJECTION AREA ================= */}
      <main className="relative z-30 flex-1 flex flex-col items-center justify-center px-4 py-2 sm:py-4">
        {/* 35mm Analog Film Reel Container */}
        <div className="w-full max-w-4xl bg-[#1C1A17] border-y-2 sm:border-2 border-[#38332D] shadow-2xl overflow-hidden relative">
          
          {/* Top Sprocket Perforation Rail */}
          <div className="bg-[#12110F] border-b border-[#38332D] py-1.5 px-3 flex items-center justify-between overflow-hidden">
            <div className="flex items-center gap-4 sm:gap-6 font-mono text-[9px] text-[#DCD5C4]/40 tracking-wider">
              <span>EASTMAN KODAK 400</span>
              <span className="hidden sm:inline">SAFETY FILM</span>
              <span>▲ 17A</span>
            </div>
            {/* Visual Sprocket Holes */}
            <div className="flex gap-2 sm:gap-3.5 shrink-0 opacity-80">
              {[...Array(14)].map((_, i) => (
                <div
                  key={`sprocket-top-${i}`}
                  className="w-3 sm:w-4 h-4 sm:h-5 bg-[#0A0908] border border-[#38332D] rounded-[2px]"
                />
              ))}
            </div>
            <div className="hidden sm:flex items-center gap-4 font-mono text-[9px] text-[#F4C542]/70 tracking-wider">
              <span>CSG-2009-2026</span>
              <span>EXP 36</span>
            </div>
          </div>

          {/* Active Cinema Frame Window */}
          <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-[#0D0C0A] overflow-hidden flex items-center justify-center">
            {/* Film Awakening Optical Glow / Leader countdown (Scene 1) */}
            {phase === 'awakening' && (
              <div className="text-center space-y-4 animate-pulse">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full border-2 border-dashed border-[#F4C542]/40 flex items-center justify-center">
                  <Film className="w-8 h-8 text-[#F4C542]" />
                </div>
                <div className="space-y-1">
                  <p className="font-mono text-xs text-[#F4C542] tracking-widest uppercase">
                    KHỞI ĐỘNG CUỘN PHIM LƯU TRỮ...
                  </p>
                  <p className="font-mono text-[10px] text-[#DCD5C4]/60">
                    BẢN GHI SỐ 17 • CLB CÓC SÀI GÒN
                  </p>
                </div>
              </div>
            )}

            {/* Archival Photographs (Scene 2 & Scene 3) */}
            {phase !== 'awakening' && (
              <div className="relative w-full h-full">
                {ARCHIVE_SLIDES.map((slide, idx) => {
                  const isActive = idx === activeFrameIndex;
                  return (
                    <div
                      key={slide.year}
                      className={`absolute inset-0 transition-all duration-700 ease-out flex items-center justify-center ${
                        isActive
                          ? 'opacity-100 scale-100 z-10'
                          : 'opacity-0 scale-95 pointer-events-none z-0'
                      }`}
                    >
                      {/* Frame Image */}
                      <img
                        src={slide.imgUrl}
                        alt={slide.title}
                        className="w-full h-full object-cover filter contrast-[105%] saturate-[110%] brightness-[92%]"
                      />

                      {/* Optical Vignette & Analog Dark Tint */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#141210]/90 via-[#141210]/30 to-[#141210]/50" />

                      {/* Frame Stamp Marking (Top Left) */}
                      <div className="absolute top-3 left-3 sm:top-5 sm:left-5 flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-[#141210]/90 border border-[#F4C542]/50 text-[#F4C542] font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                          {slide.frameCode}
                        </span>
                        <span className="hidden sm:inline-block px-2 py-0.5 bg-[#B94D35] text-[#F4EEDF] font-mono text-[10px] font-bold uppercase">
                          {slide.era}
                        </span>
                      </div>

                      {/* Timestamp (Top Right) */}
                      <div className="absolute top-3 right-3 sm:top-5 sm:right-5 bg-[#141210]/90 px-2.5 py-0.5 font-mono text-xs sm:text-sm font-extrabold text-[#F4EEDF] border border-[#F4EEDF]/20">
                        NĂM {slide.year}
                      </div>

                      {/* Frame Caption Strip (Bottom) */}
                      {phase === 'frames' && (
                        <div className="absolute bottom-3 left-3 right-3 sm:bottom-6 sm:left-6 sm:right-6 bg-[#141210]/95 border-l-4 border-[#F4C542] p-3 sm:p-4 backdrop-blur-md max-w-xl transition-all duration-300">
                          <div className="flex items-center gap-2 text-[#F4C542] font-mono text-[11px] font-bold uppercase tracking-wider mb-1">
                            <span>{slide.title}</span>
                          </div>
                          <p className="text-xs sm:text-sm text-[#F4EEDF]/90 leading-snug font-sans">
                            {slide.caption}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* ================= SCENE 3: THE 17-YEAR REVEAL TYPOGRAPHY OVERLAY ================= */}
                {phase === 'reveal' && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-[#141210]/70 backdrop-blur-[2px] transition-all duration-500 animate-fadeIn">
                    {/* Archival Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#B94D35] text-[#F4EEDF] font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-3 shadow-md">
                      <Sparkles className="w-3.5 h-3.5 text-[#F4C542]" />
                      <span>KỶ NIỆM 17 NĂM THÀNH LẬP CLB • 2009 - 2026</span>
                    </div>

                    {/* Bold Editorial Master Title */}
                    <h1 className="font-display font-extrabold text-3xl sm:text-5xl md:text-6xl text-[#F4EEDF] uppercase tracking-tight leading-[0.95] drop-shadow-lg">
                      CÓC SÀI GÒN
                      <span className="block font-editorial italic font-normal text-2xl sm:text-4xl md:text-5xl text-[#F4C542] mt-1">
                        17 Years of Memories
                      </span>
                    </h1>

                    {/* Emotional Handwritten Anchor */}
                    <p className="font-handwriting text-2xl sm:text-3xl text-[#F4C542] mt-3 drop-shadow">
                      "Những năm tháng mình đã cùng nhau..."
                    </p>

                    {/* Official Invitation Metadata */}
                    <div className="mt-4 pt-3 border-t border-[#F4EEDF]/20 flex flex-wrap items-center justify-center gap-3 sm:gap-6 font-mono text-[11px] sm:text-xs text-[#DCD5C4]">
                      <span>ASIANA PLAZA TÂN PHÚ</span>
                      <span>•</span>
                      <span className="text-[#F4C542] font-bold">18:00 • 19.12.2026</span>
                      <span>•</span>
                      <span>200 GƯƠNG MẶT CÓC</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Sprocket Perforation Rail */}
          <div className="bg-[#12110F] border-t border-[#38332D] py-1.5 px-3 flex items-center justify-between overflow-hidden">
            <div className="flex items-center gap-4 font-mono text-[9px] text-[#F4C542]/70 tracking-wider">
              <span>REEL NO. 17</span>
              <span className="hidden sm:inline">DX 400-36</span>
            </div>
            {/* Visual Sprocket Holes */}
            <div className="flex gap-2 sm:gap-3.5 shrink-0 opacity-80">
              {[...Array(14)].map((_, i) => (
                <div
                  key={`sprocket-bot-${i}`}
                  className="w-3 sm:w-4 h-4 sm:h-5 bg-[#0A0908] border border-[#38332D] rounded-[2px]"
                />
              ))}
            </div>
            <div className="flex items-center gap-4 sm:gap-6 font-mono text-[9px] text-[#DCD5C4]/40 tracking-wider">
              <span>▲ 17B</span>
              <span className="hidden sm:inline">PROCESS C-41</span>
            </div>
          </div>
        </div>
      </main>

      {/* ================= BOTTOM TIMELINE & REEL PROGRESS ================= */}
      <footer className="relative z-30 px-4 sm:px-8 py-3 sm:py-4 border-t border-[#F4EEDF]/15 bg-[#141210]/80 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] sm:text-xs font-mono text-[#DCD5C4]/70">
        <div className="flex items-center gap-2">
          <Film className="w-3.5 h-3.5 text-[#F4C542]" />
          <span>LƯU TRỮ PHIM TƯ LIỆU:</span>
          <span className="text-[#F4C542] font-bold">
            {activeFrameIndex === 0 && 'THỜI KỲ 2009 - 2014'}
            {activeFrameIndex === 1 && 'THỜI KỲ 2015 - 2020'}
            {activeFrameIndex === 2 && 'THỜI KỲ 2021 - 2026 (17Y)'}
          </span>
        </div>

        {/* 3 Step Visual Markers */}
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 border ${activeFrameIndex === 0 ? 'bg-[#F4C542] text-[#20231F] border-[#F4C542] font-bold' : 'border-[#F4EEDF]/20 text-[#F4EEDF]/50'}`}>
            01: 2009
          </span>
          <span className="text-[#F4EEDF]/30">──</span>
          <span className={`px-2 py-0.5 border ${activeFrameIndex === 1 ? 'bg-[#F4C542] text-[#20231F] border-[#F4C542] font-bold' : 'border-[#F4EEDF]/20 text-[#F4EEDF]/50'}`}>
            09: 2017
          </span>
          <span className="text-[#F4EEDF]/30">──</span>
          <span className={`px-2 py-0.5 border ${activeFrameIndex === 2 ? 'bg-[#F4C542] text-[#20231F] border-[#F4C542] font-bold' : 'border-[#F4EEDF]/20 text-[#F4EEDF]/50'}`}>
            17: 2026
          </span>
        </div>

        <div className="hidden md:block text-[#F4EEDF]/50 text-right">
          NHẤN <kbd className="px-1.5 py-0.5 bg-[#20231F] border border-[#F4EEDF]/30 text-[#F4EEDF] rounded text-[9px]">ESC</kbd> ĐỂ VÀO TRANG CHỦ
        </div>
      </footer>
    </div>
  );
};
