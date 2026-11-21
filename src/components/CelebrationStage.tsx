import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, Search, Volume2, VolumeX, PartyPopper, 
  X, CheckCircle, ArrowLeft, ExternalLink, Ticket
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MascotFrog, MemberRole, RegistrationRecord } from '../types';
import { audioService } from '../services/audioService';

export interface CelebrationStageProps {
  characters: MascotFrog[];
  onOpenRegister?: () => void;
  isModal?: boolean;
  onClose?: () => void;
  newRegistrant?: RegistrationRecord | null;
  onOpenPortal?: () => void;
}

export const CelebrationStage: React.FC<CelebrationStageProps> = ({
  characters,
  onOpenRegister,
  isModal = false,
  onClose,
  newRegistrant,
  onOpenPortal
}) => {
  const [selectedRole, setSelectedRole] = useState<'ALL' | MemberRole>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCharacter, setActiveCharacter] = useState<MascotFrog | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Combine external characters with newRegistrant if provided
  const allCharacters = useMemo(() => {
    if (!newRegistrant) return characters;
    const existing = characters.some(
      c => c.id === `frog-${newRegistrant.id}` || c.name.toLowerCase().includes(newRegistrant.fullName.toLowerCase())
    );
    if (existing) return characters;

    const myFrog: MascotFrog = {
      id: `frog-${newRegistrant.id}`,
      name: `${newRegistrant.honorific} ${newRegistrant.fullName}`,
      role: newRegistrant.role,
      wish: newRegistrant.wishes?.trim() || 'Mừng sinh nhật 17 năm Cóc Sài Gòn rực rỡ và bùng cháy! 🎉',
      x: 50,
      y: 74,
      scale: 1.25,
      direction: 1
    };
    return [myFrog, ...characters];
  }, [characters, newRegistrant]);

  // Positions for stage walk simulation
  const [positions, setPositions] = useState<{ [id: string]: { x: number; y: number; dir: number } }>({});

  // Confetti blast trigger
  const triggerConfettiBlast = (e?: React.MouseEvent) => {
    if (soundEnabled) {
      audioService.playCelebrationChime();
    }
    const originX = e ? e.clientX / window.innerWidth : 0.5;
    const originY = e ? e.clientY / window.innerHeight : 0.55;

    confetti({
      particleCount: 75,
      spread: 80,
      origin: { x: originX, y: originY },
      colors: ['#F4C542', '#20231F', '#B94D35', '#10B981', '#F4EEDF']
    });
  };

  useEffect(() => {
    // Generate initial stage floor positions
    const pos: { [id: string]: { x: number; y: number; dir: number } } = {};
    allCharacters.forEach((c, idx) => {
      const isNewUser = newRegistrant && (c.id === `frog-${newRegistrant.id}` || c.name.includes(newRegistrant.fullName));
      pos[c.id] = {
        x: isNewUser ? 50 : (c.x || 12 + ((idx * 26) % 76)),
        y: isNewUser ? 74 : (c.y || 70 + ((idx * 4) % 15)),
        dir: c.direction || (idx % 2 === 0 ? 1 : -1)
      };
    });
    setPositions(pos);

    // Initial confetti celebration if new registrant just joined
    if (newRegistrant) {
      triggerConfettiBlast();
      const myFrog = allCharacters.find(c => c.id === `frog-${newRegistrant.id}` || c.name.includes(newRegistrant.fullName));
      if (myFrog) {
        setActiveCharacter(myFrog);
      }
    }

    // Subtle ambient walking drift across the stage floor
    const interval = setInterval(() => {
      setPositions(prev => {
        const next = { ...prev };
        allCharacters.forEach(c => {
          if (!next[c.id]) return;
          let { x, y, dir } = next[c.id];
          const isCenter = newRegistrant && (c.id === `frog-${newRegistrant.id}` || c.name.includes(newRegistrant.fullName));
          const speed = isCenter ? 0.05 : 0.12;
          x += dir * speed;

          if (x > 88) {
            x = 88;
            dir = -1;
          } else if (x < 12) {
            x = 12;
            dir = 1;
          }

          next[c.id] = { x, y, dir };
        });
        return next;
      });
    }, 60);

    return () => clearInterval(interval);
  }, [allCharacters, newRegistrant]);

  // Filter characters
  const filtered = allCharacters.filter(c => {
    const matchRole = selectedRole === 'ALL' || c.role === selectedRole;
    const matchSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.wish.toLowerCase().includes(searchTerm.toLowerCase());
    return matchRole && matchSearch;
  });

  const handleCharacterClick = (c: MascotFrog, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveCharacter(c);
    triggerConfettiBlast(e);
  };

  // Main stage body
  const stageContent = (
    <div className="w-full space-y-4">
      {/* New Registrant Celebration Banner */}
      {newRegistrant && (
        <div className="p-4 sm:p-5 rounded-sm bg-[#F4C542] border-2 border-[#20231F] shadow-poster-sm flex flex-col md:flex-row items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-3.5 text-left w-full md:w-auto">
            <span className="w-12 h-12 rounded-sm bg-white border-2 border-[#20231F] flex items-center justify-center text-2xl shrink-0 shadow-sm animate-bounce">
              🐸
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-display font-black text-lg sm:text-xl uppercase text-[#20231F] leading-tight">
                  BẠN ĐÃ LÊN SÂN KHẤU KỶ NIỆM 17Y!
                </h4>
                <span className="stamp-seal text-[9px]">OFFICIAL</span>
              </div>
              <p className="text-xs text-[#20231F]/80 font-mono mt-1">
                Chào mừng <strong>{newRegistrant.honorific} {newRegistrant.fullName}</strong> ({newRegistrant.role === 'ALUMNI' ? 'Cựu Thành Viên' : 'Thành Viên'}) • Mã vé: <strong className="bg-white px-1.5 py-0.5 rounded border border-[#20231F]">{newRegistrant.id}</strong> • Đã nộp: <strong>{newRegistrant.paidAmount.toLocaleString('vi-VN')} đ</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
            {onOpenPortal && (
              <button
                type="button"
                onClick={onOpenPortal}
                className="btn-editorial-secondary px-4 py-2.5 rounded-sm text-xs font-bold uppercase flex items-center justify-center gap-1.5 flex-1 md:flex-initial"
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>Tra cứu vé</span>
              </button>
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="btn-editorial-primary px-5 py-2.5 rounded-sm text-xs font-display text-base uppercase flex items-center justify-center gap-1.5 flex-1 md:flex-initial shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Thoát ra trang chủ</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Control Bar: Filters, Search, Sound, Confetti */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-sm border-2 border-[#20231F] shadow-poster-sm">
        {/* Role Filters */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 font-mono">
          <button
            type="button"
            onClick={() => setSelectedRole('ALL')}
            className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-all whitespace-nowrap border-2 ${
              selectedRole === 'ALL'
                ? 'bg-[#20231F] text-white border-[#20231F]'
                : 'bg-[#F4EEDF] text-[#20231F] border-[#20231F]/30 hover:border-[#20231F]'
            }`}
          >
            Tất cả ({allCharacters.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('ALUMNI')}
            className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-all whitespace-nowrap border-2 ${
              selectedRole === 'ALUMNI'
                ? 'bg-[#20231F] text-white border-[#20231F]'
                : 'bg-[#F4EEDF] text-[#20231F] border-[#20231F]/30 hover:border-[#20231F]'
            }`}
          >
            🎓 Cựu TV ({allCharacters.filter(c => c.role === 'ALUMNI').length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('ACTIVE')}
            className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-all whitespace-nowrap border-2 ${
              selectedRole === 'ACTIVE'
                ? 'bg-[#20231F] text-white border-[#20231F]'
                : 'bg-[#F4EEDF] text-[#20231F] border-[#20231F]/30 hover:border-[#20231F]'
            }`}
          >
            ⚡ Thành viên ({allCharacters.filter(c => c.role === 'ACTIVE').length})
          </button>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-[#20231F]/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm tên hoặc lời chúc..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#F4EEDF] rounded-sm border border-[#20231F] text-xs font-mono text-[#20231F] placeholder-[#20231F]/40 focus:outline-none focus:ring-1 focus:ring-[#F4C542]"
            />
          </div>

          <button
            type="button"
            onClick={() => triggerConfettiBlast()}
            className="btn-editorial-primary px-3.5 py-1.5 rounded-sm text-xs font-bold uppercase flex items-center gap-1.5 shadow-sm whitespace-nowrap"
            title="Bắn pháo hoa ăn mừng"
          >
            <PartyPopper className="w-4 h-4" />
            <span>Pháo Hoa 🎉</span>
          </button>

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-sm bg-white border border-[#20231F] hover:bg-[#F4EEDF] text-[#20231F] transition-colors"
            title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-[#B94D35]" />}
          </button>
        </div>
      </div>

      {/* Theatrical Stage Canvas */}
      <div className="relative w-full h-[480px] sm:h-[560px] rounded-sm bg-gradient-to-b from-[#F2EADB] to-[#E3D9C5] border-2 border-[#20231F] overflow-hidden shadow-poster select-none">
        {/* Backdrop Decorations */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          {/* Spotlight cones */}
          <div className="absolute -top-12 left-1/4 -translate-x-1/2 w-72 h-[450px] bg-gradient-to-b from-[#F4C542]/35 via-[#F4C542]/10 to-transparent transform -rotate-12 blur-2xl" />
          <div className="absolute -top-12 right-1/4 translate-x-1/2 w-72 h-[450px] bg-gradient-to-b from-[#F4C542]/35 via-[#F4C542]/10 to-transparent transform rotate-12 blur-2xl" />
          
          {/* Garland */}
          <div className="absolute top-0 left-0 right-0 h-10 border-b border-dashed border-[#20231F]/20 flex justify-around px-2">
            {[...Array(16)].map((_, i) => (
              <div 
                key={i} 
                className={`w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[18px] ${
                  i % 3 === 0 ? 'border-t-[#F4C542]' : i % 3 === 1 ? 'border-t-[#B94D35]' : 'border-t-[#20231F]'
                }`}
              />
            ))}
          </div>

          {/* Center Stage Banner */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center">
            <div className="inline-block px-5 py-2 bg-white/90 border-2 border-[#20231F] rounded-sm shadow-sm">
              <span className="font-display font-black text-xs sm:text-sm tracking-widest text-[#20231F] uppercase">
                🎉 ĐẠI TIỆC GALA KỶ NIỆM CÓC SÀI GÒN 17Y 🎉
              </span>
            </div>
          </div>
        </div>

        {/* Stage Wooden Floor */}
        <div className="absolute bottom-0 left-0 right-0 h-44 bg-[#D4C3A3] border-t-2 border-[#20231F] overflow-hidden">
          <div className="w-full h-full opacity-30 bg-[repeating-linear-gradient(90deg,#8C7355_0px,#8C7355_2px,transparent_2px,transparent_60px)]" />
          <div className="absolute bottom-0 left-0 right-0 h-5 bg-[#20231F]/15" />
          
          {/* Footlights */}
          <div className="absolute top-1 left-0 right-0 flex justify-between px-6 sm:px-10">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="w-2.5 h-2.5 rounded-full bg-[#F4C542] border border-[#20231F]/60 shadow-sm" />
            ))}
          </div>
        </div>

        {/* Mascot Frogs On Stage */}
        {filtered.map((c) => {
          const pos = positions[c.id] || { x: c.x || 50, y: c.y || 75, dir: 1 };
          const isUserFrog = newRegistrant && (c.id === `frog-${newRegistrant.id}` || c.name.includes(newRegistrant.fullName));

          return (
            <div
              key={c.id}
              onClick={(e) => handleCharacterClick(c, e)}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: `translate(-50%, -50%) scaleX(${pos.dir})`,
                zIndex: isUserFrog ? 35 : 20
              }}
              className="absolute cursor-pointer transition-transform duration-75 group select-none hover:z-40"
              title={`Nhấp để xem lời chúc của ${c.name}`}
            >
              {/* Highlight Halo for New Registrant */}
              {isUserFrog && (
                <div className="absolute -inset-6 rounded-full bg-[#F4C542]/30 border-2 border-dashed border-[#B94D35] animate-spin -z-10" style={{ animationDuration: '8s' }} />
              )}

              {/* Speech Bubble (Upright) */}
              <div 
                style={{ transform: `scaleX(${pos.dir})` }}
                className={`absolute -top-24 sm:-top-28 left-1/2 -translate-x-1/2 w-48 sm:w-60 p-2.5 rounded-sm bg-white border-2 text-left shadow-poster transition-all duration-200 group-hover:scale-105 ${
                  isUserFrog ? 'border-[#B94D35] ring-2 ring-[#F4C542]' : 'border-[#20231F]'
                }`}
              >
                {isUserFrog && (
                  <span className="bg-[#B94D35] text-white font-mono font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider block text-center mb-1 animate-pulse">
                    ✨ BẠN Ở ĐÂY NÈ! ✨
                  </span>
                )}
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-bold text-[#20231F] font-display truncate">
                    {c.name}
                  </span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                    c.role === 'ALUMNI'
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  }`}>
                    {c.role === 'ALUMNI' ? 'Cựu TV' : 'Thành viên'}
                  </span>
                </div>
                <p className="text-[11px] text-[#20231F]/90 font-serif italic line-clamp-2 leading-tight">
                  "{c.wish}"
                </p>
                {/* Pointer */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-8 border-t-[#20231F]" />
              </div>

              {/* The Iconic Yellow-Shirt Cóc Sài Gòn 2D Vector Mascot */}
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 animate-float-gentle">
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
                  {/* Frog Body */}
                  <ellipse cx="50" cy="58" rx="30" ry="26" fill="#10B981" stroke="#20231F" strokeWidth="2.5" />
                  <ellipse cx="50" cy="62" rx="20" ry="16" fill="#34D399" opacity="0.4" />

                  {/* Eyes */}
                  <circle cx="34" cy="32" r="14" fill="#10B981" stroke="#20231F" strokeWidth="2.5" />
                  <circle cx="66" cy="32" r="14" fill="#10B981" stroke="#20231F" strokeWidth="2.5" />
                  <circle cx="34" cy="32" r="10" fill="#FFFFFF" />
                  <circle cx="66" cy="32" r="10" fill="#FFFFFF" />
                  
                  {/* Pupils */}
                  <circle cx="36" cy="32" r="5" fill="#20231F" />
                  <circle cx="68" cy="32" r="5" fill="#20231F" />
                  <circle cx="38" cy="30" r="2" fill="#FFFFFF" />
                  <circle cx="70" cy="30" r="2" fill="#FFFFFF" />

                  {/* Mouth */}
                  <path d="M 38 46 Q 50 56 62 46" fill="none" stroke="#20231F" strokeWidth="3" strokeLinecap="round" />
                  {/* Cheeks */}
                  <ellipse cx="30" cy="46" rx="5" ry="3" fill="#F43F5E" opacity="0.6" />
                  <ellipse cx="70" cy="46" rx="5" ry="3" fill="#F43F5E" opacity="0.6" />

                  {/* Yellow Shirt */}
                  <path 
                    d="M 27 58 Q 50 52 73 58 L 75 79 Q 50 83 25 79 Z" 
                    fill="#F4C542" 
                    stroke="#20231F" 
                    strokeWidth="2.5" 
                  />
                  {/* Collar */}
                  <path d="M 42 56 L 50 64 L 58 56 Z" fill="#B94D35" stroke="#20231F" strokeWidth="1.5" />
                  {/* Logo Text */}
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

                {/* Ground Shadow */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-14 h-3 bg-[#20231F]/25 rounded-full blur-[2px] -z-10" />
              </div>
            </div>
          );
        })}

        {/* Empty Search State */}
        {filtered.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
            <span className="text-4xl mb-2">🔍</span>
            <p className="font-display font-bold text-[#20231F] text-sm">Không tìm thấy Cóc nào khớp với từ khóa</p>
            <p className="text-xs text-[#20231F]/60 font-mono mt-1">Hãy thử xóa bộ lọc hoặc tìm tên khác bạn nhé.</p>
          </div>
        )}

        {/* Join CTA if not yet registered and onOpenRegister is available */}
        {!newRegistrant && onOpenRegister && (
          <div className="absolute bottom-4 right-4 z-30">
            <button
              type="button"
              onClick={onOpenRegister}
              className="btn-editorial-primary px-4 py-2.5 rounded-sm text-xs font-display font-black uppercase tracking-wider shadow-poster-sm flex items-center gap-2"
            >
              <span>Tham Gia Sân Khấu Ngay</span>
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // If in modal mode, wrap inside a fixed overlay
  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#20231F]/90 backdrop-blur-md overflow-y-auto animate-fadeIn">
        <div 
          className="relative w-full max-w-6xl bg-[#F4EEDF] border-2 border-[#20231F] rounded-sm shadow-poster-lg overflow-hidden my-auto flex flex-col max-h-[95vh] animate-paper-unfold"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b-2 border-[#20231F] bg-white">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-sm bg-[#F4C542] border-2 border-[#20231F] flex items-center justify-center text-xl shadow-sm">
                🐸
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-base sm:text-lg font-black tracking-wider text-[#20231F] uppercase">
                    SÂN KHẤU KỶ NIỆM 17 NĂM CÓC SÀI GÒN
                  </h3>
                  <span className="stamp-seal text-[9px]">LIVE STAGE</span>
                </div>
                <p className="text-[11px] font-mono text-[#20231F]/70 hidden sm:block">
                  Hội ngộ các thế hệ Cóc Áo Vàng • Không gian kỷ niệm chung
                </p>
              </div>
            </div>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-sm bg-[#20231F] text-white hover:bg-[#B94D35] text-xs font-mono font-bold uppercase transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">VỀ TRANG CHỦ</span>
              </button>
            )}
          </div>

          {/* Modal Stage Content */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 font-body">
            {stageContent}
          </div>
        </div>

        {/* Keepsake Modal for Clicked Frog */}
        {activeCharacter && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-md bg-[#F4EEDF] rounded-sm border-2 border-[#20231F] p-6 shadow-poster-lg animate-paper-unfold">
              <button
                type="button"
                onClick={() => setActiveCharacter(null)}
                className="absolute top-4 right-4 p-1.5 rounded-sm border border-[#20231F] hover:bg-white text-[#20231F] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-sm bg-[#F4C542] border-2 border-[#20231F] flex items-center justify-center text-2xl shadow-sm">
                  🐸
                </div>
                <div>
                  <h3 className="font-display font-black text-xl text-[#20231F]">
                    {activeCharacter.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="stamp-seal text-[10px]">
                      {activeCharacter.role === 'ALUMNI' ? 'CỰU THÀNH VIÊN' : 'THÀNH VIÊN ĐƯƠNG NHIỆM'}
                    </span>
                    <span className="text-[11px] font-mono text-[#20231F]/60">
                      Sắc Áo Vàng 17Y
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-sm bg-white border-2 border-[#20231F] mb-4 relative shadow-poster-sm">
                <span className="text-xs font-mono font-bold text-[#B94D35] block mb-1">
                  LỜI CHÚC SINH NHẬT 17Y:
                </span>
                <p className="font-serif italic text-sm text-[#20231F] leading-relaxed">
                  "{activeCharacter.wish}"
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#20231F]/20">
                <span className="text-[11px] font-mono text-[#20231F]/60">
                  CLB Truyền Thông Cóc Sài Gòn
                </span>
                <button
                  type="button"
                  onClick={() => {
                    triggerConfettiBlast();
                    setActiveCharacter(null);
                  }}
                  className="px-4 py-2 rounded-sm bg-[#20231F] text-white font-bold text-xs uppercase hover:bg-[#B94D35] transition-colors shadow-sm"
                >
                  Gửi Tim Chúc Mừng 💛
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Non-modal inline rendering (e.g. inside Screen 6 of RegistrationModal)
  return (
    <div className="w-full">
      {stageContent}

      {/* Keepsake Modal for Clicked Frog */}
      {activeCharacter && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#F4EEDF] rounded-sm border-2 border-[#20231F] p-6 shadow-poster-lg animate-paper-unfold">
            <button
              type="button"
              onClick={() => setActiveCharacter(null)}
              className="absolute top-4 right-4 p-1.5 rounded-sm border border-[#20231F] hover:bg-white text-[#20231F] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-sm bg-[#F4C542] border-2 border-[#20231F] flex items-center justify-center text-2xl shadow-sm">
                🐸
              </div>
              <div>
                <h3 className="font-display font-black text-xl text-[#20231F]">
                  {activeCharacter.name}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="stamp-seal text-[10px]">
                    {activeCharacter.role === 'ALUMNI' ? 'CỰU THÀNH VIÊN' : 'THÀNH VIÊN ĐƯƠNG NHIỆM'}
                  </span>
                  <span className="text-[11px] font-mono text-[#20231F]/60">
                    Sắc Áo Vàng 17Y
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-sm bg-white border-2 border-[#20231F] mb-4 relative shadow-poster-sm">
              <span className="text-xs font-mono font-bold text-[#B94D35] block mb-1">
                LỜI CHÚC SINH NHẬT 17Y:
              </span>
              <p className="font-serif italic text-sm text-[#20231F] leading-relaxed">
                "{activeCharacter.wish}"
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#20231F]/20">
              <span className="text-[11px] font-mono text-[#20231F]/60">
                CLB Truyền Thông Cóc Sài Gòn
              </span>
              <button
                type="button"
                onClick={() => {
                  triggerConfettiBlast();
                  setActiveCharacter(null);
                }}
                className="px-4 py-2 rounded-sm bg-[#20231F] text-white font-bold text-xs uppercase hover:bg-[#B94D35] transition-colors shadow-sm"
              >
                Gửi Tim Chúc Mừng 💛
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
