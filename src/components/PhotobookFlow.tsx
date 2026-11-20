import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ArrowRight } from 'lucide-react';
import { PHOTOBOOK_IMAGES, ALL_PHOTOBOOK_IMAGES, PhotobookImage, GALA_EVENT_DETAILS } from '../data/photobookData';

interface PhotobookFlowProps {
  onOpenRegister: () => void;
  onOpenLookup: () => void;
  onWishSubmit: (author: string, content: string) => Promise<void>;
  wishSubmitted: boolean;
}

export const PhotobookFlow: React.FC<PhotobookFlowProps> = ({
  onOpenRegister,
  onOpenLookup,
  onWishSubmit,
  wishSubmitted
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<PhotobookImage | null>(null);
  const [wishAuthor, setWishAuthor] = useState('');
  const [wishContent, setWishContent] = useState('');
  const [isSubmittingWish, setIsSubmittingWish] = useState(false);

  // Lightbox keyboard navigation & scroll lock
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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishContent.trim()) return;
    setIsSubmittingWish(true);
    try {
      await onWishSubmit(wishAuthor.trim(), wishContent.trim());
      setWishAuthor('');
      setWishContent('');
    } finally {
      setIsSubmittingWish(false);
    }
  };

  return (
    <div className="w-full space-y-24 sm:space-y-40 pb-20">

      {/* ================= A. OPENING: IMMERSIVE VISUAL ARCHIVE ================= */}
      <section className="relative pt-2 sm:pt-6">
        
        {/* Subtle Running Archive Header */}
        <div className="flex items-baseline justify-between border-b border-csg-black/15 pb-2.5 mb-8 font-mono text-[11px] text-csg-black/50">
          <div className="flex items-center gap-3">
            <span className="font-bold text-csg-black uppercase tracking-widest">ARCHIVE // NO. 17</span>
            <span>•</span>
            <span>CÓC SÀI GÒN (2009 — 2026)</span>
          </div>
          <span className="italic font-editorial text-csg-black/70 hidden sm:inline">
            "Some memories never leave."
          </span>
        </div>

        {/* Master Opening Photographic Composition (Overlapping & Off-center) */}
        <div className="relative">
          
          {/* Dominant Panoramic Photograph */}
          <div 
            onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.cover)}
            className="group cursor-pointer relative max-w-5xl overflow-hidden bg-csg-muted shadow-paper-lg transition-transform duration-500 hover:-translate-y-1"
          >
            <img
              src={PHOTOBOOK_IMAGES.cover.src}
              alt={PHOTOBOOK_IMAGES.cover.alt}
              className="w-full aspect-[16/9] sm:aspect-[21/10] object-cover transition-transform duration-700 group-hover:scale-[1.01]"
            />
            <div className="absolute bottom-3 right-3 bg-csg-paper/90 border border-csg-black px-2 py-0.5 font-mono text-[10px] font-bold text-csg-black opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shadow-sm">
              <ZoomIn className="w-3 h-3 text-csg-red" />
              <span>PHÓNG TO</span>
            </div>
          </div>

          {/* Overlapping Candid Snapshot (Offset Lower-Right) */}
          <div 
            onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.coverOffset)}
            className="group cursor-pointer hidden md:block absolute -bottom-10 right-4 lg:right-12 w-64 lg:w-72 bg-white p-2 pb-6 shadow-paper-lg border border-csg-black/30 -rotate-2 hover:rotate-0 transition-transform duration-300 z-20"
          >
            <div className="overflow-hidden bg-csg-muted">
              <img
                src={PHOTOBOOK_IMAGES.coverOffset.src}
                alt={PHOTOBOOK_IMAGES.coverOffset.alt}
                className="w-full aspect-[4/3] object-cover"
              />
            </div>
            <p className="font-editorial italic text-xs text-csg-black/75 pt-2 text-center">
              "Những nụ cười đồng đội."
            </p>
          </div>

          {/* Opening Typography Imprint & Action Pill */}
          <div className="pt-6 sm:pt-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-1.5 max-w-xl">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-extrabold uppercase tracking-tight text-csg-black leading-[0.95]">
                NHỮNG NĂM THÁNG <br />
                <span className="font-editorial italic font-normal text-csg-red text-4xl sm:text-6xl lg:text-7xl">
                  Mình Đã Cùng Nhau.
                </span>
              </h1>
              <p className="font-mono text-xs sm:text-sm text-csg-black/60 pt-1">
                Cuốn photobook kỷ niệm 17 năm sắc áo vàng Cóc Sài Gòn.
              </p>
            </div>

            {/* Discoverable RSVP Ticket Pill */}
            <div className="shrink-0 pt-2 md:pt-0">
              <button
                onClick={onOpenRegister}
                className="btn-editorial-primary px-6 py-3.5 font-display font-extrabold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 shadow-poster"
              >
                <span>ĐĂNG KÝ VÉ GALA 17Y</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

      </section>

      {/* ================= B. PHOTOBOOK FLOW: THE CONTINUOUS EDITORIAL ARCHIVE ================= */}

      {/* SPREAD 1: The Solitary Pause & Negative Space */}
      <section className="relative py-4 sm:py-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          
          {/* Vertical Print (Positioned with Intentional Left Offset) */}
          <div className="md:col-start-2 md:col-span-5">
            <div 
              onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.camera)}
              className="group cursor-pointer relative overflow-hidden bg-csg-muted shadow-paper-lg transition-transform duration-500 hover:-translate-y-1"
            >
              <img
                src={PHOTOBOOK_IMAGES.camera.src}
                alt={PHOTOBOOK_IMAGES.camera.alt}
                className="w-full aspect-[3/4] object-cover transition-transform duration-700 group-hover:scale-[1.01]"
              />
              <div className="absolute bottom-3 right-3 bg-csg-paper/90 border border-csg-black px-2 py-0.5 font-mono text-[10px] font-bold text-csg-black opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shadow-sm">
                <ZoomIn className="w-3 h-3 text-csg-red" />
                <span>XEM ẢNH</span>
              </div>
            </div>
          </div>

          {/* Generous Negative Space & Whispering Archive Marker */}
          <div className="md:col-start-8 md:col-span-4 space-y-3 md:pl-2">
            <span className="font-mono text-[11px] text-csg-black/40 uppercase tracking-widest block font-bold">
              KÝ ỨC // 01
            </span>
            <p className="font-editorial italic text-2xl sm:text-3xl text-csg-black/80 leading-snug">
              "Chiếc máy ảnh mượn và những ngày rong ruổi sân trường không biết mệt."
            </p>
          </div>

        </div>
      </section>

      {/* SPREAD 2: Asymmetric Diptych (Contrasting Scales) */}
      <section className="relative">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-12 items-end">
          
          {/* Left Horizontal Print (7 cols) */}
          <div className="md:col-span-7">
            <div 
              onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.workspace)}
              className="group cursor-pointer relative overflow-hidden bg-csg-muted shadow-paper-lg transition-transform duration-500 hover:-translate-y-1"
            >
              <img
                src={PHOTOBOOK_IMAGES.workspace.src}
                alt={PHOTOBOOK_IMAGES.workspace.alt}
                className="w-full aspect-[16/10] object-cover transition-transform duration-700 group-hover:scale-[1.01]"
              />
              <div className="absolute bottom-3 right-3 bg-csg-paper/90 border border-csg-black px-2 py-0.5 font-mono text-[10px] font-bold text-csg-black opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shadow-sm">
                <ZoomIn className="w-3 h-3 text-csg-red" />
                <span>XEM ẢNH</span>
              </div>
            </div>
            <div className="pt-2 font-mono text-[11px] text-csg-black/50">
              Sài Gòn // Đêm dựng tin bài bên nhau.
            </div>
          </div>

          {/* Right Square Campfire Offset Lower (5 cols) */}
          <div className="md:col-span-5 md:pb-6">
            <div 
              onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.bonfire)}
              className="group cursor-pointer relative overflow-hidden bg-csg-muted shadow-paper-lg transition-transform duration-500 hover:-translate-y-1"
            >
              <img
                src={PHOTOBOOK_IMAGES.bonfire.src}
                alt={PHOTOBOOK_IMAGES.bonfire.alt}
                className="w-full aspect-square object-cover transition-transform duration-700 group-hover:scale-[1.01]"
              />
              <div className="absolute bottom-3 right-3 bg-csg-paper/90 border border-csg-black px-2 py-0.5 font-mono text-[10px] font-bold text-csg-black opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shadow-sm">
                <ZoomIn className="w-3 h-3 text-csg-red" />
                <span>XEM ẢNH</span>
              </div>
            </div>
            <div className="pt-2 font-mono text-[11px] text-csg-black/50 text-right">
              Tàn tro bay nhưng lòng vẫn ấm.
            </div>
          </div>

        </div>
      </section>

      {/* SPREAD 3: Full-Bleed Panoramic Horizon */}
      <section className="relative">
        <div 
          onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.beachPanoramic)}
          className="group cursor-pointer relative overflow-hidden bg-csg-muted shadow-paper-lg transition-transform duration-500 hover:-translate-y-1"
        >
          <img
            src={PHOTOBOOK_IMAGES.beachPanoramic.src}
            alt={PHOTOBOOK_IMAGES.beachPanoramic.alt}
            className="w-full aspect-[16/8] sm:aspect-[21/8] object-cover transition-transform duration-700 group-hover:scale-[1.01]"
          />
          <div className="absolute bottom-4 right-4 bg-csg-paper/90 border border-csg-black px-2.5 py-1 font-mono text-[11px] font-bold text-csg-black opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shadow-sm">
            <ZoomIn className="w-3.5 h-3.5 text-csg-red" />
            <span>XEM RÕ TOÀN CẢNH</span>
          </div>
        </div>
        <div className="pt-2.5 flex items-baseline justify-between font-mono text-[11px] text-csg-black/50 px-1">
          <span>NHỮNG CHUYẾN XE NỐI DÀI TÌNH ANH EM</span>
          <span className="hidden sm:inline">TEAMBUILDING TRUYỀN THỐNG</span>
        </div>
      </section>

      {/* SPREAD 4: Triad Montage (Staggered Scatter) */}
      <section className="relative">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-10 items-center">
          
          {/* Stage Lights (6 cols) */}
          <div className="md:col-span-6">
            <div 
              onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.stage)}
              className="group cursor-pointer relative overflow-hidden bg-csg-muted shadow-paper-lg transition-transform duration-500 hover:-translate-y-1"
            >
              <img
                src={PHOTOBOOK_IMAGES.stage.src}
                alt={PHOTOBOOK_IMAGES.stage.alt}
                className="w-full aspect-[16/10] object-cover transition-transform duration-700 group-hover:scale-[1.01]"
              />
              <div className="absolute bottom-3 right-3 bg-csg-paper/90 border border-csg-black px-2 py-0.5 font-mono text-[10px] font-bold text-csg-black opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shadow-sm">
                <ZoomIn className="w-3 h-3 text-csg-red" />
                <span>XEM ẢNH</span>
              </div>
            </div>
          </div>

          {/* Toast and Crowd (6 cols, staggered down) */}
          <div className="md:col-span-6 md:pt-12">
            <div 
              onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.celebrationToast)}
              className="group cursor-pointer relative overflow-hidden bg-csg-muted shadow-paper-lg transition-transform duration-500 hover:-translate-y-1"
            >
              <img
                src={PHOTOBOOK_IMAGES.celebrationToast.src}
                alt={PHOTOBOOK_IMAGES.celebrationToast.alt}
                className="w-full aspect-[4/3] object-cover transition-transform duration-700 group-hover:scale-[1.01]"
              />
              <div className="absolute bottom-3 right-3 bg-csg-paper/90 border border-csg-black px-2 py-0.5 font-mono text-[10px] font-bold text-csg-black opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shadow-sm">
                <ZoomIn className="w-3 h-3 text-csg-red" />
                <span>XEM ẢNH</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* SPREAD 5: The Grand Warmth of All Generations */}
      <section className="relative">
        <div 
          onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.gatheringCrowd)}
          className="group cursor-pointer max-w-5xl mx-auto relative overflow-hidden bg-csg-muted shadow-paper-lg transition-transform duration-500 hover:-translate-y-1"
        >
          <img
            src={PHOTOBOOK_IMAGES.gatheringCrowd.src}
            alt={PHOTOBOOK_IMAGES.gatheringCrowd.alt}
            className="w-full aspect-[16/9] object-cover transition-transform duration-700 group-hover:scale-[1.01]"
          />
          <div className="absolute bottom-3 right-3 bg-csg-paper/90 border border-csg-black px-2 py-0.5 font-mono text-[10px] font-bold text-csg-black opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shadow-sm">
            <ZoomIn className="w-3 h-3 text-csg-red" />
            <span>XEM ẢNH</span>
          </div>
        </div>
        <p className="font-editorial italic text-center text-lg sm:text-xl text-csg-black/80 pt-4">
          "Nơi những người xa lạ trở thành anh em một mái nhà."
        </p>
      </section>

      {/* ================= C & D. GALA DETAILS & REGISTRATION INVITATION ================= */}
      <section className="relative pt-8 sm:pt-14 border-t border-csg-black/20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* The Gala Keepsake Ticket (7 cols) */}
          <div className="lg:col-span-7">
            <div className="bg-[#FFFDF8] border-2 border-csg-black p-6 sm:p-8 shadow-poster relative space-y-6">
              
              {/* Perforation Stamp */}
              <div className="flex items-center justify-between border-b-2 border-dashed border-csg-black/25 pb-3 font-mono text-[11px]">
                <span className="font-bold uppercase tracking-widest text-csg-red">
                  THƯ MỜI HỘI NGỘ • KỶ NIỆM 17 NĂM
                </span>
                <span className="text-csg-black/50">
                  {GALA_EVENT_DETAILS.rsvpDeadline ? `Hạn chót: ${GALA_EVENT_DETAILS.rsvpDeadline}` : '19.12.2026'}
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

              {/* Clean Event Schedule Matrix */}
              <div className="font-mono text-xs divide-y divide-csg-black/15 py-1">
                <div className="flex justify-between py-2.5">
                  <span className="text-csg-black/60 uppercase">THỜI GIAN:</span>
                  <span className="font-bold text-csg-black">{GALA_EVENT_DETAILS.time}</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-csg-black/60 uppercase">ĐỊA ĐIỂM:</span>
                  <span className="font-bold text-csg-black text-right">{GALA_EVENT_DETAILS.venue}</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-csg-black/60 uppercase">TRANG PHỤC:</span>
                  <span className="font-bold text-csg-black">{GALA_EVENT_DETAILS.dressCode}</span>
                </div>
              </div>

              {/* Direct Instant RSVP Action */}
              <div className="space-y-3 pt-1">
                <button
                  onClick={onOpenRegister}
                  className="btn-editorial-primary w-full py-4 font-display font-extrabold text-sm sm:text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-poster"
                >
                  <span>ĐĂNG KÝ THAM GIA GALA 17Y</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="flex items-center justify-between font-mono text-xs pt-1">
                  <button
                    onClick={onOpenLookup}
                    className="text-csg-black/65 hover:text-csg-red underline decoration-1 underline-offset-4 transition-colors"
                  >
                    Tra cứu vé đã đặt →
                  </button>
                  <span className="text-csg-black/45 text-[11px]">
                    Dành cho thành viên & cựu thành viên CSG
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Sổ Lưu Bút Memo Card (5 cols) */}
          <div className="lg:col-span-5">
            <div className="bg-[#FFFDF8] border-2 border-csg-black p-6 sm:p-7 shadow-poster relative space-y-4">
              
              <div className="space-y-1">
                <span className="font-mono text-[11px] font-bold text-csg-red uppercase tracking-widest block">
                  SỔ LƯU BÚT // 17 NĂM
                </span>
                <h3 className="text-xl sm:text-2xl font-display font-extrabold uppercase text-csg-black">
                  Để lại một dòng cho những năm tháng này
                </h3>
              </div>

              {wishSubmitted ? (
                <div className="p-4 bg-csg-surface border border-csg-black font-mono text-xs text-csg-black flex items-center justify-center gap-2">
                  <span>✓ Cảm ơn bạn. Lời chúc đã được lưu lại trong cuốn sổ kỷ yếu 17 năm!</span>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Tên / Khóa (VD: Anh Phát K12)"
                    value={wishAuthor}
                    onChange={(e) => setWishAuthor(e.target.value)}
                    className="w-full px-3 py-2.5 bg-csg-paper border border-csg-black/40 text-xs font-mono outline-none focus:border-csg-black focus:bg-white transition-colors"
                    required
                  />
                  <textarea
                    rows={2}
                    placeholder="Một dòng gửi gắm đến Cóc Sài Gòn..."
                    value={wishContent}
                    onChange={(e) => setWishContent(e.target.value)}
                    className="w-full px-3 py-2.5 bg-csg-paper border border-csg-black/40 text-xs font-mono outline-none focus:border-csg-black focus:bg-white resize-none transition-colors"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingWish}
                    className="w-full py-2.5 bg-csg-black text-csg-yellow font-mono text-xs font-bold uppercase tracking-wider hover:bg-csg-red hover:text-white transition-colors disabled:opacity-50"
                  >
                    {isSubmittingWish ? 'ĐANG GỬI...' : 'ĐÓNG DẤU LƯU BÚT 17Y →'}
                  </button>
                </form>
              )}

            </div>
          </div>

        </div>
      </section>

      {/* ================= E. CLOSING: CLOSING THE PHYSICAL ALBUM ================= */}
      <section className="relative text-center space-y-2 pt-6">
        <span className="font-mono text-xs uppercase tracking-widest text-csg-black/40 block">
          CÓC SÀI GÒN // 2009 — 2026
        </span>
        <p className="font-editorial italic text-lg sm:text-xl text-csg-black/75">
          "17 năm qua những lăng kính, hẹn gặp lại nhau tại đêm tiệc."
        </p>
      </section>

      {/* ================= FULLSCREEN DARKROOM LIGHTBOX ================= */}
      {selectedPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-[#11100E]/95 backdrop-blur-md animate-fadeIn"
          onClick={() => setSelectedPhoto(null)}
        >
          {/* Close Button */}
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-6 right-6 z-30 p-2.5 bg-[#201E1A] hover:bg-csg-red text-[#F4EEDF] transition-colors border border-white/10"
            aria-label="Đóng xem ảnh (Esc)"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Photo Frame */}
          <div 
            className="relative max-w-5xl w-full max-h-[85vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedPhoto.src}
              alt={selectedPhoto.alt}
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

              <span className="text-[#DCD5C4]/70">
                {ALL_PHOTOBOOK_IMAGES.findIndex(img => img.id === selectedPhoto.id) + 1} / {ALL_PHOTOBOOK_IMAGES.length}
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

    </div>
  );
};
