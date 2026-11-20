import React, { useState, useEffect, useCallback } from 'react';
import { Camera, Heart, Sparkles, X, ZoomIn, Calendar, Bookmark, ChevronLeft, ChevronRight, Tag, Folder } from 'lucide-react';

export interface PhotobookItem {
  id: string;
  chapter: string;
  chapterTitle: string;
  season: string;
  year: string;
  title: string;
  caption: string;
  note?: string;
  url: string;
  department: string;
  archiveCode: string;
  aspectRatio: 'landscape' | 'portrait' | 'square';
}

const PHOTOBOOK_ARCHIVE: PhotobookItem[] = [
  // Chapter 01: Gala Nights
  {
    id: 'arc-01',
    chapter: 'GALA',
    chapterTitle: 'Chương I • Đêm Hoàng Kim & Sinh Nhật CLB',
    season: 'Sinh Nhật 16Y',
    year: '2025',
    title: 'Đêm Hoàng Kim Cóc 16 Tuổi',
    caption: 'Hơn 120 thành viên qua các thế hệ tề tựu trong không gian ấm áp tại Sài Gòn, cùng nâng ly và thổi nến mừng 16 năm thành lập CLB.',
    note: 'Khoảnh khắc toàn thể anh em cùng hô vang khẩu hiệu Cóc Sài Gòn!',
    url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1000&q=80',
    department: 'Ban Sự kiện & Ban Kỹ thuật',
    archiveCode: 'CSG-ARC-2025-16Y',
    aspectRatio: 'landscape'
  },
  {
    id: 'arc-02',
    chapter: 'GALA',
    chapterTitle: 'Chương I • Đêm Hoàng Kim & Sinh Nhật CLB',
    season: 'Sinh Nhật 15Y',
    year: '2024',
    title: 'Dấu Ấn Tròn 15 Năm Bứt Phá',
    caption: 'Chiếc bánh kem 3 tầng và màn tri ân trang trọng dành cho các anh chị tiền bối sáng lập đã đặt những viên gạch đầu tiên từ năm 2009.',
    note: 'Tri ân các thế hệ Chủ nhiệm và Trưởng ban qua từng thời kỳ.',
    url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=800&q=80',
    department: 'Ban Điều Hành & Ban Nội dung',
    archiveCode: 'CSG-ARC-2024-15Y',
    aspectRatio: 'square'
  },
  {
    id: 'arc-03',
    chapter: 'GALA',
    chapterTitle: 'Chương I • Đêm Hoàng Kim & Sinh Nhật CLB',
    season: 'Gala 14Y',
    year: '2023',
    title: 'Sân Khấu Âm Nhạc Tự Do',
    caption: 'Những tiết mục văn nghệ tự biên tự diễn mang đậm chất phóng khoáng, trẻ trung và không ngại thử thách của sinh viên truyền thông.',
    url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
    department: 'Ban Sự kiện',
    archiveCode: 'CSG-ARC-2023-14Y',
    aspectRatio: 'portrait'
  },

  // Chapter 02: Teambuilding
  {
    id: 'arc-04',
    chapter: 'TEAMBUILDING',
    chapterTitle: 'Chương II • Lửa Trại & Những Chuyến Đi Sắc Áo Vàng',
    season: 'Teambuilding 2025',
    year: '2025',
    title: 'Biển Vũng Tàu & Màu Áo Truyền Thống',
    caption: 'Cháy hết mình với chuỗi trò chơi vận động bãi biển. Nơi những gương mặt mới bước vào trường nhanh chóng trở thành người một nhà.',
    note: 'Đêm lửa trại không ngủ với những lời tâm sự chân thành bên bờ biển.',
    url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1000&q=80',
    department: 'Toàn thể thành viên CSG',
    archiveCode: 'CSG-ARC-2025-TB',
    aspectRatio: 'landscape'
  },
  {
    id: 'arc-05',
    chapter: 'TEAMBUILDING',
    chapterTitle: 'Chương II • Lửa Trại & Những Chuyến Đi Sắc Áo Vàng',
    season: 'Dã Ngoại K18',
    year: '2024',
    title: 'Hành Trình Gắn Kết Tân Binh',
    caption: 'Những cái ôm siết chặt và tiếng cười giòn giã giữa thiên nhiên, thắt chặt tình cảm giữa các thế hệ anh chị và các em khóa mới.',
    url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80',
    department: 'Ban Nhân sự & Ban Sự kiện',
    archiveCode: 'CSG-ARC-2024-TRIP',
    aspectRatio: 'square'
  },

  // Chapter 03: Field Operations
  {
    id: 'arc-06',
    chapter: 'FIELD_WORK',
    chapterTitle: 'Chương III • Hậu Trường Tác Nghiệp & F-Camp',
    season: 'Tác Nghiệp F-Camp',
    year: '2025',
    title: 'Đêm Trắng Bắt Trọn Khoảnh Khắc',
    caption: 'Những góc máy lăn xả dưới mưa nắng sân trường để bắt trọn từng nụ cười của tân sinh viên trong ngày hội F-Camp nghìn người.',
    note: 'Kíp máy ảnh và flycam hoạt động liên tục 14 tiếng.',
    url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
    department: 'Ban Kỹ thuật & Nhiếp ảnh',
    archiveCode: 'CSG-ARC-2025-FCAMP',
    aspectRatio: 'portrait'
  },
  {
    id: 'arc-07',
    chapter: 'FIELD_WORK',
    chapterTitle: 'Chương III • Hậu Trường Tác Nghiệp & F-Camp',
    season: 'Workshop Thiết Kế',
    year: '2024',
    title: 'Bàn Tròn Sáng Tạo & Dựng Bài',
    caption: 'Buổi chia sẻ kỹ năng thiết kế đồ họa, chỉnh màu ảnh và viết bài truyền thông giữa các mentor tiền bối và đàn em khóa dưới.',
    url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
    department: 'Ban Thiết kế & Ban Nội dung',
    archiveCode: 'CSG-ARC-2024-WS',
    aspectRatio: 'landscape'
  }
];

export const MemoryWall: React.FC = () => {
  const [activeChapter, setActiveChapter] = useState<string>('ALL');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<{ [key: string]: boolean }>({});

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarkedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredArchive = activeChapter === 'ALL'
    ? PHOTOBOOK_ARCHIVE
    : PHOTOBOOK_ARCHIVE.filter(item => item.chapter === activeChapter);

  const selectedItem = selectedPhotoIndex !== null ? filteredArchive[selectedPhotoIndex] : null;

  const handlePrev = useCallback(() => {
    if (selectedPhotoIndex === null) return;
    setSelectedPhotoIndex((selectedPhotoIndex - 1 + filteredArchive.length) % filteredArchive.length);
  }, [selectedPhotoIndex, filteredArchive.length]);

  const handleNext = useCallback(() => {
    if (selectedPhotoIndex === null) return;
    setSelectedPhotoIndex((selectedPhotoIndex + 1) % filteredArchive.length);
  }, [selectedPhotoIndex, filteredArchive.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedPhotoIndex === null) return;
      if (e.key === 'Escape') setSelectedPhotoIndex(null);
      else if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhotoIndex, handlePrev, handleNext]);

  return (
    <section id="ky-niem" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto border-t-2 border-csg-black">
      {/* Editorial Chapter Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b-2 border-csg-black mb-10">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="stamp-seal">TƯ LIỆU KỶ YẾU</span>
            <span className="text-xs font-mono text-csg-black/60 uppercase tracking-widest">
              HÀNH TRÌNH 17 NĂM SẮC ÁO VÀNG (2009 - 2026)
            </span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold uppercase tracking-tight text-csg-black leading-none">
            Cuốn Kỷ Yếu Sống Động
          </h2>
          <p className="font-editorial italic text-base sm:text-lg text-csg-black/80 max-w-2xl">
            "Không chỉ là những bức ảnh lưu niệm, đây là trang nhật ký bằng hình ảnh đọng lại từng nụ cười, giọt mồ hôi và nhiệt huyết của tuổi trẻ FPTU."
          </p>
        </div>

        {/* Chapter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'ALL', label: 'Toàn Bộ Tư Liệu' },
            { id: 'GALA', label: 'Chương I: Gala Nights' },
            { id: 'TEAMBUILDING', label: 'Chương II: Dã Ngoại' },
            { id: 'FIELD_WORK', label: 'Chương III: Tác Nghiệp' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveChapter(tab.id);
                setSelectedPhotoIndex(null);
              }}
              className={`px-3.5 py-2 text-xs font-mono uppercase tracking-wider transition-all border ${
                activeChapter === tab.id
                  ? 'bg-csg-black text-csg-paper border-csg-black shadow-poster-sm font-bold'
                  : 'bg-csg-surface text-csg-black/80 border-csg-muted hover:border-csg-black hover:bg-csg-paper'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Asymmetrical Editorial Photobook Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {filteredArchive.map((item, index) => {
          // Asymmetrical layout logic: item 0 and 3 take 8 cols, others take 4 or 6 cols
          const colSpan = (index % 3 === 0) 
            ? 'md:col-span-8' 
            : (index % 3 === 1) 
            ? 'md:col-span-4' 
            : 'md:col-span-6';

          const isBookmarked = bookmarkedIds[item.id];
          const rotation = index % 2 === 0 ? '-rotate-0.5' : 'rotate-0.5';

          return (
            <div
              key={item.id}
              onClick={() => setSelectedPhotoIndex(index)}
              className={`${colSpan} group bg-csg-surface border-2 border-csg-black p-4 shadow-poster-sm hover:shadow-poster hover:-translate-y-1 transition-all duration-300 cursor-pointer ${rotation} hover:rotate-0`}
            >
              {/* Photo Area with tape and analogue border */}
              <div className="polaroid-tape relative bg-csg-muted border border-csg-black/25 overflow-hidden mb-4">
                <img
                  src={item.url}
                  alt={item.title}
                  className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                    item.aspectRatio === 'landscape' 
                      ? 'aspect-[16/10]' 
                      : item.aspectRatio === 'portrait' 
                      ? 'aspect-[3/4]' 
                      : 'aspect-square'
                  }`}
                  loading="lazy"
                />

                {/* Top Corner Meta */}
                <div className="absolute top-3 left-3 px-2 py-0.5 bg-csg-paper/95 border border-csg-black text-[10px] font-mono font-bold uppercase text-csg-black shadow-sm">
                  {item.season}
                </div>

                <div className="absolute top-3 right-3 px-2 py-0.5 bg-csg-black text-csg-yellow text-[10px] font-mono font-bold shadow-sm">
                  {item.year}
                </div>

                {/* Hover overlay hint */}
                <div className="absolute inset-0 bg-csg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <div className="px-4 py-2 bg-csg-paper text-csg-black font-mono text-xs font-bold border-2 border-csg-black flex items-center gap-1.5 shadow-poster-sm">
                    <ZoomIn className="w-3.5 h-3.5 text-csg-red" />
                    <span>Xem phóng to & tư liệu</span>
                  </div>
                </div>
              </div>

              {/* Editorial Captions & Story */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-csg-black/60 border-b border-csg-muted pb-1.5">
                  <span className="flex items-center gap-1">
                    <Folder className="w-3 h-3 text-csg-red" />
                    {item.department}
                  </span>
                  <button
                    onClick={(e) => toggleBookmark(item.id, e)}
                    className="flex items-center gap-1 hover:text-csg-red transition-colors"
                    title={isBookmarked ? 'Bỏ lưu' : 'Lưu trang tư liệu'}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-csg-red text-csg-red' : ''}`} />
                    <span>{isBookmarked ? 'Đã lưu' : 'Đánh dấu'}</span>
                  </button>
                </div>

                <h3 className="font-display font-extrabold text-xl text-csg-black group-hover:text-csg-red transition-colors leading-tight">
                  {item.title}
                </h3>

                <p className="text-xs sm:text-sm text-csg-black/80 font-sans leading-relaxed">
                  {item.caption}
                </p>

                {item.note && (
                  <p className="font-handwriting text-base text-csg-red/90 pt-1 leading-snug">
                    * {item.note}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Accessible Keyboard-Controlled Lightbox Modal */}
      {selectedItem && selectedPhotoIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={selectedItem.title}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-csg-black/90 backdrop-blur-md animate-fadeIn"
          onClick={() => setSelectedPhotoIndex(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-csg-paper border-2 border-csg-black overflow-hidden shadow-poster-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Toolbar */}
            <div className="flex items-center justify-between p-3.5 bg-csg-surface border-b-2 border-csg-black">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-csg-black px-2.5 py-1 bg-csg-yellow border border-csg-black shadow-poster-sm">
                  TƯ LIỆU {selectedPhotoIndex + 1} / {filteredArchive.length}
                </span>
                <span className="text-xs font-mono text-csg-black/70 hidden sm:inline">
                  {selectedItem.archiveCode}
                </span>
              </div>

              <button
                onClick={() => setSelectedPhotoIndex(null)}
                aria-label="Đóng xem tư liệu"
                className="w-8 h-8 rounded-none bg-csg-black text-csg-paper hover:bg-csg-red transition-colors flex items-center justify-center border border-csg-black font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Buttons */}
            <button
              onClick={handlePrev}
              aria-label="Trang trước"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-csg-paper hover:bg-csg-yellow text-csg-black border-2 border-csg-black shadow-poster-sm flex items-center justify-center transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={handleNext}
              aria-label="Trang sau"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-csg-paper hover:bg-csg-yellow text-csg-black border-2 border-csg-black shadow-poster-sm flex items-center justify-center transition-all"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Photo Canvas */}
            <div className="max-h-[60vh] bg-csg-black flex items-center justify-center overflow-hidden">
              <img
                src={selectedItem.url}
                alt={selectedItem.title}
                className="max-h-[60vh] w-auto object-contain select-none"
              />
            </div>

            {/* Editorial Metadata Footer */}
            <div className="p-6 bg-csg-surface border-t-2 border-csg-black space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-csg-black/70 border-b border-csg-muted pb-2">
                <span className="stamp-seal">
                  {selectedItem.season} • NĂM {selectedItem.year}
                </span>
                <span>Phụ trách: <strong>{selectedItem.department}</strong></span>
              </div>

              <h4 className="text-2xl font-display font-extrabold text-csg-black uppercase">
                {selectedItem.title}
              </h4>

              <p className="text-sm text-csg-black/85 font-sans leading-relaxed">
                {selectedItem.caption}
              </p>

              {selectedItem.note && (
                <p className="font-handwriting text-lg text-csg-red">
                  Ghi chú lưu bút: "{selectedItem.note}"
                </p>
              )}

              <div className="pt-2 flex items-center justify-between text-xs font-mono text-csg-black/50 border-t border-csg-black/10">
                <span>Dùng phím [←] và [→] để chuyển ảnh • [Esc] để thoát</span>
                <span className="text-csg-red font-bold">#CocSaiGon17Y</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
