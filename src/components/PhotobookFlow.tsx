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
    <div className="w-full space-y-16 sm:space-y-28 lg:space-y-36 pb-16">

      {/* ================= 1. THE OPENING COMPOSITION (MULTI-ELEMENT & LAYERED) ================= */}
      
      {/* Running archival header line */}
      <div className="flex items-baseline justify-between border-b border-csg-black/15 pb-2 font-mono text-[11px] text-csg-black/50">
        <div className="flex items-center gap-2">
          <span className="font-bold text-csg-black uppercase tracking-widest">ARCHIVE // 17Y</span>
          <span>•</span>
          <span>CÓC SÀI GÒN (2009 — 2026)</span>
        </div>
        <span className="text-csg-black/60 hidden sm:inline">
          {ALL_PHOTOBOOK_IMAGES.length} PHOTOGRAPHS
        </span>
      </div>

      {/* DESKTOP OPENING: Multi-image layered collage (No conventional banner) */}
      <div className="hidden md:block relative pt-4 pb-8">
        
        {/* Main Anchor Image (64% width, right aligned) */}
        <div className="ml-auto w-[64%] relative">
          <div
            onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.cover)}
            className="group cursor-pointer relative overflow-hidden bg-csg-muted shadow-paper-lg border border-csg-black/20 transition-transform duration-500 hover:-translate-y-1"
          >
            <img
              src={PHOTOBOOK_IMAGES.cover.src}
              alt={PHOTOBOOK_IMAGES.cover.alt}
              className="w-full aspect-[16/10] object-cover transition-transform duration-700 group-hover:scale-[1.01]"
            />
            <div className="absolute bottom-3 right-3 bg-csg-paper/90 border border-csg-black px-2 py-0.5 font-mono text-[10px] font-bold text-csg-black opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shadow-sm">
              <ZoomIn className="w-3 h-3 text-csg-red" />
              <span>PHÓNG TO</span>
            </div>
            <div className="absolute top-3 left-3 bg-csg-black/75 text-white px-1.5 py-0.5 font-mono text-[9px] tracking-widest">
              {PHOTOBOOK_IMAGES.cover.archiveCode}
            </div>
          </div>
        </div>

        {/* Embedded Typography & Quick Registration Pill (Positioned in left negative space) */}
        <div className="absolute top-2 left-0 w-[42%] z-10 space-y-4">
          <div className="space-y-1.5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-csg-black/45 block font-bold">
              TƯ LIỆU HÌNH ẢNH KỶ NIỆM
            </span>
            <h1 className="font-display font-extrabold text-4xl lg:text-5xl uppercase tracking-tight text-csg-black leading-[0.92]">
              CÓC SÀI GÒN <br />
              <span className="font-editorial italic font-normal text-csg-red text-5xl lg:text-6xl lowercase">
                17 năm.
              </span>
            </h1>
          </div>

          <div className="pt-2">
            <button
              onClick={onOpenRegister}
              className="btn-editorial-primary px-5 py-3 font-display font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 shadow-poster"
            >
              <span>ĐĂNG KÝ VÉ GALA 17Y</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Overlapping Candid Snapshot (Offset over the lower-left corner of the anchor photo) */}
        <div 
          onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.coverOffset)}
          className="group cursor-pointer absolute -bottom-10 left-[26%] w-[27%] z-20 bg-white p-2 pb-5 border border-csg-black/30 shadow-paper-lg -rotate-2 hover:rotate-0 transition-transform duration-300"
        >
          <div className="overflow-hidden bg-csg-muted">
            <img
              src={PHOTOBOOK_IMAGES.coverOffset.src}
              alt={PHOTOBOOK_IMAGES.coverOffset.alt}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>
          <div className="pt-1.5 flex items-center justify-between font-mono text-[9px] text-csg-black/40 px-0.5">
            <span>{PHOTOBOOK_IMAGES.coverOffset.archiveCode}</span>
            <ZoomIn className="w-2.5 h-2.5 text-csg-red opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Intimate Vertical Photo (Tucked at lower left corner) */}
        <div
          onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.camera)}
          className="group cursor-pointer absolute top-[210px] left-0 w-[22%] z-10 overflow-hidden bg-csg-muted shadow-md border border-csg-black/20 hover:-translate-y-1 transition-transform duration-300"
        >
          <img
            src={PHOTOBOOK_IMAGES.camera.src}
            alt={PHOTOBOOK_IMAGES.camera.alt}
            className="w-full aspect-[3/4] object-cover"
          />
          <div className="absolute top-2 left-2 bg-csg-black/70 text-white px-1 py-0.5 font-mono text-[8px]">
            {PHOTOBOOK_IMAGES.camera.archiveCode}
          </div>
        </div>

      </div>

      {/* MOBILE OPENING: Specially tailored compact 2-image montage */}
      <div className="block md:hidden relative pt-2">
        
        {/* Title */}
        <div className="space-y-1 mb-4">
          <span className="font-mono text-[10px] uppercase tracking-widest text-csg-black/45 block font-bold">
            TƯ LIỆU HÌNH ẢNH KỶ NIỆM
          </span>
          <h1 className="font-display font-extrabold text-3xl uppercase tracking-tight text-csg-black leading-[0.95]">
            CÓC SÀI GÒN <span className="font-editorial italic font-normal text-csg-red text-4xl lowercase">17 năm</span>
          </h1>
        </div>

        {/* Layered Mobile Photo Pair */}
        <div className="relative pb-10">
          {/* Main Photo */}
          <div
            onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.cover)}
            className="w-[86%] overflow-hidden bg-csg-muted shadow-md border border-csg-black/20"
          >
            <img
              src={PHOTOBOOK_IMAGES.cover.src}
              alt={PHOTOBOOK_IMAGES.cover.alt}
              className="w-full aspect-[16/10] object-cover"
            />
          </div>

          {/* Overlapping Candid Snapshot */}
          <div
            onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.coverOffset)}
            className="absolute bottom-0 right-0 w-[54%] bg-white p-1.5 pb-3 border border-csg-black/30 shadow-paper-lg -rotate-2 z-10"
          >
            <img
              src={PHOTOBOOK_IMAGES.coverOffset.src}
              alt={PHOTOBOOK_IMAGES.coverOffset.alt}
              className="w-full aspect-[4/3] object-cover"
            />
            <div className="pt-1 font-mono text-[8px] text-csg-black/40 text-right">
              {PHOTOBOOK_IMAGES.coverOffset.archiveCode}
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="pt-2">
          <button
            onClick={onOpenRegister}
            className="btn-editorial-primary w-full py-3 font-display font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-poster"
          >
            <span>ĐĂNG KÝ VÉ GALA 17Y</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>


      {/* ================= 2. CONTINUOUS VISUAL COMPOSITION (VARIED RHYTHM, NO RIGID SPREADS) ================= */}

      {/* --- MOMENTUM 1: Asymmetric Right Shift (Workspace) --- */}
      <div className="relative">
        <div className="md:ml-auto md:w-[68%]">
          <div
            onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.workspace)}
            className="group cursor-pointer relative overflow-hidden bg-csg-muted shadow-paper-lg border border-csg-black/20 transition-transform duration-500 hover:-translate-y-1"
          >
            <img
              src={PHOTOBOOK_IMAGES.workspace.src}
              alt={PHOTOBOOK_IMAGES.workspace.alt}
              className="w-full aspect-[16/10] object-cover transition-transform duration-700 group-hover:scale-[1.01]"
            />
            <div className="absolute bottom-3 right-3 bg-csg-paper/90 border border-csg-black px-2 py-0.5 font-mono text-[10px] font-bold text-csg-black opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shadow-sm">
              <ZoomIn className="w-3 h-3 text-csg-red" />
              <span>PHÓNG TO</span>
            </div>
            <div className="absolute top-3 left-3 bg-csg-black/75 text-white px-1.5 py-0.5 font-mono text-[9px] tracking-widest">
              {PHOTOBOOK_IMAGES.workspace.archiveCode}
            </div>
          </div>
          <div className="pt-2 flex items-center justify-between font-mono text-[10px] text-csg-black/40">
            <span>[ ARCHIVE REF ]</span>
            <span>04 / {ALL_PHOTOBOOK_IMAGES.length}</span>
          </div>
        </div>
      </div>

      {/* --- MOMENTUM 2: Staggered Pair with Contrasting Scales (Bonfire + Stage) --- */}
      {/* Desktop: Asymmetric contrast (Intimate square on left, energetic wide on right offset down) */}
      <div className="hidden md:flex items-start gap-8 lg:gap-14">
        
        {/* Left: Intimate square crop (36% width) */}
        <div className="w-[36%] pt-8">
          <div
            onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.bonfire)}
            className="group cursor-pointer relative overflow-hidden bg-csg-muted shadow-paper-lg border border-csg-black/20 transition-transform duration-500 hover:-translate-y-1"
          >
            <img
              src={PHOTOBOOK_IMAGES.bonfire.src}
              alt={PHOTOBOOK_IMAGES.bonfire.alt}
              className="w-full aspect-square object-cover transition-transform duration-700 group-hover:scale-[1.01]"
            />
            <div className="absolute bottom-3 right-3 bg-csg-paper/90 border border-csg-black px-2 py-0.5 font-mono text-[10px] font-bold text-csg-black opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shadow-sm">
              <ZoomIn className="w-3 h-3 text-csg-red" />
              <span>PHÓNG TO</span>
            </div>
            <div className="absolute top-3 left-3 bg-csg-black/75 text-white px-1.5 py-0.5 font-mono text-[9px] tracking-widest">
              {PHOTOBOOK_IMAGES.bonfire.archiveCode}
            </div>
          </div>
          <div className="pt-2 font-mono text-[10px] text-csg-black/40">
            05 / {ALL_PHOTOBOOK_IMAGES.length}
          </div>
        </div>

        {/* Right: Energetic landscape (64% width, staggered down) */}
        <div className="w-[64%] pt-20">
          <div
            onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.stage)}
            className="group cursor-pointer relative overflow-hidden bg-csg-muted shadow-paper-lg border border-csg-black/20 transition-transform duration-500 hover:-translate-y-1"
          >
            <img
              src={PHOTOBOOK_IMAGES.stage.src}
              alt={PHOTOBOOK_IMAGES.stage.alt}
              className="w-full aspect-[16/10] object-cover transition-transform duration-700 group-hover:scale-[1.01]"
            />
            <div className="absolute bottom-3 right-3 bg-csg-paper/90 border border-csg-black px-2 py-0.5 font-mono text-[10px] font-bold text-csg-black opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shadow-sm">
              <ZoomIn className="w-3 h-3 text-csg-red" />
              <span>PHÓNG TO</span>
            </div>
            <div className="absolute top-3 left-3 bg-csg-black/75 text-white px-1.5 py-0.5 font-mono text-[9px] tracking-widest">
              {PHOTOBOOK_IMAGES.stage.archiveCode}
            </div>
          </div>
          <div className="pt-2 font-mono text-[10px] text-csg-black/40 text-right">
            06 / {ALL_PHOTOBOOK_IMAGES.length}
          </div>
        </div>

      </div>

      {/* Mobile: Side-by-side staggered pair (Not stacked vertically, saves scroll fatigue!) */}
      <div className="flex md:hidden items-start gap-3">
        <div className="w-[46%]">
          <div
            onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.bonfire)}
            className="overflow-hidden bg-csg-muted shadow-sm border border-csg-black/20"
          >
            <img
              src={PHOTOBOOK_IMAGES.bonfire.src}
              alt={PHOTOBOOK_IMAGES.bonfire.alt}
              className="w-full aspect-square object-cover"
            />
          </div>
          <div className="pt-1 font-mono text-[8px] text-csg-black/40">
            {PHOTOBOOK_IMAGES.bonfire.archiveCode}
          </div>
        </div>

        <div className="w-[54%] pt-6">
          <div
            onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.stage)}
            className="overflow-hidden bg-csg-muted shadow-sm border border-csg-black/20"
          >
            <img
              src={PHOTOBOOK_IMAGES.stage.src}
              alt={PHOTOBOOK_IMAGES.stage.alt}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>
          <div className="pt-1 font-mono text-[8px] text-csg-black/40 text-right">
            {PHOTOBOOK_IMAGES.stage.archiveCode}
          </div>
        </div>
      </div>

      {/* --- MOMENTUM 3: Cinematic Panoramic Bleed (Beach Horizon) --- */}
      <div className="relative">
        <div
          onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.beachPanoramic)}
          className="group cursor-pointer relative overflow-hidden bg-csg-muted shadow-paper-lg border border-csg-black/20 transition-transform duration-500 hover:-translate-y-1"
        >
          <img
            src={PHOTOBOOK_IMAGES.beachPanoramic.src}
            alt={PHOTOBOOK_IMAGES.beachPanoramic.alt}
            className="w-full aspect-[16/8] sm:aspect-[21/9] object-cover transition-transform duration-700 group-hover:scale-[1.01]"
          />
          <div className="absolute bottom-3 right-3 bg-csg-paper/90 border border-csg-black px-2.5 py-1 font-mono text-[10px] font-bold text-csg-black opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shadow-sm">
            <ZoomIn className="w-3.5 h-3.5 text-csg-red" />
            <span>PHÓNG TO TOÀN CẢNH</span>
          </div>
          <div className="absolute top-3 left-3 bg-csg-black/75 text-white px-1.5 py-0.5 font-mono text-[9px] tracking-widest">
            {PHOTOBOOK_IMAGES.beachPanoramic.archiveCode}
          </div>
        </div>
        <div className="pt-2 flex items-center justify-between font-mono text-[10px] text-csg-black/40">
          <span>PANORAMA ARCHIVE</span>
          <span>07 / {ALL_PHOTOBOOK_IMAGES.length}</span>
        </div>
      </div>

      {/* --- MOMENTUM 4: Quiet Inset & Ensemble Culmination (Celebration Toast & Gathering Crowd) --- */}
      <div className="space-y-12 sm:space-y-20">
        
        {/* Inset Photo (46% width on desktop, 82% on mobile) */}
        <div className="w-[82%] sm:w-[46%] sm:ml-8 lg:ml-16">
          <div
            onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.celebrationToast)}
            className="group cursor-pointer relative overflow-hidden bg-csg-muted shadow-paper-lg border border-csg-black/20 transition-transform duration-500 hover:-translate-y-1"
          >
            <img
              src={PHOTOBOOK_IMAGES.celebrationToast.src}
              alt={PHOTOBOOK_IMAGES.celebrationToast.alt}
              className="w-full aspect-[4/3] object-cover transition-transform duration-700 group-hover:scale-[1.01]"
            />
            <div className="absolute bottom-3 right-3 bg-csg-paper/90 border border-csg-black px-2 py-0.5 font-mono text-[10px] font-bold text-csg-black opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shadow-sm">
              <ZoomIn className="w-3 h-3 text-csg-red" />
              <span>PHÓNG TO</span>
            </div>
            <div className="absolute top-3 left-3 bg-csg-black/75 text-white px-1.5 py-0.5 font-mono text-[9px] tracking-widest">
              {PHOTOBOOK_IMAGES.celebrationToast.archiveCode}
            </div>
          </div>
          <div className="pt-1.5 font-mono text-[10px] text-csg-black/40">
            08 / {ALL_PHOTOBOOK_IMAGES.length}
          </div>
        </div>

        {/* Grand Ensemble Photograph (78% width on desktop, 96% on mobile, aligned right) */}
        <div className="w-[96%] sm:w-[78%] ml-auto">
          <div
            onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.gatheringCrowd)}
            className="group cursor-pointer relative overflow-hidden bg-csg-muted shadow-paper-lg border border-csg-black/20 transition-transform duration-500 hover:-translate-y-1"
          >
            <img
              src={PHOTOBOOK_IMAGES.gatheringCrowd.src}
              alt={PHOTOBOOK_IMAGES.gatheringCrowd.alt}
              className="w-full aspect-[16/9] object-cover transition-transform duration-700 group-hover:scale-[1.01]"
            />
            <div className="absolute bottom-3 right-3 bg-csg-paper/90 border border-csg-black px-2 py-0.5 font-mono text-[10px] font-bold text-csg-black opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shadow-sm">
              <ZoomIn className="w-3 h-3 text-csg-red" />
              <span>PHÓNG TO</span>
            </div>
            <div className="absolute top-3 left-3 bg-csg-black/75 text-white px-1.5 py-0.5 font-mono text-[9px] tracking-widest">
              {PHOTOBOOK_IMAGES.gatheringCrowd.archiveCode}
            </div>
          </div>
          <div className="pt-1.5 flex items-center justify-between font-mono text-[10px] text-csg-black/40">
            <span>CÓC SÀI GÒN // TẬP THỂ</span>
            <span>09 / {ALL_PHOTOBOOK_IMAGES.length}</span>
          </div>
        </div>

      </div>


      {/* ================= 3. GALA INVITATION TICKET & SỔ LƯU BÚT ================= */}
      <div className="pt-8 sm:pt-14 border-t border-csg-black/20">
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
                  Gửi một lời chúc đến Cóc Sài Gòn
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
                    placeholder="Gửi gắm đến Cóc Sài Gòn..."
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
      </div>

      {/* ================= 4. MINIMAL ARCHIVAL COLOPHON ================= */}
      <div className="text-center space-y-1 pt-4 font-mono text-xs text-csg-black/40 uppercase tracking-widest">
        <div>CÓC SÀI GÒN // 2009 — 2026</div>
        <div className="text-[10px]">17 NĂM MỘT MÁI NHÀ</div>
      </div>

      {/* ================= 5. FULLSCREEN DARKROOM LIGHTBOX ================= */}
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
                {selectedPhoto.archiveCode} • {ALL_PHOTOBOOK_IMAGES.findIndex(img => img.id === selectedPhoto.id) + 1} / {ALL_PHOTOBOOK_IMAGES.length}
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
