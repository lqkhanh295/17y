import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Search, Filter, Volume2, VolumeX, Heart, PartyPopper, 
  MessageSquare, User, Calendar, ExternalLink, X, Award
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MascotFrog, MemberRole } from '../types';
import { audioService } from '../services/audioService';

interface CelebrationStageProps {
  characters: MascotFrog[];
  onOpenRegister: () => void;
}

export const CelebrationStage: React.FC<CelebrationStageProps> = ({
  characters,
  onOpenRegister
}) => {
  const [selectedRole, setSelectedRole] = useState<'ALL' | MemberRole>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCharacter, setActiveCharacter] = useState<MascotFrog | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Positions for stage walk simulation
  const [positions, setPositions] = useState<{ [id: string]: { x: number; y: number; dir: number } }>({});

  useEffect(() => {
    // Generate initial stage floor positions
    const pos: { [id: string]: { x: number; y: number; dir: number } } = {};
    characters.forEach((c, idx) => {
      pos[c.id] = {
        x: c.x || 10 + ((idx * 28) % 80),
        y: c.y || 68 + ((idx * 5) % 18),
        dir: c.direction || (idx % 2 === 0 ? 1 : -1)
      };
    });
    setPositions(pos);

    // Subtle ambient walking drift across the stage floor
    const interval = setInterval(() => {
      setPositions(prev => {
        const next = { ...prev };
        characters.forEach(c => {
          if (!next[c.id]) return;
          let { x, y, dir } = next[c.id];
          x += dir * 0.12;

          if (x > 90) {
            x = 90;
            dir = -1;
          } else if (x < 10) {
            x = 10;
            dir = 1;
          }

          next[c.id] = { x, y, dir };
        });
        return next;
      });
    }, 60);

    return () => clearInterval(interval);
  }, [characters]);

  // Filter characters
  const filtered = characters.filter(c => {
    const matchRole = selectedRole === 'ALL' || c.role === selectedRole;
    const matchSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.wish.toLowerCase().includes(searchTerm.toLowerCase());
    return matchRole && matchSearch;
  });

  // Confetti Blast Action
  const triggerConfettiBlast = (e?: React.MouseEvent) => {
    if (soundEnabled) {
      audioService.playCelebrationChime();
    }
    const originX = e ? e.clientX / window.innerWidth : 0.5;
    const originY = e ? e.clientY / window.innerHeight : 0.6;

    confetti({
      particleCount: 60,
      spread: 70,
      origin: { x: originX, y: originY },
      colors: ['#F4C542', '#20231F', '#B94D35', '#10B981', '#F4EEDF']
    });
  };

  const handleCharacterClick = (c: MascotFrog, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveCharacter(c);
    triggerConfettiBlast(e);
  };

  return (
    <section id="san-khau" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-csg-muted">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-csg-red uppercase mb-2">
            <span>SCENE 05 • CELEBRATION STAGE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-csg-red animate-ping" />
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-black uppercase text-csg-black tracking-tight">
            Sân Khấu Kỷ Niệm 17Y
          </h2>
          <p className="text-sm sm:text-base text-csg-black/70 font-sans mt-1 max-w-2xl">
            Nơi hội tụ của các thế hệ Cóc Vàng. Mỗi người tham dự sau khi đăng ký sẽ hóa thân thành một chú Cóc Áo Vàng trên sân khấu cùng lời chúc gửi đến CLB.
          </p>
        </div>

        {/* Stage interactive control buttons */}
        <div className="mt-4 md:mt-0 flex items-center gap-2">
          <button
            onClick={() => triggerConfettiBlast()}
            className="btn-editorial-primary px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm"
            title="Bắn pháo hoa giấy ăn mừng sinh nhật"
          >
            <PartyPopper className="w-4 h-4 text-csg-black" />
            <span>Pháo Hoa 🎉</span>
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-lg bg-csg-surface border border-csg-muted hover:border-csg-black text-csg-black/80 transition-colors"
            title={soundEnabled ? 'Tắt âm thanh tương tác' : 'Bật âm thanh tương tác'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-csg-red" />}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 bg-csg-surface p-3 rounded-xl border border-csg-muted">
        {/* Role Filters */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedRole('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              selectedRole === 'ALL'
                ? 'bg-csg-black text-csg-paper shadow-sm'
                : 'bg-csg-paper/70 text-csg-black/80 hover:bg-csg-paper border border-csg-muted'
            }`}
          >
            Tất cả ({characters.length})
          </button>
          <button
            onClick={() => setSelectedRole('ALUMNI')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              selectedRole === 'ALUMNI'
                ? 'bg-csg-black text-csg-paper shadow-sm'
                : 'bg-csg-paper/70 text-csg-black/80 hover:bg-csg-paper border border-csg-muted'
            }`}
          >
            🎓 Cựu Thành Viên ({characters.filter(c => c.role === 'ALUMNI').length})
          </button>
          <button
            onClick={() => setSelectedRole('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              selectedRole === 'ACTIVE'
                ? 'bg-csg-black text-csg-paper shadow-sm'
                : 'bg-csg-paper/70 text-csg-black/80 hover:bg-csg-paper border border-csg-muted'
            }`}
          >
            ⚡ Thành Viên Đương Nhiệm ({characters.filter(c => c.role === 'ACTIVE').length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-csg-black/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc lời chúc..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-csg-paper rounded-lg border border-csg-muted text-xs font-sans text-csg-black placeholder-csg-black/40 focus:outline-none focus:border-csg-yellow focus:ring-1 focus:ring-csg-yellow"
          />
        </div>
      </div>

      {/* Main Theatrical Stage Canvas */}
      <div className="relative w-full h-[480px] sm:h-[560px] rounded-2xl bg-gradient-to-b from-[#F2EADB] to-[#E3D9C5] border-2 border-csg-black overflow-hidden shadow-paper-lg select-none">
        {/* Stage Backdrop Decorations */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          {/* Spotlight cone simulation */}
          <div className="absolute -top-12 left-1/4 -translate-x-1/2 w-64 h-96 bg-gradient-to-b from-csg-yellow/30 via-csg-yellow/10 to-transparent transform -rotate-12 blur-2xl" />
          <div className="absolute -top-12 right-1/4 translate-x-1/2 w-64 h-96 bg-gradient-to-b from-csg-yellow/30 via-csg-yellow/10 to-transparent transform rotate-12 blur-2xl" />
          
          {/* Hanging Party Bunting Garland */}
          <div className="absolute top-0 left-0 right-0 h-10 border-b border-dashed border-csg-black/20 flex justify-around px-2">
            {[...Array(14)].map((_, i) => (
              <div 
                key={i} 
                className={`w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] ${
                  i % 3 === 0 ? 'border-t-csg-yellow' : i % 3 === 1 ? 'border-t-csg-red' : 'border-t-csg-black'
                }`}
              />
            ))}
          </div>

          {/* Stage Banner */}
          <div className="absolute top-10 left-1/2 -translate-x-1/2 text-center">
            <div className="inline-block px-6 py-2 bg-csg-paper/90 border border-csg-black rounded-lg shadow-sm">
              <span className="font-display font-black text-xs sm:text-sm tracking-widest text-csg-black uppercase">
                🎉 ĐẠI TIỆC GALA SINH NHẬT CÓC SÀI GÒN 17Y 🎉
              </span>
            </div>
          </div>
        </div>

        {/* Stage Wooden Floor Plank Lines */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-[#D4C3A3] border-t-2 border-csg-black overflow-hidden">
          <div className="w-full h-full opacity-30 bg-[repeating-linear-gradient(90deg,#8C7355_0px,#8C7355_2px,transparent_2px,transparent_60px)]" />
          <div className="absolute bottom-0 left-0 right-0 h-5 bg-csg-black/15" />
          {/* Stage footlights */}
          <div className="absolute top-1 left-0 right-0 flex justify-between px-8">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="w-2.5 h-2.5 rounded-full bg-csg-yellow border border-csg-black/50 shadow-sm" />
            ))}
          </div>
        </div>

        {/* Stage Characters & Walking Frogs */}
        {filtered.map((c) => {
          const pos = positions[c.id] || { x: c.x || 50, y: c.y || 75, dir: 1 };
          return (
            <div
              key={c.id}
              onClick={(e) => handleCharacterClick(c, e)}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: `translate(-50%, -50%) scaleX(${pos.dir})`,
              }}
              className="absolute cursor-pointer transition-transform duration-75 group select-none z-20 hover:z-30"
              title={`Nhấp để xem lời chúc của ${c.name}`}
            >
              {/* Cycling Speech Bubble (Fixed scaleX so text is upright) */}
              <div 
                style={{ transform: `scaleX(${pos.dir})` }}
                className="absolute -top-20 left-1/2 -translate-x-1/2 w-48 sm:w-56 p-2 rounded-xl bg-csg-paper border-2 border-csg-black text-left shadow-paper-md transition-all duration-200 group-hover:scale-110 group-hover:shadow-paper-lg"
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[11px] font-bold text-csg-black font-display truncate">
                    {c.name}
                  </span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                    c.role === 'ALUMNI'
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  }`}>
                    {c.role === 'ALUMNI' ? 'Cựu TV' : 'Thành viên'}
                  </span>
                </div>
                <p className="text-[11px] text-csg-black/90 font-serif italic line-clamp-2 leading-tight">
                  "{c.wish}"
                </p>
                {/* Pointer triangle */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-8 border-t-csg-black" />
              </div>

              {/* The Iconic Yellow-Shirt Cóc Sài Gòn 2D Vector Mascot */}
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 animate-float-gentle">
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
                  {/* Frog Body Green */}
                  <ellipse cx="50" cy="58" rx="30" ry="26" fill="#10B981" stroke="#20231F" strokeWidth="2.5" />
                  <ellipse cx="50" cy="62" rx="20" ry="16" fill="#34D399" opacity="0.4" />

                  {/* Big Eyes */}
                  <circle cx="34" cy="32" r="14" fill="#10B981" stroke="#20231F" strokeWidth="2.5" />
                  <circle cx="66" cy="32" r="14" fill="#10B981" stroke="#20231F" strokeWidth="2.5" />
                  <circle cx="34" cy="32" r="10" fill="#FFFFFF" />
                  <circle cx="66" cy="32" r="10" fill="#FFFFFF" />
                  
                  {/* Pupils */}
                  <circle cx="36" cy="32" r="5" fill="#20231F" />
                  <circle cx="68" cy="32" r="5" fill="#20231F" />
                  <circle cx="38" cy="30" r="2" fill="#FFFFFF" />
                  <circle cx="70" cy="30" r="2" fill="#FFFFFF" />

                  {/* Smiling Mouth */}
                  <path d="M 38 46 Q 50 56 62 46" fill="none" stroke="#20231F" strokeWidth="3" strokeLinecap="round" />
                  {/* Rosy cheeks */}
                  <ellipse cx="30" cy="46" rx="5" ry="3" fill="#F43F5E" opacity="0.6" />
                  <ellipse cx="70" cy="46" rx="5" ry="3" fill="#F43F5E" opacity="0.6" />

                  {/* Signature Yellow Shirt (Áo Vàng Cóc Sài Gòn) */}
                  <path 
                    d="M 27 58 Q 50 52 73 58 L 75 79 Q 50 83 25 79 Z" 
                    fill="#F4C542" 
                    stroke="#20231F" 
                    strokeWidth="2.5" 
                  />
                  {/* Shirt Collar */}
                  <path d="M 42 56 L 50 64 L 58 56 Z" fill="#B94D35" stroke="#20231F" strokeWidth="1.5" />
                  {/* Logo text print */}
                  <text 
                    x="50" 
                    y="74" 
                    textAnchor="middle" 
                    fontSize="9" 
                    fontWeight="900" 
                    fontFamily="monospace" 
                    fill="#20231F"
                  >
                    CSG 17Y
                  </text>

                  {/* Feet */}
                  <ellipse cx="32" cy="85" rx="8" ry="4" fill="#059669" stroke="#20231F" strokeWidth="2" />
                  <ellipse cx="68" cy="85" rx="8" ry="4" fill="#059669" stroke="#20231F" strokeWidth="2" />
                </svg>

                {/* Ground shadow */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-14 h-3 bg-csg-black/25 rounded-full blur-[2px] -z-10" />
              </div>
            </div>
          );
        })}

        {/* Empty state if search filters match nothing */}
        {filtered.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
            <span className="text-4xl mb-2">🔍</span>
            <p className="font-display font-bold text-csg-black text-sm">Không tìm thấy Cóc nào khớp với từ khóa</p>
            <p className="text-xs text-csg-black/60 font-sans mt-1">Hãy thử xóa bộ lọc hoặc tìm tên khác bạn nhé.</p>
          </div>
        )}

        {/* Join CTA Badge on stage floor */}
        <div className="absolute bottom-4 right-4 z-30">
          <button
            onClick={onOpenRegister}
            className="btn-editorial-primary px-4 py-2.5 rounded-xl text-xs font-display font-black uppercase tracking-wider shadow-paper-md flex items-center gap-2"
          >
            <span>Tham Gia Sân Khấu Ngay</span>
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Keepsake Modal for Clicked Character */}
      {activeCharacter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-csg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-csg-paper rounded-2xl border-2 border-csg-black p-6 shadow-paper-lg animate-paper-unfold">
            {/* Close button */}
            <button
              onClick={() => setActiveCharacter(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg border border-csg-muted hover:border-csg-black text-csg-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header with seal */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-csg-yellow border-2 border-csg-black flex items-center justify-center text-2xl shadow-sm">
                🐸
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-black text-xl text-csg-black">
                    {activeCharacter.name}
                  </h3>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="stamp-seal text-[10px]">
                    {activeCharacter.role === 'ALUMNI' ? 'CỰU THÀNH VIÊN' : 'THÀNH VIÊN ĐƯƠNG NHIỆM'}
                  </span>
                  <span className="text-[11px] font-mono text-csg-black/60">
                    Sắc Áo Vàng 17Y
                  </span>
                </div>
              </div>
            </div>

            {/* Handwritten Wish Card */}
            <div className="p-4 rounded-xl bg-csg-surface border border-csg-muted mb-4 relative">
              <span className="text-xs font-mono font-bold text-csg-red block mb-1">
                LỜI CHÚC SINH NHẬT:
              </span>
              <p className="font-serif italic text-sm text-csg-black leading-relaxed">
                "{activeCharacter.wish}"
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-csg-muted">
              <span className="text-[11px] font-mono text-csg-black/60">
                CLB Truyền Thông Cóc Sài Gòn
              </span>
              <button
                onClick={() => {
                  triggerConfettiBlast();
                  setActiveCharacter(null);
                }}
                className="px-4 py-2 rounded-lg bg-csg-black text-csg-paper font-bold text-xs uppercase hover:bg-csg-black/80 transition-colors"
              >
                Gửi Tim Chúc Mừng 💛
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
