import React, { useState, useEffect, useRef } from 'react';

interface CinematicFilmOpeningProps {
  onComplete: () => void;
}

export const CinematicFilmOpening: React.FC<CinematicFilmOpeningProps> = ({ onComplete }) => {
  // Sequence stages:
  // 'rolling' (0 - 1.8s) -> 'settled' (1.8s - 2.8s) -> 'expanding' (2.8s - 3.4s) -> done
  const [stage, setStage] = useState<'rolling' | 'settled' | 'expanding'>('rolling');
  const [isDismissed, setIsDismissed] = useState(false);
  const timersRef = useRef<number[]>([]);

  const handleFinish = () => {
    sessionStorage.setItem('csg17y_film_intro_viewed', 'true');
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    const endTimer = window.setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }
      onComplete();
    }, 400);
    timersRef.current.push(endTimer);
  };

  const handleSkip = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    handleFinish();
  };

  useEffect(() => {
    // Lock scroll and force top position while intro is active
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.body.style.overflow = 'hidden';
    }

    // 1. Accessibility: reduced motion skip
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      sessionStorage.setItem('csg17y_film_intro_viewed', 'true');
      document.body.style.overflow = 'unset';
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      onComplete();
      return;
    }

    // 2. Escape key listener
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkip();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    // 3. Cinematic Timeline
    // Phase 1: Rolling reel slows down and settles on the Gala photo at 1.8s
    const t1 = window.setTimeout(() => {
      setStage('settled');
    }, 1800);

    // Phase 2: Frame expands outward to reveal photobook at 2.8s
    const t2 = window.setTimeout(() => {
      setStage('expanding');
    }, 2800);

    // Phase 3: Transition finishes at 3.3s
    const t3 = window.setTimeout(() => {
      handleFinish();
    }, 3300);

    timersRef.current.push(t1, t2, t3);

    return () => {
      if (typeof window !== 'undefined') {
        document.body.style.overflow = 'unset';
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }
      window.removeEventListener('keydown', onKeyDown);
      timersRef.current.forEach(t => clearTimeout(t));
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cóc Sài Gòn 17Y Thước Phim Kỷ Niệm"
      className={`fixed inset-0 z-50 overflow-hidden select-none transition-all duration-700 ease-in-out ${
        isDismissed || stage === 'expanding'
          ? 'opacity-0 pointer-events-none scale-105'
          : 'opacity-100 scale-100'
      }`}
      style={{
        backgroundColor: '#12110E',
      }}
    >
      {/* Subtle Analog Grain Overlay */}
      <div className="absolute inset-0 pointer-events-none z-30 opacity-40 film-grain" />

      {/* Discrete, High-Taste Skip Label */}
      <div className="absolute top-6 right-6 z-40">
        <button
          onClick={handleSkip}
          aria-label="Bỏ qua phần giới thiệu (Phím tắt: Esc)"
          className="font-mono text-xs text-[#DCD5C4]/60 hover:text-[#F4C542] tracking-widest uppercase transition-colors py-1 px-2 border-b border-transparent hover:border-[#F4C542] cursor-pointer"
        >
          BỎ QUA [ESC]
        </button>
      </div>

      {/* Continuous 35mm Film Strip */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`relative flex items-center transition-all ease-out ${
            stage === 'rolling'
              ? 'translate-x-[48%] sm:translate-x-[42%] duration-[1800ms]'
              : 'translate-x-0 duration-700'
          }`}
          style={{
            willChange: 'transform',
          }}
        >
          {/* Continuous Film Negative Background */}
          <div className="flex items-center gap-6 sm:gap-10 py-8 sm:py-12 px-8 bg-[#181613] border-y-[6px] border-[#2A2722] shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
            
            {/* FRAME 01: F-CAMP KHỞI ĐẦU */}
            <div className="relative shrink-0 w-[240px] sm:w-[340px] aspect-[4/3] bg-[#0E0D0B] overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=80"
                alt="Khởi đầu tác nghiệp"
                className="w-full h-full object-cover filter contrast-105 brightness-90 grayscale-[15%]"
              />
              <div className="absolute bottom-2 left-3 font-mono text-[10px] text-[#DCD5C4]/80 tracking-widest uppercase">
                EXP. 01 • KHỞI ĐẦU TÁC NGHIỆP
              </div>
            </div>

            {/* FRAME 02: TEAMBUILDING */}
            <div className="relative shrink-0 w-[240px] sm:w-[340px] aspect-[4/3] bg-[#0E0D0B] overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1000&q=80"
                alt="Thanh xuân rực rỡ"
                className="w-full h-full object-cover filter contrast-105 brightness-90"
              />
              <div className="absolute bottom-2 left-3 font-mono text-[10px] text-[#DCD5C4]/80 tracking-widest uppercase">
                EXP. 09 • SẮC ÁO VÀNG
              </div>
            </div>

            {/* FRAME 03: SÂN KHẤU CÓC SÀI GÒN (STAGE PHOTO) */}
            <div className="relative shrink-0 w-[240px] sm:w-[340px] aspect-[4/3] bg-[#0E0D0B] overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1000&q=80"
                alt="Sân khấu Cóc Sài Gòn"
                className="w-full h-full object-cover filter contrast-105 brightness-90"
              />
              <div className="absolute bottom-2 left-3 font-mono text-[10px] text-[#F4C542] tracking-widest uppercase font-bold">
                EXP. 16 • SÂN KHẤU CÓC
              </div>
            </div>

            {/* FRAME 04: GALA NIGHT 17Y (THE SETTLED HERO PHOTO) */}
            <div
              className={`relative shrink-0 w-[300px] sm:w-[460px] md:w-[540px] aspect-[4/3] bg-[#0E0D0B] overflow-hidden transition-all duration-700 ${
                stage === 'settled' || stage === 'expanding'
                  ? 'ring-2 ring-[#F4C542]/80 shadow-[0_0_50px_rgba(244,197,66,0.15)]'
                  : ''
              }`}
            >
              <img
                src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80"
                alt="Đêm Hoàng Kim Gala Cóc Sài Gòn"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-3 font-mono text-[10px] text-[#F4C542] tracking-widest uppercase font-bold">
                EXP. 17 • ĐÊM HOÀNG KIM 17Y
              </div>
            </div>
          </div>

          {/* Top Continuous Sprocket Perforations */}
          <div className="absolute -top-3 left-0 right-0 flex justify-around pointer-events-none opacity-70">
            {[...Array(28)].map((_, i) => (
              <div
                key={`sprocket-top-${i}`}
                className="w-3 sm:w-4 h-5 sm:h-6 bg-[#0E0D0B] border border-[#2A2722] rounded-[2px]"
              />
            ))}
          </div>

          {/* Bottom Continuous Sprocket Perforations */}
          <div className="absolute -bottom-3 left-0 right-0 flex justify-around pointer-events-none opacity-70">
            {[...Array(28)].map((_, i) => (
              <div
                key={`sprocket-bot-${i}`}
                className="w-3 sm:w-4 h-5 sm:h-6 bg-[#0E0D0B] border border-[#2A2722] rounded-[2px]"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Editorial Title Reveal at Settled Moment */}
      <div
        className={`absolute bottom-10 sm:bottom-16 left-0 right-0 z-30 text-center px-4 transition-all duration-700 ${
          stage === 'settled' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <p className="font-mono text-xs sm:text-sm text-[#F4C542] tracking-[0.25em] uppercase font-bold mb-1">
          KỶ NIỆM 17 NĂM THÀNH LẬP CLB
        </p>
        <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-[#F4EEDF] tracking-tight uppercase">
          CÓC SÀI GÒN <span className="font-editorial italic font-normal text-[#F4C542]">17 Years</span>
        </h1>
      </div>
    </div>
  );
};
