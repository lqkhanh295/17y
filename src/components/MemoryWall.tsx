import React, { useState, useEffect, useCallback } from 'react';
import { Camera, Heart, Sparkles, X, ZoomIn, Calendar, Bookmark, ChevronLeft, ChevronRight } from 'lucide-react';

interface MemoryPhoto {
  id: string;
  season: string;
  year: string;
  title: string;
  caption: string;
  url: string;
  tag: '16Y' | '15Y' | '14Y' | 'TEAMBUILDING' | 'ACTIVITY';
  likes: number;
}

const MEMORIES: MemoryPhoto[] = [
  {
    id: 'm1',
    season: 'Sinh nhật 16Y',
    year: '2025',
    title: 'Đêm Hoàng Kim Cóc 16 Tuổi',
    caption: 'Hơn 120 Cóc Vàng tề tựu trong không gian ấm áp tại Sài Gòn, cùng thổi nến mừng 16 năm trưởng thành.',
    url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80',
    tag: '16Y',
    likes: 184
  },
  {
    id: 'm2',
    season: 'Sinh nhật 15Y',
    year: '2024',
    title: 'Dấu Ấn Tròn 15 Năm Bứt Phá',
    caption: 'Chiếc bánh kem 3 tầng khổng lồ và màn tri ân các thế hệ tiền bối đã đặt nền móng cho CLB từ những ngày đầu.',
    url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=800&q=80',
    tag: '15Y',
    likes: 242
  },
  {
    id: 'm3',
    season: 'Teambuilding',
    year: '2025',
    title: 'Sóng Biển Vũng Tàu & Màu Áo Vàng',
    caption: 'Cháy hết mình với các trò chơi gắn kết bãi biển, nơi những người xa lạ thành anh em một nhà.',
    url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
    tag: 'TEAMBUILDING',
    likes: 195
  },
  {
    id: 'm4',
    season: 'Sinh nhật 14Y',
    year: '2023',
    title: 'Gala Night 14Y: Ký Ức Rực Rỡ',
    caption: 'Sân khấu âm nhạc sôi động với các tiết mục "cây nhà lá vườn" đậm chất phóng khoáng của Cóc Sài Gòn.',
    url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
    tag: '14Y',
    likes: 167
  },
  {
    id: 'm5',
    season: 'Tác nghiệp',
    year: '2025',
    title: 'Hậu trường Tác nghiệp Sự kiện Nghìn Người',
    caption: 'Những đêm thức trắng dựng clip, chỉnh ảnh để kịp lên bài cho những sự kiện lớn của trường F.',
    url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
    tag: 'ACTIVITY',
    likes: 210
  },
  {
    id: 'm6',
    season: 'Chào Tân Binh',
    year: '2024',
    title: 'Chào Đón Thế Hệ FPTU Khóa Mới',
    caption: 'Nụ cười rạng rỡ của các bạn Gen mới khi lần đầu tiên khoác lên mình chiếc áo thun vàng thương hiệu Cóc.',
    url: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=800&q=80',
    tag: 'ACTIVITY',
    likes: 289
  }
];

export const MemoryWall: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [likesState, setLikesState] = useState<{ [key: string]: number }>({});

  const handleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikesState(prev => ({
      ...prev,
      [id]: (prev[id] || 0) + 1
    }));
  };

  const filteredPhotos = activeFilter === 'ALL'
    ? MEMORIES
    : MEMORIES.filter(m => m.tag === activeFilter);

  const selectedPhoto = selectedPhotoIndex !== null ? filteredPhotos[selectedPhotoIndex] : null;

  // Navigate lightbox photos
  const handlePrev = useCallback(() => {
    if (selectedPhotoIndex === null) return;
    setSelectedPhotoIndex((selectedPhotoIndex - 1 + filteredPhotos.length) % filteredPhotos.length);
  }, [selectedPhotoIndex, filteredPhotos.length]);

  const handleNext = useCallback(() => {
    if (selectedPhotoIndex === null) return;
    setSelectedPhotoIndex((selectedPhotoIndex + 1) % filteredPhotos.length);
  }, [selectedPhotoIndex, filteredPhotos.length]);

  // Keyboard navigation for accessible lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedPhotoIndex === null) return;
      if (e.key === 'Escape') {
        setSelectedPhotoIndex(null);
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhotoIndex, handlePrev, handleNext]);

  return (
    <section id="ky-niem" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Editorial Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b-2 border-csg-black mb-12">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="stamp-seal text-[10px]">PHOTOBOOK TƯ LIỆU</span>
            <span className="text-xs font-mono text-csg-black/60 uppercase tracking-widest">
              17 Năm Kỷ Niệm (2009 - 2026)
            </span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-black uppercase tracking-tight text-csg-black leading-tight">
            Những Năm Tháng <span className="underline decoration-csg-yellow decoration-4 decoration-wavy">Mình Đã Cùng Nhau</span>
          </h2>
          <p className="text-csg-black/80 text-sm sm:text-base font-serif italic max-w-2xl mt-2">
            "Mỗi bức ảnh là một trang nhật ký, đọng lại từng nụ cười, giọt mồ hôi và sắc áo vàng nhiệt huyết của thời sinh viên."
          </p>
        </div>

        {/* Filter tags with Editorial button styling */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {[
            { id: 'ALL', label: 'Tất cả kỷ niệm' },
            { id: '16Y', label: 'Sinh nhật 16Y' },
            { id: '15Y', label: 'Sinh nhật 15Y' },
            { id: '14Y', label: 'Sinh nhật 14Y' },
            { id: 'TEAMBUILDING', label: 'Teambuilding' },
            { id: 'ACTIVITY', label: 'Tác nghiệp' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => {
                setActiveFilter(f.id);
                setSelectedPhotoIndex(null);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all border min-h-[38px] ${
                activeFilter === f.id
                  ? 'bg-csg-black text-csg-paper border-csg-black shadow-paper-sm font-bold'
                  : 'bg-csg-surface text-csg-black/80 border-csg-black/20 hover:bg-csg-paper hover:border-csg-black'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Asymmetric Photobook Collage Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredPhotos.map((photo, index) => {
          const totalLikes = photo.likes + (likesState[photo.id] || 0);
          const rotations = ['-rotate-1', 'rotate-0', 'rotate-1', 'rotate-0.5', '-rotate-0.5', 'rotate-1.5'];
          const rotationClass = rotations[index % rotations.length];

          return (
            <div
              key={photo.id}
              onClick={() => setSelectedPhotoIndex(index)}
              className={`polaroid-tape group bg-csg-surface p-4 rounded-xl border-2 border-csg-black shadow-paper-sm hover:shadow-paper-lg transition-all duration-300 cursor-pointer ${rotationClass} hover:rotate-0 hover:-translate-y-1.5`}
            >
              {/* Photo Image with Analog border */}
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden mb-3.5 bg-csg-muted border border-csg-black/20">
                <img
                  src={photo.url}
                  alt={photo.title}
                  className="w-full h-full object-cover grayscale-[15%] group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105"
                  loading="lazy"
                />

                {/* Season Label Stamp */}
                <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-md bg-csg-paper/95 backdrop-blur-sm border border-csg-black/30 text-csg-black text-[10px] font-mono font-bold tracking-wider uppercase shadow-sm">
                  {photo.year}
                </div>

                {/* Hover zoom overlay */}
                <div className="absolute inset-0 bg-csg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="px-4 py-2 rounded-full bg-csg-paper text-csg-black text-xs font-mono font-bold flex items-center gap-1.5 shadow-paper-md border border-csg-black">
                    <ZoomIn className="w-3.5 h-3.5 text-csg-red" />
                    <span>Xem phóng to</span>
                  </div>
                </div>
              </div>

              {/* Photo Information */}
              <div className="px-1 space-y-2">
                <div className="flex items-center justify-between text-xs text-csg-black/70 font-mono">
                  <span className="text-csg-red font-bold uppercase">{photo.season}</span>
                  <button
                    onClick={(e) => handleLike(photo.id, e)}
                    className="flex items-center gap-1.5 hover:text-csg-red transition-colors p-1.5 rounded-md hover:bg-csg-paper"
                    title="Thả tim kỷ niệm"
                    aria-label={`Thả tim cho ảnh ${photo.title}`}
                  >
                    <Heart className="w-4 h-4 fill-csg-red/20 text-csg-red" />
                    <span className="font-bold">{totalLikes}</span>
                  </button>
                </div>

                <h3 className="text-base sm:text-lg font-bold font-display text-csg-black group-hover:text-csg-red transition-colors line-clamp-1">
                  {photo.title}
                </h3>

                <p className="text-xs text-csg-black/80 leading-relaxed font-sans line-clamp-2">
                  {photo.caption}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Accessible Keyboard-Controlled Lightbox Modal */}
      {selectedPhoto && selectedPhotoIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={selectedPhoto.title}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-csg-black/90 backdrop-blur-md animate-fadeIn"
          onClick={() => setSelectedPhotoIndex(null)}
        >
          {/* Lightbox Container */}
          <div
            className="relative max-w-4xl w-full bg-csg-paper border-2 border-csg-black rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar with Counter & Close */}
            <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
              <div className="pointer-events-auto px-3 py-1 rounded-full bg-csg-black/80 text-csg-yellow font-mono text-xs font-bold shadow-sm">
                {selectedPhotoIndex + 1} / {filteredPhotos.length}
              </div>

              <button
                onClick={() => setSelectedPhotoIndex(null)}
                aria-label="Đóng xem ảnh"
                className="pointer-events-auto w-10 h-10 rounded-full bg-csg-black text-csg-paper hover:bg-csg-red transition-colors flex items-center justify-center shadow-lg border border-csg-paper/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Left Nav Button */}
            <button
              onClick={handlePrev}
              aria-label="Ảnh trước đó"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-csg-paper/90 hover:bg-csg-yellow text-csg-black transition-all flex items-center justify-center shadow-paper-sm border-2 border-csg-black"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Right Nav Button */}
            <button
              onClick={handleNext}
              aria-label="Ảnh tiếp theo"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-csg-paper/90 hover:bg-csg-yellow text-csg-black transition-all flex items-center justify-center shadow-paper-sm border-2 border-csg-black"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Image Preview */}
            <div className="max-h-[65vh] bg-csg-black flex items-center justify-center overflow-hidden">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.title}
                className="max-h-[65vh] w-auto object-contain select-none"
              />
            </div>

            {/* Caption & Metadata Section */}
            <div className="p-6 bg-csg-surface border-t-2 border-csg-black">
              <div className="flex items-center justify-between mb-3">
                <span className="stamp-seal text-xs">
                  {selectedPhoto.season} • NĂM {selectedPhoto.year}
                </span>
                <span className="text-xs font-mono text-csg-black/60 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-csg-red" /> Tư liệu CLB Truyền Thông Cóc Sài Gòn
                </span>
              </div>
              <h4 className="text-xl sm:text-2xl font-black font-display text-csg-black mb-2 uppercase">
                {selectedPhoto.title}
              </h4>
              <p className="text-csg-black/80 text-sm sm:text-base leading-relaxed font-sans">
                {selectedPhoto.caption}
              </p>
              <div className="mt-4 pt-3 border-t border-csg-black/10 flex items-center justify-between text-xs font-mono text-csg-black/60">
                <span>Phím tắt: [←] Ảnh trước • [→] Ảnh sau • [Esc] Đóng</span>
                <span className="text-csg-red font-bold">#CocSaiGon17Y</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
