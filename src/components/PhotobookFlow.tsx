import React, { useState, useEffect, useCallback } from 'react';
import { CloseIcon, ChevronLeftIcon, ChevronRightIcon, ArrowRightIcon } from 'naive-icons';
import { PHOTOBOOK_IMAGES, ALL_PHOTOBOOK_IMAGES, PhotobookImage, GALA_EVENT_DETAILS } from '../data/photobookData';

interface PhotobookFlowProps {
  onOpenRegister: () => void;
  onOpenLookup: () => void;
  onWishSubmit?: (author: string, content: string) => Promise<void>;
  wishSubmitted?: boolean;
}

export const PhotobookFlow: React.FC<PhotobookFlowProps> = ({
  onOpenRegister,
  onOpenLookup,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<PhotobookImage | null>(null);
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);

  // Cinematic film-reveal entrance animation coordinator
  useEffect(() => {
    // Skip motion if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsAnimationComplete(true);
      return;
    }

    // Automatically transition to clean stable state after reveal sequence finishes (2.2s)
    const timer = setTimeout(() => {
      setIsAnimationComplete(true);
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  // Lightbox keyboard navigation & body scroll lock
  const handlePrev = useCallback(() => {
    if (!selectedPhoto) return;
    const currentIndex = ALL_PHOTOBOOK_IMAGES.findIndex(img => img.id === selectedPhoto.id);
    const prevIndex = (currentIndex - 1 + ALL_PHOTOBOOK_IMAGES.length) % ALL_PHOTOBOOK_IMAGES.length;
    setSelectedPhoto(ALL_PHOTOBOOK_IMAGES[prevIndex]);
  }, [selectedPhoto]);

  const handleNext = useCallback(() => {
    if (!selectedPhoto) return;
    const currentIndex = ALL_PHOTOBOOK_IMAGES.findIndex(img => img.id === selectedPhoto.id);
    const nextIndex = (currentIndex + 1) % ALL_PHOTOBOOK_IMAGES.length;
    setSelectedPhoto(ALL_PHOTOBOOK_IMAGES[nextIndex]);
  }, [selectedPhoto]);

  useEffect(() => {
    if (selectedPhoto) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedPhoto]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedPhoto) return;
      if (e.key === 'Escape') setSelectedPhoto(null);
      else if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhoto, handlePrev, handleNext]);

  return (
    <div className="w-full pb-20">

      {/* ================= EDITORIAL MASTHEAD ENTRY ================= */}
      <header className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 border-b border-csg-black/15 pb-3 mb-12 sm:mb-20 font-body">
        <div className="flex items-baseline gap-2.5">
          <span className="font-display font-extrabold text-xl sm:text-2xl tracking-tight text-csg-black uppercase">
            CÓC SÀI GÒN
          </span>
          <span className="font-editorial italic font-normal text-csg-red text-2xl sm:text-3xl">
            17 năm
          </span>
          <span className="font-mono text-[10px] text-csg-black/40 pl-1 tracking-widest hidden sm:inline">
            // 2009 — 2026
          </span>
        </div>
        <div className="flex items-center gap-4 font-mono text-xs">
          <button
            onClick={onOpenRegister}
            className="text-csg-black/80 hover:text-csg-red underline underline-offset-4 tracking-wider uppercase transition-colors font-bold inline-flex items-center gap-1.5"
          >
            <span>Đăng ký tham gia Gala 17Y</span>
            <ArrowRightIcon size={14} className="shrink-0" />
          </button>
        </div>
      </header>


      {/* ========================================================================= */}
      {/* DESKTOP ART DIRECTION (Continuous, organic, unpredictable canvas)          */}
      {/* ========================================================================= */}
      <div className="hidden md:block">

        {/* 1. TIGHT PAIRING: Collaborative workspace and vertical camera sitting closely */}
        <div className="flex items-start gap-6 lg:gap-8 max-w-5xl">
          {/* Workspace photo (62%) */}
          <div
            onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.workspace)}
            className={`w-[62%] cursor-pointer transition-opacity duration-300 hover:opacity-90 shadow-md ${
              !isAnimationComplete ? 'film-reveal-item' : ''
            }`}
            style={{ animationDelay: '100ms' }}
          >
            <img
              src={PHOTOBOOK_IMAGES.workspace.src}
              alt={PHOTOBOOK_IMAGES.workspace.alt}
              className="w-full aspect-[16/10] object-cover"
            />
          </div>

          {/* Vertical camera photo (28%, offset down 48px) */}
          <div
            onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.camera)}
            className={`w-[28%] pt-12 cursor-pointer transition-opacity duration-300 hover:opacity-90 shadow-md ${
              !isAnimationComplete ? 'film-reveal-item' : ''
            }`}
            style={{ animationDelay: '220ms' }}
          >
            <img
              src={PHOTOBOOK_IMAGES.camera.src}
              alt={PHOTOBOOK_IMAGES.camera.alt}
              className="w-full aspect-[3/4] object-cover"
            />
          </div>
        </div>

        {/* --- INTENTIONAL WHITESPACE VOID (140px) --- */}
        <div className="h-28 lg:h-36" aria-hidden="true" />

        {/* 2. MASSIVE RIGHT ANCHOR WITH OVERLAPPING CANDID SNAPSHOT */}
        <div className="relative ml-auto w-[74%] max-w-4xl">
          {/* Cover banquet photo (74%) */}
          <div
            onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.cover)}
            className={`w-full cursor-pointer transition-opacity duration-300 hover:opacity-90 shadow-lg ${
              !isAnimationComplete ? 'film-reveal-item' : ''
            }`}
            style={{ animationDelay: '360ms' }}
          >
            <img
              src={PHOTOBOOK_IMAGES.cover.src}
              alt={PHOTOBOOK_IMAGES.cover.alt}
              className="w-full aspect-[16/9] object-cover"
            />
          </div>

          {/* Overlapping candid snapshot (Offset onto the top-left area of the cover photo) */}
          <div
            onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.coverOffset)}
            className={`absolute -top-10 -left-12 w-[34%] z-10 cursor-pointer transition-transform duration-300 hover:scale-[1.02] shadow-2xl -rotate-2 bg-white p-2 pb-4 ${
              !isAnimationComplete ? 'film-reveal-item' : ''
            }`}
            style={{ animationDelay: '500ms' }}
          >
            <img
              src={PHOTOBOOK_IMAGES.coverOffset.src}
              alt={PHOTOBOOK_IMAGES.coverOffset.alt}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>
        </div>

        {/* 3. ASYMMETRIC RIGHT-SIDE MICRO DISCOVERY (Breaks alternating pattern!) */}
        <div className="pt-16 pb-8 flex justify-end pr-16 lg:pr-28">
          {/* Bonfire square photo (26%) */}
          <div
            onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.bonfire)}
            className={`w-[26%] max-w-[280px] cursor-pointer transition-opacity duration-300 hover:opacity-90 shadow-md ${
              !isAnimationComplete ? 'film-reveal-item' : ''
            }`}
            style={{ animationDelay: '640ms' }}
          >
            <img
              src={PHOTOBOOK_IMAGES.bonfire.src}
              alt={PHOTOBOOK_IMAGES.bonfire.alt}
              className="w-full aspect-square object-cover"
            />
          </div>
        </div>

        {/* --- INTENTIONAL WHITESPACE VOID (100px) --- */}
        <div className="h-20 lg:h-28" aria-hidden="true" />

        {/* 4. EXPANSIVE CINEMATIC HORIZON (PULLED TO LEFT) */}
        <div className="w-[94%] mr-auto">
          {/* Beach panoramic photo (94%) */}
          <div
            onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.beachPanoramic)}
            className={`w-full cursor-pointer transition-opacity duration-300 hover:opacity-90 shadow-lg ${
              !isAnimationComplete ? 'film-reveal-item' : ''
            }`}
            style={{ animationDelay: '780ms' }}
          >
            <img
              src={PHOTOBOOK_IMAGES.beachPanoramic.src}
              alt={PHOTOBOOK_IMAGES.beachPanoramic.alt}
              className="w-full aspect-[22/8] object-cover"
            />
          </div>
        </div>

        {/* --- INTENTIONAL WHITESPACE VOID (140px) --- */}
        <div className="h-28 lg:h-36" aria-hidden="true" />

        {/* 5. CÓC STAGE PHOTOGRAPH & CELEBRATION MOMENT (Prominent, Uncovered & Visually Striking) */}
        <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-14 max-w-6xl">
          {/* PROMINENT CÓC STAGE PHOTO (68% width - fully visible, stage lights & crowd celebration) */}
          <div
            onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.stage)}
            className={`w-full lg:w-[68%] cursor-pointer transition-opacity duration-300 hover:opacity-90 shadow-xl ${
              !isAnimationComplete ? 'film-reveal-item' : ''
            }`}
            style={{ animationDelay: '920ms' }}
          >
            <img
              src={PHOTOBOOK_IMAGES.stage.src}
              alt={PHOTOBOOK_IMAGES.stage.alt}
              className="w-full aspect-[16/10] object-cover"
            />
          </div>

          {/* Celebration toast photo (Placed alongside/below without obscuring the stage photo) */}
          <div
            onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.celebrationToast)}
            className={`w-full lg:w-[32%] lg:pt-20 cursor-pointer transition-opacity duration-300 hover:opacity-90 shadow-md ${
              !isAnimationComplete ? 'film-reveal-item' : ''
            }`}
            style={{ animationDelay: '1060ms' }}
          >
            <img
              src={PHOTOBOOK_IMAGES.celebrationToast.src}
              alt={PHOTOBOOK_IMAGES.celebrationToast.alt}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>
        </div>

        {/* --- INTENTIONAL WHITESPACE VOID (160px) --- */}
        <div className="h-32 lg:h-44" aria-hidden="true" />

        {/* 6. SOLITARY CLIMAX MONUMENT */}
        <div className="w-[78%] mx-auto">
          {/* Gathering crowd photo (78%) */}
          <div
            onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.gatheringCrowd)}
            className={`w-full cursor-pointer transition-opacity duration-300 hover:opacity-90 shadow-2xl ${
              !isAnimationComplete ? 'film-reveal-item' : ''
            }`}
            style={{ animationDelay: '1200ms' }}
          >
            <img
              src={PHOTOBOOK_IMAGES.gatheringCrowd.src}
              alt={PHOTOBOOK_IMAGES.gatheringCrowd.alt}
              className="w-full aspect-[16/9] object-cover"
            />
          </div>
        </div>

      </div>


      {/* ========================================================================= */}
      {/* MOBILE ART DIRECTION (Dedicated, natural flow without vertical exhaustion) */}
      {/* ========================================================================= */}
      <div className="block md:hidden space-y-7">

        {/* 1. Mobile Opening: Layered 2-photo dialogue */}
        <div className="relative pb-6">
          <div
            onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.workspace)}
            className={`w-[84%] cursor-pointer shadow-md ${
              !isAnimationComplete ? 'film-reveal-item' : ''
            }`}
            style={{ animationDelay: '100ms' }}
          >
            <img
              src={PHOTOBOOK_IMAGES.workspace.src}
              alt={PHOTOBOOK_IMAGES.workspace.alt}
              className="w-full aspect-[16/10] object-cover"
            />
          </div>

          <div
            onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.camera)}
            className={`absolute -bottom-2 right-0 w-[46%] z-10 cursor-pointer shadow-xl ${
              !isAnimationComplete ? 'film-reveal-item' : ''
            }`}
            style={{ animationDelay: '220ms' }}
          >
            <img
              src={PHOTOBOOK_IMAGES.camera.src}
              alt={PHOTOBOOK_IMAGES.camera.alt}
              className="w-full aspect-[3/4] object-cover"
            />
          </div>
        </div>

        {/* 2. Right-Aligned Banquet Image */}
        <div className="w-[88%] ml-auto pt-4">
          <div
            onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.cover)}
            className={`w-full cursor-pointer shadow-md ${
              !isAnimationComplete ? 'film-reveal-item' : ''
            }`}
            style={{ animationDelay: '360ms' }}
          >
            <img
              src={PHOTOBOOK_IMAGES.cover.src}
              alt={PHOTOBOOK_IMAGES.cover.alt}
              className="w-full aspect-[16/10] object-cover"
            />
          </div>
        </div>

        {/* 3. Tilted Candid Snapshot */}
        <div className="w-[58%] -rotate-2">
          <div
            onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.coverOffset)}
            className={`w-full cursor-pointer shadow-md bg-white p-1 pb-3 ${
              !isAnimationComplete ? 'film-reveal-item' : ''
            }`}
            style={{ animationDelay: '500ms' }}
          >
            <img
              src={PHOTOBOOK_IMAGES.coverOffset.src}
              alt={PHOTOBOOK_IMAGES.coverOffset.alt}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>
        </div>

        {/* 4. Small Discovery (Right-aligned) */}
        <div className="w-[42%] ml-auto">
          <div
            onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.bonfire)}
            className={`w-full cursor-pointer shadow-sm ${
              !isAnimationComplete ? 'film-reveal-item' : ''
            }`}
            style={{ animationDelay: '640ms' }}
          >
            <img
              src={PHOTOBOOK_IMAGES.bonfire.src}
              alt={PHOTOBOOK_IMAGES.bonfire.alt}
              className="w-full aspect-square object-cover"
            />
          </div>
        </div>

        {/* 5. Full-Bleed Panorama Breakout */}
        <div className="-mx-4 py-2">
          <div
            onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.beachPanoramic)}
            className={`w-full cursor-pointer shadow-sm ${
              !isAnimationComplete ? 'film-reveal-item' : ''
            }`}
            style={{ animationDelay: '780ms' }}
          >
            <img
              src={PHOTOBOOK_IMAGES.beachPanoramic.src}
              alt={PHOTOBOOK_IMAGES.beachPanoramic.alt}
              className="w-full aspect-[21/9] object-cover"
            />
          </div>
        </div>

        {/* 6. PROMINENT CÓC STAGE PHOTO (Full width on mobile, memorable concert energy) */}
        <div className="w-full pt-2">
          <div
            onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.stage)}
            className={`w-full cursor-pointer shadow-lg ${
              !isAnimationComplete ? 'film-reveal-item' : ''
            }`}
            style={{ animationDelay: '920ms' }}
          >
            <img
              src={PHOTOBOOK_IMAGES.stage.src}
              alt={PHOTOBOOK_IMAGES.stage.alt}
              className="w-full aspect-[16/10] object-cover"
            />
          </div>
        </div>

        {/* 7. Celebration Toast Photo */}
        <div className="w-[60%] mx-auto pt-2">
          <div
            onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.celebrationToast)}
            className={`w-full cursor-pointer shadow-md ${
              !isAnimationComplete ? 'film-reveal-item' : ''
            }`}
            style={{ animationDelay: '1060ms' }}
          >
            <img
              src={PHOTOBOOK_IMAGES.celebrationToast.src}
              alt={PHOTOBOOK_IMAGES.celebrationToast.alt}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>
        </div>

        {/* 8. Climax Gathering */}
        <div className="w-full pt-4">
          <div
            onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.gatheringCrowd)}
            className={`w-full cursor-pointer shadow-lg ${
              !isAnimationComplete ? 'film-reveal-item' : ''
            }`}
            style={{ animationDelay: '1200ms' }}
          >
            <img
              src={PHOTOBOOK_IMAGES.gatheringCrowd.src}
              alt={PHOTOBOOK_IMAGES.gatheringCrowd.alt}
              className="w-full aspect-[16/9] object-cover"
            />
          </div>
        </div>

      </div>


      {/* ========================================================================= */}
      {/* GALA INVITATION KEEPSAKE TICKET                                           */}
      {/* ========================================================================= */}
      <div className="pt-16 sm:pt-24 mt-16 sm:mt-28 border-t border-csg-black/15">
        <div className="max-w-2xl mx-auto">
          
          {/* The Gala Keepsake Ticket */}
          <div className="bg-[#FFFDF8] border-2 border-csg-black p-6 sm:p-8 shadow-poster relative space-y-6">
            
            {/* Perforation Stamp */}
            <div className="flex items-center justify-between border-b-2 border-dashed border-csg-black/25 pb-3 font-mono text-[11px]">
              <span className="font-bold uppercase tracking-widest text-csg-red">
                THƯ MỜI HỘI NGỘ • KỶ NIỆM 17 NĂM
              </span>
              <span className="text-csg-black/50">
                {GALA_EVENT_DETAILS.rsvpDeadline ? `Hạn chót: ${GALA_EVENT_DETAILS.rsvpDeadline}` : '10.12.2026'}
              </span>
            </div>

            {/* Event Typography */}
            <div className="space-y-1.5">
              <h2 className="text-3xl sm:text-4xl font-display font-extrabold uppercase text-csg-black leading-[1.02] tracking-tight">
                {GALA_EVENT_DETAILS.title}
              </h2>
              <p className="font-editorial italic text-base text-csg-black/75">
                {GALA_EVENT_DETAILS.subtitle}
              </p>
            </div>

            {/* Verified Event Schedule Matrix */}
            <div className="font-mono text-xs divide-y divide-csg-black/15 py-1">
              <div className="flex justify-between py-2.5">
                <span className="text-csg-black/60 uppercase">THỜI GIAN:</span>
                <span className="font-bold text-csg-black">{GALA_EVENT_DETAILS.time}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-csg-black/60 uppercase">ĐỊA ĐIỂM:</span>
                <span className="font-bold text-csg-black text-right">{GALA_EVENT_DETAILS.venue}</span>
              </div>
            </div>

            {/* Direct Instant RSVP Action */}
            <div className="space-y-3 pt-1">
              <button
                onClick={onOpenRegister}
                className="btn-editorial-primary w-full py-4 min-h-[50px] font-display font-extrabold text-sm sm:text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-poster active:scale-[0.98]"
              >
                <span>ĐĂNG KÝ THAM GIA GALA 17Y</span>
                <ArrowRightIcon size={16} className="shrink-0" />
              </button>

              <div className="text-center font-mono text-xs pt-1">
                <span className="text-csg-black/45 text-[11px]">
                  Dành cho thành viên & cựu thành viên CSG
                </span>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* ================= MINIMAL ARCHIVAL COLOPHON ================= */}
      <div className="text-center pt-8 font-mono text-xs text-csg-black/40 uppercase tracking-widest">
        CÓC SÀI GÒN // 2009 — 2026
      </div>

      {/* ================= FULLSCREEN DARKROOM LIGHTBOX ================= */}
      {selectedPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/95 backdrop-blur-md animate-fadeIn"
          onClick={() => setSelectedPhoto(null)}
        >
          {/* Close Button */}
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30 p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center bg-[#1F1E1B] hover:bg-csg-red text-white transition-colors border border-white/10 active:scale-95"
            aria-label="Đóng xem ảnh (Esc)"
          >
            <CloseIcon size={20} />
          </button>

          {/* Photo Frame */}
          <div 
            className="relative max-w-5xl w-full max-h-[85vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedPhoto.src}
              alt={selectedPhoto.alt}
              className="max-h-[78vh] w-auto max-w-full object-contain shadow-2xl"
            />

            {/* Bottom Controls */}
            <div className="w-full max-w-xs mt-4 flex items-center justify-between text-xs font-mono text-white/70">
              <button
                onClick={handlePrev}
                className="px-3 py-2 min-h-[44px] min-w-[70px] hover:text-csg-yellow transition-colors flex items-center justify-center gap-1 active:scale-95"
                aria-label="Ảnh trước"
              >
                <ChevronLeftIcon size={16} />
                <span>TRƯỚC</span>
              </button>

              <span className="font-bold text-white/90">
                {ALL_PHOTOBOOK_IMAGES.findIndex(img => img.id === selectedPhoto.id) + 1} / {ALL_PHOTOBOOK_IMAGES.length}
              </span>

              <button
                onClick={handleNext}
                className="px-3 py-2 min-h-[44px] min-w-[70px] hover:text-csg-yellow transition-colors flex items-center justify-center gap-1 active:scale-95"
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
