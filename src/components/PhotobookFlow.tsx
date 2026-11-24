import React, { useState, useEffect, useCallback } from 'react';
import { CloseIcon, ChevronLeftIcon, ChevronRightIcon, ArrowRightIcon, FrogIcon, HeartIcon } from 'naive-icons';
import { PHOTOBOOK_IMAGES, ALL_PHOTOBOOK_IMAGES, PhotobookImage, GALA_EVENT_DETAILS } from '../data/photobookData';

interface PhotobookFlowProps {
  onOpenRegister: () => void;
  onOpenLookup: () => void;
  onOpenStage?: () => void;
  totalWishesCount?: number;
  onWishSubmit?: (author: string, content: string) => Promise<void>;
  wishSubmitted?: boolean;
}

export const PhotobookFlow: React.FC<PhotobookFlowProps> = ({
  onOpenRegister,
  onOpenLookup,
  onOpenStage,
  totalWishesCount = 15,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<PhotobookImage | null>(null);
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);

  // Cinematic film-reveal entrance animation coordinator
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsAnimationComplete(true);
      return;
    }

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
    <div className="w-full pb-12 sm:pb-16 font-body">

      {/* ================= EDITORIAL EXHIBITION PROLOGUE ================= */}
      <section className="border-b border-csg-black/15 pb-4 mb-8 sm:mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded-xs bg-csg-yellow text-csg-black font-mono font-bold text-[10px] uppercase tracking-wider shadow-xs">
                GÓC KỶ NIỆM • 2009 — 2026
              </span>
              <span className="font-mono text-xs text-csg-black/60 hidden sm:inline">
                9 KHOẢNH KHẮC • 17 NĂM MỘT MÁI NHÀ
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-extrabold uppercase text-csg-black tracking-tight leading-tight">
              MƯỜI BẢY NĂM — HÀNH TRÌNH TỤI MÌNH LỚN
            </h1>
          </div>
          <div className="flex items-center gap-3 font-mono text-xs shrink-0">
            <button
              onClick={onOpenRegister}
              className="btn-editorial-primary px-3.5 py-2 text-xs font-display font-bold uppercase tracking-wider flex items-center gap-1.5 active:scale-95 shadow-sm min-h-[44px]"
            >
              <span>ĐĂNG KÝ GALA 17Y</span>
              <ArrowRightIcon size={14} className="shrink-0" />
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* DESKTOP & TABLET ART DIRECTION (Balanced, dense, editorial spreads)        */}
      {/* ========================================================================= */}
      <div className="hidden md:block space-y-12 lg:space-y-16">

        {/* ---------------- SPREAD 01: KHỞI NGUYÊN & TIẾP NỐI ---------------- */}
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b border-csg-black/15 pb-2 font-mono text-xs">
            <span className="font-bold uppercase tracking-wider text-csg-black/80">
              CHƯƠNG I: NHỮNG NGÀY BÊN NHAU
            </span>
            <span className="text-csg-black/40 text-[11px]">
              KỶ NIỆM 2021 — 2023
            </span>
          </div>

          <div className="grid grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Major Feature with Overlapping Polaroid (Col 7) */}
            <div className="col-span-7 relative flex flex-col">
              {/* Primary Plate Card */}
              <div
                onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.cover)}
                className={`paper-sheet p-2 sm:p-2.5 pb-3 sm:pb-3.5 cursor-pointer transition-all duration-300 hover:shadow-poster active:scale-[0.99] flex flex-col ${!isAnimationComplete ? 'film-reveal-item' : ''
                  }`}
                style={{ animationDelay: '100ms' }}
              >
                <div className="overflow-hidden bg-csg-black/5">
                  <img
                    src={PHOTOBOOK_IMAGES.cover.src}
                    alt={PHOTOBOOK_IMAGES.cover.alt}
                    className="w-full aspect-[16/10] object-cover transition-transform duration-500 hover:scale-[1.02]"
                    loading="lazy"
                  />
                </div>
                <div className="pt-2.5 flex items-baseline justify-between font-mono text-xs">
                  <span className="font-bold text-csg-black uppercase text-[11px]">
                    01. ĐẠI HỘI SONG HÀNH 2023
                  </span>
                  <span className="text-csg-black/50 text-[10px] shrink-0">
                    Tháng 10.2023
                  </span>
                </div>
                <p className="text-[11px] text-csg-black/75 font-body pt-0.5 max-w-[62%] leading-relaxed">
                  Một màu áo vàng, ngập tràn hoa hướng dương và những nụ cười ngày hội ngộ tụi mình bên nhau.
                </p>
              </div>

              {/* Overlapping Candid Print */}
              <div
                onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.coverOffset)}
                className={`absolute bottom-2 right-2 sm:-bottom-2 sm:-right-2 w-[36%] z-20 cursor-pointer transition-transform duration-300 hover:scale-[1.04] shadow-poster-sm rotate-2 bg-white p-1.5 pb-2.5 border-2 border-csg-black ${!isAnimationComplete ? 'film-reveal-item' : ''
                  }`}
                style={{ animationDelay: '300ms' }}
                title="Nhấp để phóng to khoảnh khắc này"
              >
                <img
                  src={PHOTOBOOK_IMAGES.coverOffset.src}
                  alt={PHOTOBOOK_IMAGES.coverOffset.alt}
                  className="w-full aspect-[4/3] object-cover"
                  loading="lazy"
                />
                <div className="pt-1 text-center font-mono text-[9px] text-csg-black/75 truncate font-bold">
                  Nụ cười hướng dương
                </div>
              </div>
            </div>

            {/* Complementary Workspace Dialogue (Col 5) */}
            <div className="col-span-5 flex flex-col">
              <div
                onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.workspace)}
                className={`paper-sheet p-2 sm:p-2.5 pb-3 sm:pb-3.5 cursor-pointer transition-all duration-300 hover:shadow-poster active:scale-[0.99] flex flex-col ${!isAnimationComplete ? 'film-reveal-item' : ''
                  }`}
                style={{ animationDelay: '200ms' }}
              >
                <div className="overflow-hidden bg-csg-black/5">
                  <img
                    src={PHOTOBOOK_IMAGES.workspace.src}
                    alt={PHOTOBOOK_IMAGES.workspace.alt}
                    className="w-full aspect-[16/11] object-cover transition-transform duration-500 hover:scale-[1.02]"
                    loading="lazy"
                  />
                </div>
                <div className="pt-2.5 flex items-baseline justify-between font-mono text-xs">
                  <span className="font-bold text-csg-black uppercase text-[11px]">
                    02. SAIGON TALK — NHỮNG ĐÊM ONLINE
                  </span>
                  <span className="text-csg-black/50 text-[10px] shrink-0">
                    Mùa giãn cách 2021
                  </span>
                </div>
                <p className="text-[11px] text-csg-black/75 font-body pt-0.5 leading-relaxed">
                  Dù chỉ nhìn nhau qua màn hình máy tính, ngọn lửa của tụi mình chưa một lần nguội lạnh.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- SPREAD 02: DẤU CHÂN HÀNH TRÌNH ---------------- */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-csg-black/15 pb-2 font-mono text-xs">
            <span className="font-bold uppercase tracking-wider text-csg-black/80">
              CHƯƠNG II: NHỮNG CHUYẾN ĐI XA
            </span>
            <span className="text-csg-black/40 text-[11px]">
              DẤU CHÂN & CỘT MỐC
            </span>
          </div>

          {/* Panoramic Expedition Feature */}
          <div
            onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.beachPanoramic)}
            className={`paper-sheet p-2 sm:p-3 pb-3 sm:pb-4 cursor-pointer transition-all duration-300 hover:shadow-poster active:scale-[0.99] ${!isAnimationComplete ? 'film-reveal-item' : ''
              }`}
            style={{ animationDelay: '400ms' }}
          >
            <div className="overflow-hidden bg-csg-black/5">
              <img
                src={PHOTOBOOK_IMAGES.beachPanoramic.src}
                alt={PHOTOBOOK_IMAGES.beachPanoramic.alt}
                className="w-full aspect-[22/8] object-cover transition-transform duration-500 hover:scale-[1.01]"
                loading="lazy"
              />
            </div>
            <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 font-mono text-xs">
              <span className="font-bold text-csg-black uppercase text-xs">
                03. CỜ CÓC BAY Ở PO KLONG GARAI
              </span>
              <span className="text-csg-black/60 text-[11px]">
                Chuyến đi xa cùng nhau, lá cờ CLB giương cao giữa nắng gió miền Trung.
              </span>
            </div>
          </div>

          {/* Paired Heritage Discovery Row */}
          <div className="grid grid-cols-12 gap-6 items-start">
            {/* Vertical Chronology (Col 5) */}
            <div
              onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.camera)}
              className={`col-span-5 paper-sheet p-2 sm:p-2.5 pb-3 sm:pb-3.5 cursor-pointer transition-all duration-300 hover:shadow-poster active:scale-[0.99] flex flex-col ${!isAnimationComplete ? 'film-reveal-item' : ''
                }`}
              style={{ animationDelay: '500ms' }}
            >
              <div className="overflow-hidden bg-csg-black/5">
                <img
                  src={PHOTOBOOK_IMAGES.camera.src}
                  alt={PHOTOBOOK_IMAGES.camera.alt}
                  className="w-full aspect-[3/4] object-cover transition-transform duration-500 hover:scale-[1.02]"
                  loading="lazy"
                />
              </div>
              <div className="pt-2 flex items-baseline justify-between font-mono text-xs">
                <span className="font-bold text-csg-black uppercase text-[11px]">
                  04. NĂM MÙA THỔI NẾN (7TH — 11TH)
                </span>
                <span className="text-csg-black/50 text-[10px]">
                  2016 — 2020
                </span>
              </div>
              <p className="text-[11px] text-csg-black/75 font-body line-clamp-1 pt-0.5">
                Từng chiếc bánh kem qua từng năm tháng — mỗi mùa sinh nhật là thêm một lứa Cóc trưởng thành.
              </p>
            </div>

            {/* Highland Gathering & Expedition Dispatch (Col 7) */}
            <div className="col-span-7 flex flex-col">
              <div
                onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.bonfire)}
                className={`paper-sheet p-2 sm:p-2.5 pb-3 sm:pb-3.5 cursor-pointer transition-all duration-300 hover:shadow-poster active:scale-[0.99] flex flex-col ${!isAnimationComplete ? 'film-reveal-item' : ''
                  }`}
                style={{ animationDelay: '600ms' }}
              >
                <div className="overflow-hidden bg-csg-black/5">
                  <img
                    src={PHOTOBOOK_IMAGES.bonfire.src}
                    alt={PHOTOBOOK_IMAGES.bonfire.alt}
                    className="w-full aspect-[16/11] object-cover transition-transform duration-500 hover:scale-[1.02]"
                    loading="lazy"
                  />
                </div>
                <div className="pt-2.5 flex items-baseline justify-between font-mono text-xs">
                  <span className="font-bold text-csg-black uppercase text-[11px]">
                    05. ĐÀ LẠT SƯƠNG MÙ & SẮC ÁO VÀNG
                  </span>
                  <span className="text-csg-black/50 text-[10px]">
                    Lâm Viên
                  </span>
                </div>
                <p className="text-[11px] text-csg-black/75 font-body pt-0.5 leading-relaxed">
                  Giữa cái lạnh cao nguyên, tụi mình đứng cạnh nhau là thấy ấm ran cả lòng.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- SPREAD 03: SÂN KHẤU & THANH XUÂN ---------------- */}
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b border-csg-black/15 pb-2 font-mono text-xs">
            <span className="font-bold uppercase tracking-wider text-csg-black/80">
              CHƯƠNG III: CHÁY HẾT MÌNH TRÊN SÂN KHẤU
            </span>
            <span className="text-csg-black/40 text-[11px]">
              ĐÊM ĐẠI HỘI & BIỂN XANH
            </span>
          </div>

          <div className="grid grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Prominent Stage Feature (Col 7) */}
            <div
              onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.stage)}
              className={`col-span-7 paper-sheet p-2 sm:p-2.5 pb-3 sm:pb-3.5 cursor-pointer transition-all duration-300 hover:shadow-poster active:scale-[0.99] flex flex-col ${!isAnimationComplete ? 'film-reveal-item' : ''
                }`}
              style={{ animationDelay: '700ms' }}
            >
              <div className="overflow-hidden bg-csg-black/5">
                <img
                  src={PHOTOBOOK_IMAGES.stage.src}
                  alt={PHOTOBOOK_IMAGES.stage.alt}
                  className="w-full aspect-[16/10] object-cover transition-transform duration-500 hover:scale-[1.02]"
                  loading="lazy"
                />
              </div>
              <div className="pt-2.5 flex items-baseline justify-between font-mono text-xs">
                <span className="font-bold text-csg-black uppercase text-[11px]">
                  06. ĐÊM HỘI TRƯỜNG VỌNG TIẾN
                </span>
                <span className="text-csg-black/50 text-[10px]">
                  Đại hội 2022
                </span>
              </div>
              <p className="text-[11px] text-csg-black/75 font-body pt-0.5 leading-relaxed">
                Ánh đèn bừng sáng, tiếng hò reo và những cánh tay giơ cao hòa chung một nhịp đập tuổi trẻ.
              </p>
            </div>

            {/* Coastal Toast Feature (Col 5) */}
            <div className="col-span-5 flex flex-col">
              <div
                onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.celebrationToast)}
                className={`paper-sheet p-2 sm:p-2.5 pb-3 sm:pb-3.5 cursor-pointer transition-all duration-300 hover:shadow-poster active:scale-[0.99] flex flex-col ${!isAnimationComplete ? 'film-reveal-item' : ''
                  }`}
                style={{ animationDelay: '800ms' }}
              >
                <div className="overflow-hidden bg-csg-black/5">
                  <img
                    src={PHOTOBOOK_IMAGES.celebrationToast.src}
                    alt={PHOTOBOOK_IMAGES.celebrationToast.alt}
                    className="w-full aspect-[4/3] object-cover transition-transform duration-500 hover:scale-[1.02]"
                    loading="lazy"
                  />
                </div>
                <div className="pt-2.5 flex items-baseline justify-between font-mono text-xs">
                  <span className="font-bold text-csg-black uppercase text-[11px]">
                    07. GIÓ BIỂN VÀ NỤ CƯỜI THANH XUÂN
                  </span>
                  <span className="text-csg-black/50 text-[10px]">
                    Bờ kè đá xanh
                  </span>
                </div>
                <p className="text-[11px] text-csg-black/75 font-body pt-0.5 leading-relaxed">
                  Ngồi bên bờ kè đón gió biển, cười nói giòn tan những ngày tháng đôi mươi rực rỡ.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- SPREAD 04: ĐẠI GIA ĐÌNH 17 NĂM (CENTERFOLD) ---------------- */}
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b border-csg-black/15 pb-2 font-mono text-xs">
            <span className="font-bold uppercase tracking-wider text-csg-black/80">
              TRANG KỶ NIỆM: ĐẠI GIA ĐÌNH CÓC SÀI GÒN
            </span>
            <span className="text-csg-black/40 text-[11px]">
              2009 — 2026 • 17 NĂM MỘT MÁI NHÀ
            </span>
          </div>

          <div
            onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.gatheringCrowd)}
            className={`paper-sheet p-2.5 sm:p-3.5 pb-3 sm:pb-4 max-w-4xl mx-auto cursor-pointer transition-all duration-300 hover:shadow-poster active:scale-[0.99] ${!isAnimationComplete ? 'film-reveal-item' : ''
              }`}
            style={{ animationDelay: '900ms' }}
          >
            <div className="overflow-hidden bg-csg-black/5">
              <img
                src={PHOTOBOOK_IMAGES.gatheringCrowd.src}
                alt={PHOTOBOOK_IMAGES.gatheringCrowd.alt}
                className="w-full aspect-[16/9] object-cover transition-transform duration-500 hover:scale-[1.01]"
                loading="lazy"
              />
            </div>
            <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 font-mono text-xs border-t border-csg-black/15 mt-3">
              <span className="font-bold text-csg-black uppercase text-xs">
                08. MƯỜI BẢY NĂM TRỌN MỘT MÁI NHÀ
              </span>
              <span className="text-csg-black/60 text-[11px]">
                Bao thế hệ Cóc đã đi qua, nhưng mỗi lần nhìn lại, tụi mình vẫn là một gia đình.
              </span>
            </div>
          </div>
        </section>

      </div>


      {/* ========================================================================= */}
      {/* MOBILE ART DIRECTION (Compact, cohesive cards without dead space)         */}
      {/* ========================================================================= */}
      <div className="block md:hidden space-y-6">

        {/* Mobile Item 1: Song Hành with Overlay */}
        <div className="space-y-2">
          <div className="font-mono text-[10px] text-csg-black/60 uppercase font-bold tracking-wider">
            01 & 02. ĐẠI HỘI SONG HÀNH & HOA HƯỚNG DƯƠNG
          </div>
          <div className="relative">
            <div
              onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.cover)}
              className="paper-sheet p-1.5 pb-2.5 cursor-pointer shadow-sm active:scale-95"
            >
              <img
                src={PHOTOBOOK_IMAGES.cover.src}
                alt={PHOTOBOOK_IMAGES.cover.alt}
                className="w-full aspect-[16/10] object-cover"
                loading="lazy"
              />
              <p className="pt-1.5 font-mono text-[10px] text-csg-black/75 truncate font-bold">
                {PHOTOBOOK_IMAGES.cover.alt}
              </p>
            </div>

            <div
              onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.coverOffset)}
              className="absolute -bottom-3 right-2 w-[42%] z-10 cursor-pointer shadow-poster-sm rotate-2 bg-white p-1 pb-2 border border-csg-black"
            >
              <img
                src={PHOTOBOOK_IMAGES.coverOffset.src}
                alt={PHOTOBOOK_IMAGES.coverOffset.alt}
                className="w-full aspect-[4/3] object-cover"
                loading="lazy"
              />
              <div className="pt-0.5 text-center font-mono text-[8px] text-csg-black/75 truncate font-bold">
                Nụ cười hướng dương
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Item 2: 2-Column Discovery Grid (SaiGon Talk & Camera) */}
        <div className="grid grid-cols-2 gap-2.5 pt-2">
          <div
            onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.workspace)}
            className="paper-sheet p-1.5 pb-2 cursor-pointer shadow-sm active:scale-95"
          >
            <img
              src={PHOTOBOOK_IMAGES.workspace.src}
              alt={PHOTOBOOK_IMAGES.workspace.alt}
              className="w-full aspect-square object-cover"
              loading="lazy"
            />
            <div className="pt-1 font-mono text-[9px] text-csg-black/80 truncate font-bold">
              SaiGon Talk online
            </div>
          </div>

          <div
            onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.camera)}
            className="paper-sheet p-1.5 pb-2 cursor-pointer shadow-sm active:scale-95"
          >
            <img
              src={PHOTOBOOK_IMAGES.camera.src}
              alt={PHOTOBOOK_IMAGES.camera.alt}
              className="w-full aspect-square object-cover"
              loading="lazy"
            />
            <div className="pt-1 font-mono text-[9px] text-csg-black/80 truncate font-bold">
              5 Mùa thổi nến
            </div>
          </div>
        </div>

        {/* Mobile Item 3: Cinematic Panorama Breakout */}
        <div className="space-y-1">
          <div className="font-mono text-[10px] text-csg-black/60 uppercase font-bold tracking-wider">
            03. CỜ CÓC TẠI PO KLONG GARAI
          </div>
          <div
            onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.beachPanoramic)}
            className="paper-sheet p-1.5 pb-2.5 cursor-pointer shadow-sm active:scale-95"
          >
            <img
              src={PHOTOBOOK_IMAGES.beachPanoramic.src}
              alt={PHOTOBOOK_IMAGES.beachPanoramic.alt}
              className="w-full aspect-[21/9] object-cover"
              loading="lazy"
            />
            <p className="pt-1.5 font-mono text-[10px] text-csg-black/75 truncate font-bold">
              {PHOTOBOOK_IMAGES.beachPanoramic.alt}
            </p>
          </div>
        </div>

        {/* Mobile Item 4: 2-Column Discovery Grid (Lâm Viên & Biển Xanh) */}
        <div className="grid grid-cols-2 gap-2.5">
          <div
            onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.bonfire)}
            className="paper-sheet p-1.5 pb-2 cursor-pointer shadow-sm active:scale-95"
          >
            <img
              src={PHOTOBOOK_IMAGES.bonfire.src}
              alt={PHOTOBOOK_IMAGES.bonfire.alt}
              className="w-full aspect-square object-cover"
              loading="lazy"
            />
            <div className="pt-1 font-mono text-[9px] text-csg-black/80 truncate font-bold">
              Đà Lạt sương mù
            </div>
          </div>

          <div
            onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.celebrationToast)}
            className="paper-sheet p-1.5 pb-2 cursor-pointer shadow-sm active:scale-95"
          >
            <img
              src={PHOTOBOOK_IMAGES.celebrationToast.src}
              alt={PHOTOBOOK_IMAGES.celebrationToast.alt}
              className="w-full aspect-square object-cover"
              loading="lazy"
            />
            <div className="pt-1 font-mono text-[9px] text-csg-black/80 truncate font-bold">
              Gió biển thanh xuân
            </div>
          </div>
        </div>

        {/* Mobile Item 5: Stage Concert Energy */}
        <div className="space-y-1">
          <div className="font-mono text-[10px] text-csg-black/60 uppercase font-bold tracking-wider">
            06. ĐÊM HỘI TRƯỜNG VỌNG TIẾN
          </div>
          <div
            onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.stage)}
            className="paper-sheet p-1.5 pb-2.5 cursor-pointer shadow-sm active:scale-95"
          >
            <img
              src={PHOTOBOOK_IMAGES.stage.src}
              alt={PHOTOBOOK_IMAGES.stage.alt}
              className="w-full aspect-[16/10] object-cover"
              loading="lazy"
            />
            <p className="pt-1.5 font-mono text-[10px] text-csg-black/75 truncate font-bold">
              {PHOTOBOOK_IMAGES.stage.alt}
            </p>
          </div>
        </div>

        {/* Mobile Item 6: Climax Monument Centerpiece */}
        <div className="space-y-1">
          <div className="font-mono text-[10px] text-csg-black/60 uppercase font-bold tracking-wider">
            08. ĐẠI GIA ĐÌNH CÓC GIỮA RỪNG THÔNG
          </div>
          <div
            onClick={() => setSelectedPhoto(PHOTOBOOK_IMAGES.gatheringCrowd)}
            className="paper-sheet p-1.5 pb-2.5 cursor-pointer shadow-sm active:scale-95"
          >
            <img
              src={PHOTOBOOK_IMAGES.gatheringCrowd.src}
              alt={PHOTOBOOK_IMAGES.gatheringCrowd.alt}
              className="w-full aspect-[16/9] object-cover"
              loading="lazy"
            />
            <p className="pt-1.5 font-mono text-[10px] text-csg-black/75 truncate font-bold">
              {PHOTOBOOK_IMAGES.gatheringCrowd.alt}
            </p>
          </div>
        </div>

      </div>


      {/* ========================================================================= */}
      {/* GRAND FINALE SPREAD: GALA KEEPSAKE TICKET FIRST, SÂN KHẤU CÓC COMPANION    */}
      {/* User Rule: "form trc rồi tới sân khấu cóc sau"                            */}
      {/* ========================================================================= */}
      <section className="pt-8 sm:pt-10 mt-8 sm:mt-10 border-t border-csg-black/20">

        {/* Section Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 mb-5 border-b border-csg-black/15 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-csg-red animate-pulse" />
            <span className="font-bold uppercase tracking-wider text-csg-black">
              ĐẠI TIỆC GALA 17Y • THƯ MỜI HỘI NGỘ & SÂN KHẤU KỶ NIỆM
            </span>
          </div>
          <span className="text-csg-black/50 text-[11px]">
            12.12.2026 • ĐỒI SỨ VILLA
          </span>
        </div>

        {/* Unified Finale Suite: Form Ticket First (Col 7), Sân Khấu Cóc Companion (Col 5) */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">

          {/* 1. GALA KEEPSAKE TICKET (FIRST IN DOM & FIRST VISUALLY) */}
          <div className="lg:col-span-7 bg-[#FFFDF8] border-2 border-csg-black p-4 sm:p-6 shadow-poster flex flex-col justify-between space-y-4">

            {/* Perforation Stamp */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b-2 border-dashed border-csg-black/25 pb-2.5 font-mono text-[10px] sm:text-[11px]">
              <span className="font-bold uppercase tracking-wider sm:tracking-widest text-csg-red whitespace-nowrap">
                THƯ MỜI HỘI NGỘ • KỶ NIỆM 17 NĂM
              </span>
              <span className="text-csg-black/50 whitespace-nowrap">
                {GALA_EVENT_DETAILS.rsvpDeadline ? `Hạn chót: ${GALA_EVENT_DETAILS.rsvpDeadline}` : '10.12.2026'}
              </span>
            </div>

            {/* Event Typography */}
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-display font-extrabold uppercase text-csg-black leading-tight tracking-tight">
                {GALA_EVENT_DETAILS.title}
              </h2>
              <p className="font-editorial italic text-sm sm:text-base text-csg-black/75">
                {GALA_EVENT_DETAILS.subtitle}
              </p>
            </div>

            {/* Verified Event Schedule Matrix */}
            <div className="font-mono text-xs divide-y divide-csg-black/15 py-1">
              <div className="flex items-center justify-between py-2 gap-2">
                <span className="text-csg-black/60 uppercase whitespace-nowrap shrink-0">THỜI GIAN:</span>
                <span className="font-bold text-csg-black text-right">{GALA_EVENT_DETAILS.time}</span>
              </div>
              <div className="flex items-center justify-between py-2 gap-2">
                <span className="text-csg-black/60 uppercase whitespace-nowrap shrink-0">ĐỊA ĐIỂM:</span>
                <span className="font-bold text-csg-black text-right">{GALA_EVENT_DETAILS.venue}</span>
              </div>
            </div>

            {/* Direct Instant RSVP Action */}
            <div className="space-y-2 pt-1">
              <button
                onClick={onOpenRegister}
                className="btn-editorial-primary w-full py-3.5 sm:py-4 min-h-[48px] font-display font-extrabold text-sm sm:text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-poster active:scale-[0.98] whitespace-nowrap"
              >
                <span>ĐĂNG KÝ THAM GIA GALA 17Y</span>
                <ArrowRightIcon size={16} className="shrink-0" />
              </button>

              <div className="text-center font-mono text-[10px] sm:text-[11px] text-csg-black/45">
                Dành cho thành viên & cựu thành viên CSG
              </div>
            </div>

          </div>

          {/* 2. SÂN KHẤU CÓC COMPANION PASSPORT (TỐI GIẢN & TINH GỌN) */}
          {onOpenStage && (
            <div className="lg:col-span-5 bg-csg-surface border-2 border-csg-black p-4 sm:p-6 shadow-poster flex flex-col justify-between space-y-4">

              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between gap-2 border-b-2 border-dashed border-csg-black/25 pb-2.5 font-mono text-[10px] sm:text-[11px]">
                  <span className="font-bold uppercase tracking-wider text-csg-black">
                    SÂN KHẤU CÓC 17Y
                  </span>
                  <span className="text-csg-black/70 flex items-center gap-1 font-bold">
                    <FrogIcon size={14} className="text-csg-red" />
                    <span>{totalWishesCount} LỜI CHÚC</span>
                  </span>
                </div>

                {/* Minimalist Mascot Visual Hook */}
                <div className="flex items-center gap-3.5 py-1">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xs bg-csg-yellow border-2 border-csg-black flex items-center justify-center shadow-xs shrink-0 p-1.5">
                    <img 
                      src="/images/coc_mascot.png" 
                      alt="Cóc Áo Vàng" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display font-bold text-sm sm:text-base text-csg-black leading-snug">
                      Hội ngộ các thế hệ Cóc Áo Vàng
                    </h3>
                    <p className="font-mono text-[11px] text-csg-black/60 mt-0.5 leading-relaxed">
                      Mỗi lời chúc gửi về đều là một chú Cóc nhảy múa trên sân khấu ảo.
                    </p>
                  </div>
                </div>

                {/* Single Warm Keepsake Quote */}
                <div className="p-3 bg-[#FFFDF8] border-l-3 border-csg-yellow rounded-r-xs font-handwriting text-base sm:text-lg text-csg-black/85 leading-snug">
                  "Chúc Cóc Sài Gòn mãi là ngôi nhà ấm áp của bao thế hệ!"
                </div>
              </div>

              {/* Enter Stage CTA Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={onOpenStage}
                  className="btn-editorial-primary w-full py-3.5 sm:py-4 min-h-[48px] font-display font-extrabold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-poster active:scale-[0.98] whitespace-nowrap"
                >
                  <FrogIcon size={16} className="shrink-0" />
                  <span>XEM SÂN KHẤU CÓC</span>
                  <ArrowRightIcon size={14} className="shrink-0" />
                </button>
              </div>

            </div>
          )}

        </div>

      </section>

      {/* ================= MINIMAL ARCHIVAL COLOPHON ================= */}
      <div className="text-center pt-8 font-mono text-xs text-csg-black/40 uppercase tracking-widest">
        CÓC SÀI GÒN • 2009 — 2026
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
              className="max-h-[72vh] w-auto max-w-full object-contain shadow-2xl"
            />

            {/* Inscription Description */}
            <p className="text-white/80 font-mono text-xs text-center pt-3 px-4 max-w-2xl">
              {selectedPhoto.alt}
            </p>

            {/* Bottom Controls */}
            <div className="w-full max-w-xs mt-3 flex items-center justify-between text-xs font-mono text-white/70">
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
