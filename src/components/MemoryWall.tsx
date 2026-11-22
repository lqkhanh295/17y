import React, { useState, useEffect, useCallback } from 'react';
import { ZoomInIcon, CloseIcon, ChevronLeftIcon, ChevronRightIcon, BookmarkIcon } from 'naive-icons';

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
    season: 'Đại Hội 2023',
    year: '2023',
    title: 'Đại Hội Cóc Sài Gòn • Song Hành',
    caption: 'Toàn thể thành viên các thế hệ tề tựu trong không gian ấm áp tại Sài Gòn, cùng nâng ly và vinh danh những cống hiến vì CLB.',
    note: 'Khoảnh khắc toàn thể anh em cùng hô vang khẩu hiệu Cóc Sài Gòn!',
    url: '/images/csg/IMG_9688.JPG',
    department: 'Ban Điều Hành & Ban Sự kiện',
    archiveCode: 'PLATE 01 // CSG-ARC-2023-SH',
    aspectRatio: 'landscape'
  },
  {
    id: 'arc-02',
    chapter: 'GALA',
    chapterTitle: 'Chương I • Đêm Hoàng Kim & Sinh Nhật CLB',
    season: 'Đại Hội 2022',
    year: '2022',
    title: 'Đại Hội Cóc Sài Gòn • Vọng Tiến',
    caption: 'Hội trường chật kín sắc áo vàng và những tấm bằng khen trang trọng ghi nhận nỗ lực cống hiến của các ban chuyên môn.',
    note: 'Tri ân các thế hệ Chủ nhiệm và Trưởng ban qua từng thời kỳ.',
    url: '/images/csg/IMG_9686.PNG',
    department: 'Ban Điều Hành & Toàn thể CSG',
    archiveCode: 'PLATE 02 // CSG-ARC-2022-VT',
    aspectRatio: 'landscape'
  },
  {
    id: 'arc-03',
    chapter: 'GALA',
    chapterTitle: 'Chương I • Đêm Hoàng Kim & Sinh Nhật CLB',
    season: 'Tổng Kết Kỳ 2024',
    year: '2024',
    title: 'Sân Khấu Tổng Kết • Phá Kén',
    caption: 'Sân khấu lung linh biểu tượng cánh bướm Phá Kén, tôn vinh sự trưởng thành và bứt phá của các thế hệ Cóc mới.',
    url: '/images/csg/IMG_9690.JPG',
    department: 'Ban Sự kiện & Ban Kỹ thuật',
    archiveCode: 'PLATE 03 // CSG-ARC-2024-PK',
    aspectRatio: 'landscape'
  },

  // Chapter 02: Teambuilding
  {
    id: 'arc-04',
    chapter: 'TEAMBUILDING',
    chapterTitle: 'Chương II • Lửa Trại & Những Chuyến Đi Sắc Áo Vàng',
    season: 'Hành Trình Biển',
    year: '2024',
    title: 'Biển Xanh & Màu Áo Vàng Kiêu Hãnh',
    caption: 'Đón gió biển bên bờ kè đá xanh, nơi những gương mặt mới bước vào trường nhanh chóng trở thành người một nhà.',
    note: 'Tuổi trẻ rực rỡ dưới nền trời xanh ngút ngàn.',
    url: '/images/csg/IMG_9699.JPG',
    department: 'Toàn thể thành viên CSG',
    archiveCode: 'PLATE 04 // CSG-ARC-2024-SEA',
    aspectRatio: 'landscape'
  },
  {
    id: 'arc-05',
    chapter: 'TEAMBUILDING',
    chapterTitle: 'Chương II • Lửa Trại & Những Chuyến Đi Sắc Áo Vàng',
    season: 'Đà Lạt Trip',
    year: '2024',
    title: 'Hành Trình Gắn Kết Tại Xứ Sương Mù',
    caption: 'Sắc cờ vàng chú Cóc tung bay trước Quảng trường Lâm Viên, thắt chặt tình cảm giữa các thế hệ anh chị và các em khóa mới.',
    url: '/images/csg/IMG_9697.JPG',
    department: 'Ban Nhân sự & Ban Sự kiện',
    archiveCode: 'PLATE 05 // CSG-ARC-2024-DL',
    aspectRatio: 'landscape'
  },

  // Chapter 03: Field Operations
  {
    id: 'arc-06',
    chapter: 'FIELD_WORK',
    chapterTitle: 'Chương III • Hậu Trường Tác Nghiệp & F-Camp',
    season: 'Khởi Hành Tác Nghiệp',
    year: '2024',
    title: 'Chuyến Xe Tuổi Trẻ & Sẵn Sàng Lên Đường',
    caption: 'Những nụ cười rạng rỡ bên chiếc xe khách 51B, sẵn sàng cho những chuyến tác nghiệp và hành trình khám phá mới.',
    note: 'Kíp máy ảnh và tác nghiệp hoạt động hết công suất.',
    url: '/images/csg/IMG_9695.JPG',
    department: 'Ban Kỹ thuật & Truyền thông',
    archiveCode: 'PLATE 06 // CSG-ARC-2024-BUS',
    aspectRatio: 'landscape'
  },
  {
    id: 'arc-07',
    chapter: 'FIELD_WORK',
    chapterTitle: 'Chương III • Hậu Trường Tác Nghiệp & F-Camp',
    season: 'SaiGon Talk Online',
    year: '2021',
    title: 'SaiGon Talk • Vượt Không Gian Mùa Dịch',
    caption: 'Buổi talkshow trực tuyến với hơn 100 thành viên qua màn hình Google Meet, giữ vững tinh thần kết nối không khoảng cách.',
    url: '/images/csg/IMG_9682.JPG',
    department: 'Ban Nội dung & Toàn thể CLB',
    archiveCode: 'PLATE 07 // CSG-ARC-2021-SGT',
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
    <section id="ky-niem" className="py-20 sm:py-28 px-4 sm:px-6 max-w-7xl mx-auto border-t-2 border-csg-black">
      {/* Exhibition Masthead Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b-2 border-csg-black mb-12">
        <div className="space-y-2 max-w-3xl">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold text-csg-red uppercase tracking-widest">
              LƯU TRỮ TƯ LIỆU // VOL. 17
            </span>
            <span className="text-csg-black/30">•</span>
            <span className="text-xs font-mono text-csg-black/60 uppercase tracking-widest">
              2009 - 2026
            </span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold uppercase tracking-tight text-csg-black leading-none">
            Cuốn Kỷ Yếu 17 Năm
          </h2>
          <p className="font-editorial italic text-base sm:text-lg text-csg-black/85 leading-relaxed pt-1">
            "Không chỉ là những bức ảnh lưu niệm, đây là trang nhật ký hình ảnh ghi lại từng nụ cười, giọt mồ hôi và nhiệt huyết của bao thế hệ Cóc Sài Gòn."
          </p>
        </div>

        {/* Chapter Filter Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'ALL', label: 'Tất Cả Tư Liệu' },
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
              className={`px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider transition-all border ${
                activeChapter === tab.id
                  ? 'bg-csg-black text-csg-paper border-csg-black font-bold'
                  : 'bg-transparent text-csg-black/75 border-csg-black/20 hover:border-csg-black hover:text-csg-black'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Curated Editorial Art Book Gallery (Unboxed, Photography-First) */}
      <div className="space-y-16 sm:space-y-24">
        {/* Dynamic Spread: Lead Hero Spread + Diptychs */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-14 items-start">
          {filteredArchive.map((item, index) => {
            // Asymmetric rhythm: index 0 and 3 are panoramic spreads (8 cols), others are 4 or 6 cols
            const isFullSpread = index % 3 === 0;
            const colSpan = isFullSpread ? 'md:col-span-8' : index % 3 === 1 ? 'md:col-span-4' : 'md:col-span-6';
            const isBookmarked = bookmarkedIds[item.id];

            return (
              <article
                key={item.id}
                onClick={() => setSelectedPhotoIndex(index)}
                className={`${colSpan} group cursor-pointer space-y-3`}
              >
                {/* Pure Photography Container */}
                <div className="relative bg-csg-muted overflow-hidden border border-csg-black/40">
                  <img
                    src={item.url}
                    alt={item.title}
                    className={`w-full object-cover transition-transform duration-700 group-hover:scale-[1.03] ${
                      item.aspectRatio === 'landscape'
                        ? 'aspect-[16/10]'
                        : item.aspectRatio === 'portrait'
                        ? 'aspect-[3/4]'
                        : 'aspect-square'
                    }`}
                    loading="lazy"
                  />

                  {/* Discrete Zoom Hint */}
                  <div className="absolute bottom-3 right-3 bg-csg-paper/90 border border-csg-black px-2 py-1 text-[10px] font-mono font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ZoomInIcon size={12} className="text-csg-red" />
                    <span>PHÓNG TO</span>
                  </div>
                </div>

                {/* Museum-Grade Archival Captions */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between font-mono text-[11px] text-csg-black/60 border-b border-csg-black/15 pb-1">
                    <span className="font-bold text-csg-black">{item.archiveCode}</span>
                    <div className="flex items-center gap-3">
                      <span>{item.year}</span>
                      <button
                        onClick={(e) => toggleBookmark(item.id, e)}
                        className="hover:text-csg-red transition-colors"
                        title={isBookmarked ? 'Bỏ lưu' : 'Đánh dấu'}
                      >
                        <BookmarkIcon size={14} className={isBookmarked ? 'fill-csg-red text-csg-red' : ''} />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-display font-extrabold text-lg sm:text-xl text-csg-black group-hover:text-csg-red transition-colors leading-tight">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-csg-black/80 font-sans leading-relaxed">
                    {item.caption}
                  </p>

                  {item.note && (
                    <p className="font-handwriting text-base text-csg-red/90 pt-0.5 leading-snug">
                      * {item.note}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Accessible Fullscreen Darkroom Lightbox */}
      {selectedItem && selectedPhotoIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={selectedItem.title}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-[#11100E]/95 backdrop-blur-md animate-fadeIn"
          onClick={() => setSelectedPhotoIndex(null)}
        >
          <div
            className="relative max-w-5xl w-full bg-[#1A1815] border border-[#F4EEDF]/20 text-[#F4EEDF] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedPhotoIndex(null)}
              className="absolute top-4 right-4 z-20 p-2 bg-[#2A2722] hover:bg-[#B94D35] text-[#F4EEDF] transition-colors"
              aria-label="Đóng xem chi tiết"
            >
              <CloseIcon size={20} />
            </button>

            {/* High-Res Photograph */}
            <div className="flex-1 bg-[#0E0D0B] flex items-center justify-center p-4 min-h-[300px] md:min-h-[500px]">
              <img
                src={selectedItem.url}
                alt={selectedItem.title}
                className="max-h-[75vh] w-auto max-w-full object-contain"
              />
            </div>

            {/* Archival Dossier Side Panel */}
            <div className="w-full md:w-80 p-6 flex flex-col justify-between border-t md:border-t-0 md:border-l border-[#F4EEDF]/15 bg-[#181613]">
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="font-mono text-xs text-[#F4C542] tracking-widest uppercase block">
                    {selectedItem.archiveCode}
                  </span>
                  <span className="font-mono text-[10px] text-[#DCD5C4]/60 uppercase block">
                    {selectedItem.chapterTitle}
                  </span>
                </div>

                <h3 className="font-display font-bold text-2xl text-[#F4EEDF] leading-tight">
                  {selectedItem.title}
                </h3>

                <p className="text-sm text-[#DCD5C4]/90 font-sans leading-relaxed">
                  {selectedItem.caption}
                </p>

                {selectedItem.note && (
                  <p className="font-handwriting text-lg text-[#F4C542] pt-2 border-t border-[#F4EEDF]/15">
                    "{selectedItem.note}"
                  </p>
                )}

                <div className="space-y-2 pt-4 border-t border-[#F4EEDF]/15 font-mono text-xs text-[#DCD5C4]/70">
                  <div className="flex justify-between">
                    <span>MÙA SỰ KIỆN:</span>
                    <span className="text-[#F4EEDF] font-bold">{selectedItem.season}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>NĂM TƯ LIỆU:</span>
                    <span className="text-[#F4EEDF] font-bold">{selectedItem.year}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ĐƠN VỊ THỰC HIỆN:</span>
                    <span className="text-[#F4EEDF] font-bold">{selectedItem.department}</span>
                  </div>
                </div>
              </div>

              {/* Prev / Next Pagination */}
              <div className="flex items-center justify-between pt-6 border-t border-[#F4EEDF]/15 mt-6 font-mono text-xs">
                <button
                  onClick={handlePrev}
                  className="px-3 py-1.5 bg-[#25221D] hover:bg-[#F4C542] hover:text-[#20231F] text-[#F4EEDF] transition-colors flex items-center gap-1"
                >
                  <ChevronLeftIcon size={16} />
                  <span>TRƯỚC</span>
                </button>
                <span className="text-[#DCD5C4]/60">
                  {selectedPhotoIndex + 1} / {filteredArchive.length}
                </span>
                <button
                  onClick={handleNext}
                  className="px-3 py-1.5 bg-[#25221D] hover:bg-[#F4C542] hover:text-[#20231F] text-[#F4EEDF] transition-colors flex items-center gap-1"
                >
                  <span>TIẾP</span>
                  <ChevronRightIcon size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
