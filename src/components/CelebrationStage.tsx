import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Sparkles, Search, Volume2, VolumeX, PartyPopper, 
  X, CheckCircle, ArrowLeft, ExternalLink, Ticket, Lightbulb
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
  hideBanner?: boolean;
}

export const CelebrationStage: React.FC<CelebrationStageProps> = ({
  characters,
  onOpenRegister,
  isModal = false,
  onClose,
  newRegistrant,
  onOpenPortal,
  hideBanner = false
}) => {
  const [selectedRole, setSelectedRole] = useState<'ALL' | MemberRole>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCharacter, setActiveCharacter] = useState<MascotFrog | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [stageLightsOn, setStageLightsOn] = useState(true);

  // Close wish popup on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeCharacter) {
        setActiveCharacter(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeCharacter]);

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
      y: 68,
      scale: 1.25,
      direction: 1
    };
    return [myFrog, ...characters];
  }, [characters, newRegistrant]);

  // Positions for stage walk simulation
  const [positions, setPositions] = useState<{ [id: string]: { x: number; y: number; dir: number; speed: number; laneY: number; scale: number } }>({});
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [ambientSpeakerId, setAmbientSpeakerId] = useState<string | null>(null);

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

  // Ambient speaker rotation - every 4.5s cycle through frogs so only ONE speaks at a time
  useEffect(() => {
    if (allCharacters.length === 0) return;
    const candidateFrogs = allCharacters.filter(c => {
      const isUser = newRegistrant && (c.id === `frog-${newRegistrant.id}` || c.name.includes(newRegistrant.fullName));
      return !isUser;
    });
    if (candidateFrogs.length === 0) return;

    let idx = 0;
    const initialTimer = setTimeout(() => {
      setAmbientSpeakerId(candidateFrogs[0]?.id || null);
    }, 1200);

    const interval = setInterval(() => {
      idx = (idx + 1) % candidateFrogs.length;
      setAmbientSpeakerId(candidateFrogs[idx]?.id || null);
    }, 4800);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [allCharacters, newRegistrant]);

  useEffect(() => {
    // Generate initial stage floor positions with staggered lanes and depths
    const pos: { [id: string]: { x: number; y: number; dir: number; speed: number; laneY: number; scale: number } } = {};
    
    // Four distinct lanes to prevent clumping
    const lanes = [
      { x: 18, y: 64, dir: 1, speed: 0.08, scale: 0.88 },
      { x: 38, y: 78, dir: -1, speed: 0.1, scale: 1.05 },
      { x: 62, y: 67, dir: 1, speed: 0.07, scale: 0.92 },
      { x: 82, y: 76, dir: -1, speed: 0.09, scale: 1.02 }
    ];

    allCharacters.forEach((c, idx) => {
      const isNewUser = newRegistrant && (c.id === `frog-${newRegistrant.id}` || c.name.includes(newRegistrant.fullName));
      const lane = lanes[idx % lanes.length];
      const startX = isNewUser ? 50 : (c.x || lane.x);
      const startY = isNewUser ? 72 : (c.y || lane.y);
      const startScale = isNewUser ? 1.15 : (c.scale || lane.scale);

      pos[c.id] = {
        x: startX,
        y: startY,
        laneY: startY,
        dir: c.direction || lane.dir,
        speed: isNewUser ? 0.04 : lane.speed,
        scale: startScale
      };
    });
    setPositions(pos);

    // Initial confetti celebration if new registrant just joined
    if (newRegistrant) {
      triggerConfettiBlast();
    }

    // Subtle ambient walking drift across the real stage floor
    const interval = setInterval(() => {
      setPositions(prev => {
        const next = { ...prev };
        allCharacters.forEach(c => {
          if (!next[c.id]) return;
          let { x, y, dir, speed, laneY, scale } = next[c.id];
          const isCenter = newRegistrant && (c.id === `frog-${newRegistrant.id}` || c.name.includes(newRegistrant.fullName));
          
          x += dir * (speed || (isCenter ? 0.04 : 0.08));

          // Confine walking across the stage floor
          if (x > 84) {
            x = 84;
            dir = -1;
          } else if (x < 16) {
            x = 16;
            dir = 1;
          }

          next[c.id] = { x, y: laneY || y, dir, speed, laneY: laneY || y, scale: scale || 1 };
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
    <div className="w-full h-full flex flex-col flex-1 overflow-hidden">
      {/* Sleek Edge-to-Edge Top Navigation Bar */}
      <div className="w-full h-14 sm:h-12 bg-[#1A1816] border-b-2 border-[#F4C542] px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-3 shrink-0 z-40 select-none shadow-md pt-[env(safe-area-inset-top)]">
        {/* Left: Brand Identity / Registrant Greeting */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 shrink-0">
          <span className="w-8 h-8 rounded-sm bg-[#F4C542] border border-[#20231F] flex items-center justify-center text-lg shrink-0 shadow-xs">
            🐸
          </span>
          <div className="min-w-0 flex items-center gap-2">
            <span className="font-display font-black text-sm sm:text-base tracking-wider text-white uppercase whitespace-nowrap">
              SÂN KHẤU CÓC 17Y
            </span>
            {newRegistrant ? (
              <span className="text-xs font-mono text-[#F4C542] truncate hidden md:inline">
                • Chào mừng <strong>{newRegistrant.honorific} {newRegistrant.fullName}</strong> ({newRegistrant.role === 'ALUMNI' ? 'Cựu TV' : 'Thành viên'})! 🎉
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded-xs text-[9px] font-mono font-bold bg-[#F4C542] text-[#20231F] hidden sm:inline-block tracking-wider uppercase">
                LIVE 3D
              </span>
            )}
          </div>
        </div>

        {/* Center: Controls (Filters, Search, Effects) */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1 font-mono text-xs no-scrollbar overscroll-contain">
          {/* Role Filters */}
          <div className="flex items-center gap-1 bg-[#2D2A26] p-0.5 rounded-sm border border-white/10 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedRole('ALL')}
              className={`px-3 py-2 sm:py-1 min-h-[44px] sm:min-h-0 rounded-xs font-bold transition-all whitespace-nowrap text-xs active:scale-95 flex items-center ${
                selectedRole === 'ALL'
                  ? 'bg-[#F4C542] text-[#20231F] shadow-xs'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Tất cả ({allCharacters.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('ALUMNI')}
              className={`px-3 py-2 sm:py-1 min-h-[44px] sm:min-h-0 rounded-xs font-bold transition-all whitespace-nowrap text-xs active:scale-95 flex items-center ${
                selectedRole === 'ALUMNI'
                  ? 'bg-[#F4C542] text-[#20231F] shadow-xs'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              🎓 Cựu TV ({allCharacters.filter(c => c.role === 'ALUMNI').length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('ACTIVE')}
              className={`px-3 py-2 sm:py-1 min-h-[44px] sm:min-h-0 rounded-xs font-bold transition-all whitespace-nowrap text-xs active:scale-95 flex items-center ${
                selectedRole === 'ACTIVE'
                  ? 'bg-[#F4C542] text-[#20231F] shadow-xs'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              ⚡ Thành viên ({allCharacters.filter(c => c.role === 'ACTIVE').length})
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative w-32 sm:w-52 shrink-0">
            <Search className="w-3.5 h-3.5 text-white/40 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm tên hoặc lời chúc..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-2.5 py-2 sm:py-1 min-h-[44px] sm:min-h-0 bg-[#2D2A26] rounded-xs border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#F4C542]"
            />
          </div>

          {/* FX Triggers */}
          <button
            type="button"
            onClick={() => triggerConfettiBlast()}
            className="px-3 py-2 sm:py-1 min-h-[44px] sm:min-h-0 rounded-xs bg-[#F4C542] hover:bg-[#E5B532] text-[#20231F] font-bold text-xs uppercase flex items-center gap-1 shadow-xs whitespace-nowrap transition-colors active:scale-95 shrink-0"
            title="Bắn pháo hoa ăn mừng"
          >
            <PartyPopper className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pháo Hoa</span> 🎉
          </button>

          <button
            type="button"
            onClick={() => setStageLightsOn(!stageLightsOn)}
            className={`px-3 py-2 sm:py-1 min-h-[44px] sm:min-h-0 rounded-xs font-bold text-xs transition-all border flex items-center gap-1 whitespace-nowrap active:scale-95 shrink-0 ${
              stageLightsOn
                ? 'bg-[#2D2A26] text-[#F4C542] border-[#F4C542]'
                : 'bg-[#2D2A26] text-white/60 border-white/15 hover:border-white/40'
            }`}
            title={stageLightsOn ? 'Tắt đèn sân khấu' : 'Bật đèn sân khấu'}
          >
            <Lightbulb className={`w-3.5 h-3.5 ${stageLightsOn ? 'text-[#F4C542]' : 'text-white/40'}`} />
            <span className="hidden sm:inline">{stageLightsOn ? 'ĐÈN: BẬT' : 'ĐÈN: TẮT'}</span>
          </button>

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 sm:p-1 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 rounded-xs bg-[#2D2A26] border border-white/15 hover:border-white/40 text-white transition-colors active:scale-95 flex items-center justify-center shrink-0"
            title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#F4C542]" /> : <VolumeX className="w-3.5 h-3.5 text-rose-400" />}
          </button>
        </div>

        {/* Right: Exit / Return to Homepage */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-2.5 sm:px-3 py-1.5 min-h-[44px] min-w-[44px] rounded-sm bg-[#B94D35] hover:bg-[#A03C26] text-white font-mono font-bold text-xs uppercase transition-colors flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap shrink-0 active:scale-95"
            title="Thoát ra trang chủ"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">VỀ TRANG CHỦ</span>
          </button>
        )}
      </div>

      {/* Theatrical Stage Canvas - Full Screen 100% Widescreen */}
      <div className="relative w-full flex-1 h-full bg-[#1C140D] overflow-hidden select-none perspective-[1000px]">
        
        {/* ========================================================================= */}
        {/* 1. TRẦN HỘI TRƯỜNG & ĐÈN DOWNLIGHT HẮT SÁNG                               */}
        {/* ========================================================================= */}
        <div className="absolute top-0 left-0 right-0 h-9 sm:h-11 bg-gradient-to-b from-[#FAF7F2] to-[#EAE0D2] border-b-2 border-[#C8B29B] z-10 flex items-center justify-around px-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="relative flex flex-col items-center">
              {/* Recessed Ceiling Light Panel */}
              <div className="w-8 sm:w-12 h-2.5 sm:h-3 rounded-xs bg-[#FFFFFF] border border-[#C5B09A] shadow-inner" />
              {/* Soft Ambient Downlight Cone */}
              <div className="absolute top-3 w-16 sm:w-24 h-48 bg-gradient-to-b from-[#FFFDF0]/35 via-[#F4C542]/10 to-transparent blur-md pointer-events-none" />
            </div>
          ))}
        </div>

        {/* ========================================================================= */}
        {/* 2. TƯỜNG SAU HỘI TRƯỜNG (3-TIER ACOUSTIC WOOD WALL STRUCTURE)              */}
        {/* ========================================================================= */}
        <div className="absolute top-9 sm:top-11 left-0 right-0 h-[52%] overflow-hidden">
          
          {/* Nửa trên: Ốp gỗ tiêu âm màu sáng (Upper Light Oak Panels) */}
          <div className="h-[36%] w-full bg-gradient-to-b from-[#DEC7AC] via-[#D5BCA0] to-[#CBB194] border-b border-[#9D7653]/40 relative">
            <div className="w-full h-full opacity-35 bg-[repeating-linear-gradient(90deg,#96724E_0px,#96724E_1.5px,transparent_1.5px,transparent_68px)]" />
          </div>

          {/* Dải viền gỗ nâu sẫm chạy ngang (Middle Dark Walnut Horizontal Band) */}
          <div className="h-[20%] w-full bg-gradient-to-r from-[#4E2713] via-[#61341C] to-[#4E2713] border-y-2 border-[#33170A] shadow-inner relative">
            <div className="w-full h-full opacity-30 bg-[repeating-linear-gradient(0deg,#2D1206_0px,#2D1206_1px,transparent_1px,transparent_6px)]" />
          </div>

          {/* Nửa dưới: Lam gỗ đứng dọc 2 bên màn LED (Lower Vertical Acoustic Slats) */}
          <div className="h-[44%] w-full bg-[#3D2012] relative overflow-hidden">
            {/* Real 3D Vertical Wooden Slats Pattern (Lam gỗ đứng y chang ảnh) */}
            <div className="w-full h-full bg-[repeating-linear-gradient(90deg,#D4B48A_0px,#D4B48A_6px,#2E160A_6px,#2E160A_11px)] shadow-inner" />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. MÀN HÌNH LED MÀU ĐEN 16:9 CHÍNH GIỮA (CENTER BLACK 16:9 LED SCREEN)     */}
        {/* ========================================================================= */}
        <div className="absolute top-12 sm:top-14 left-1/2 -translate-x-1/2 w-[64%] sm:w-[52%] md:w-[45%] max-w-[580px] aspect-[16/9] z-20 pointer-events-none">
          {/* Ambient Wall Drop Shadow */}
          <div className="absolute -inset-1.5 bg-black/60 rounded-xs blur-md -z-10" />

          {/* Heavy Matte Black LED Frame */}
          <div className="w-full h-full bg-[#07080A] border-2 sm:border-3 border-[#1E232E] rounded-xs relative overflow-hidden shadow-2xl">
            {/* Modular LED Cabinet Panel Grid */}
            <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#161B26_1px,transparent_1px),linear-gradient(to_bottom,#161B26_1px,transparent_1px)] [background-size:25%_50%]" />
            {/* Fine LED Pitch Matrix Texture */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#303848_1px,transparent_1px)] [background-size:4px_4px]" />
            
            {/* Corner Rigging Screws */}
            <div className="absolute top-1 left-1 w-1 h-1 rounded-full bg-[#202530]" />
            <div className="absolute top-1 right-1 w-1 h-1 rounded-full bg-[#202530]" />
            <div className="absolute bottom-1 left-1 w-1 h-1 rounded-full bg-[#202530]" />
            <div className="absolute bottom-1 right-1 w-1 h-1 rounded-full bg-[#202530]" />

            {/* Faint Standby Signal Badge */}
            <div className="absolute bottom-1.5 right-2 flex items-center gap-1 opacity-30">
              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-[7px] text-white/60">LED 16:9</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. SÀN SÂN KHẤU MÀU GỖ VÀNG SỒI (HONEY-OAK WOODEN STAGE FLOOR)             */}
        {/* ========================================================================= */}
        <div className="absolute bottom-0 left-0 right-0 h-[48%] sm:h-[50%] bg-gradient-to-b from-[#E2C79E] via-[#D5B78A] to-[#C19C68] border-t-2 border-[#A2794C] overflow-hidden">
          {/* Thớ gỗ ghép ván ngang (Horizontal parquet seams) */}
          <div className="w-full h-full opacity-25 bg-[repeating-linear-gradient(0deg,#70451E_0px,#70451E_1.5px,transparent_1.5px,transparent_24px)]" />
          {/* Thớ gỗ ghép dọc tỏa phối cảnh (Perspective vertical seams) */}
          <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(90deg,#70451E_0px,#70451E_1.5px,transparent_1.5px,transparent_64px)]" />
          
          {/* Độ bóng hắt sáng mặt sàn gỗ nhẵn (Polished Sheen) */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-amber-200/10 to-transparent pointer-events-none" />
          
          {/* Bục mép trước sân khấu (Stage Front Apron Rim) */}
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-[#8C6237] border-t border-[#AA7D4F]" />
        </div>

        {/* ========================================================================= */}
        {/* 5. HỆ THỐNG ĐÈN GALA BIỂU DIỄN (BEAM, PARLED & KATANA CHẠY CHẠY)           */}
        {/* ========================================================================= */}
        {stageLightsOn && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-25 transition-opacity duration-500">
            {/* Dàn đèn Par LED wash trên trần */}
            <div className="absolute top-9 left-0 right-0 flex justify-around px-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="relative flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#1A1A1A] border border-[#F4C542] flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-[#F4C542] animate-pulse" />
                  </div>
                  {/* Par LED Wash Cone */}
                  <div 
                    className="absolute top-2 w-20 sm:w-28 h-56 pointer-events-none stage-parled-pulse bg-gradient-to-b from-[#F4C542]/30 via-[#F4C542]/5 to-transparent blur-lg" 
                    style={{ animationDelay: `${(i * 0.4).toFixed(1)}s` }}
                  />
                </div>
              ))}
            </div>

            {/* ĐÈN BEAM (Volumetric Sweeping Beams quét qua không gian 3D) */}
            <div 
              className="absolute -top-4 left-[18%] w-20 sm:w-28 h-[540px] bg-gradient-to-b from-[#F4C542]/50 via-[#F4C542]/10 to-transparent blur-md stage-beam-left"
              style={{ clipPath: 'polygon(45% 0%, 55% 0%, 100% 100%, 0% 100%)' }}
            />
            <div 
              className="absolute -top-4 left-[30%] w-16 sm:w-22 h-[510px] bg-gradient-to-b from-[#FFF]/35 via-[#F4C542]/10 to-transparent blur-sm stage-beam-cross"
              style={{ clipPath: 'polygon(46% 0%, 54% 0%, 100% 100%, 0% 100%)' }}
            />
            <div 
              className="absolute -top-4 right-[18%] w-20 sm:w-28 h-[540px] bg-gradient-to-b from-[#F4C542]/50 via-[#F4C542]/10 to-transparent blur-md stage-beam-right"
              style={{ clipPath: 'polygon(45% 0%, 55% 0%, 100% 100%, 0% 100%)' }}
            />
            <div 
              className="absolute -top-4 right-[30%] w-16 sm:w-22 h-[510px] bg-gradient-to-b from-[#B94D35]/45 via-[#B94D35]/10 to-transparent blur-sm stage-beam-center"
              style={{ clipPath: 'polygon(46% 0%, 54% 0%, 100% 100%, 0% 100%)' }}
            />

            {/* ĐÈN KATANA (Thanh LED Batten chạy pixel phía trên màn hình LED) */}
            <div className="absolute top-9 left-1/2 -translate-x-1/2 w-[50%] md:w-[44%] max-w-[520px] z-25 flex flex-col items-center">
              <div className="w-full h-2 rounded-xs bg-[#090A0D] border border-[#2D3342] p-0.5 overflow-hidden shadow-[0_0_12px_rgba(244,197,66,0.6)]">
                <div className="w-full h-full stage-katana-chase rounded-xs" />
              </div>
              <div 
                className="w-full h-28 bg-gradient-to-b from-[#F4C542]/40 via-[#F4C542]/5 to-transparent blur-xs stage-katana-blade pointer-events-none"
                style={{ clipPath: 'polygon(6% 0%, 94% 0%, 100% 100%, 0% 100%)' }}
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 6. HÀNG GHẾ KHÁN GIẢ TIỀN CẢNH: MỖI BÊN 5 CÁI, LỐI ĐI Ở GIỮA, KHÔNG CÓ SỐ */}
        {/* ========================================================================= */}
        <div className="absolute -bottom-2 left-0 right-0 h-16 sm:h-20 pointer-events-none z-30 flex items-end justify-between px-3 sm:px-8">
          
          {/* Dãy ghế bên trái: đúng 5 ghế */}
          <div className="flex items-end gap-1.5 sm:gap-2.5 flex-1 justify-around">
            {[...Array(5)].map((_, i) => (
              <div key={`left-chair-${i}`} className="relative flex flex-col items-center flex-1 max-w-[56px] h-14 sm:h-18 shadow-2xl">
                {/* Tay vịn bên hông ghế */}
                <div className="absolute -left-1 top-2.5 w-1.5 h-11 bg-[#1A1A1A] border-t-2 border-[#D97706] rounded-t-xs -z-10" />
                <div className="absolute -right-1 top-2.5 w-1.5 h-11 bg-[#1A1A1A] border-t-2 border-[#D97706] rounded-t-xs -z-10" />
                
                {/* Tựa lưng ghế màu xanh đặc trưng hội trường */}
                <div className="w-full h-full bg-[#1E3A8A] border-2 border-[#0F172A] rounded-t-xl overflow-hidden flex flex-col justify-between shadow-md">
                  {/* Đệm tựa đầu màu đỏ nỉ - KHÔNG CÓ SỐ */}
                  <div className="w-full h-4 sm:h-5 bg-[#DC2626] border-b-2 border-[#991B1B] rounded-t-lg shadow-inner" />
                  {/* Vỏ ghế nhựa đen phía sau */}
                  <div className="w-full h-3 bg-[#0F172A] opacity-60" />
                </div>
              </div>
            ))}
          </div>

          {/* Lối đi ở giữa hội trường (Center Aisle) */}
          <div className="w-8 sm:w-16 shrink-0 h-full flex items-center justify-center">
            <div className="w-full h-1 bg-[#8C6237]/35 rounded-full" />
          </div>

          {/* Dãy ghế bên phải: đúng 5 ghế */}
          <div className="flex items-end gap-1.5 sm:gap-2.5 flex-1 justify-around">
            {[...Array(5)].map((_, i) => (
              <div key={`right-chair-${i}`} className="relative flex flex-col items-center flex-1 max-w-[56px] h-14 sm:h-18 shadow-2xl">
                {/* Tay vịn bên hông ghế */}
                <div className="absolute -left-1 top-2.5 w-1.5 h-11 bg-[#1A1A1A] border-t-2 border-[#D97706] rounded-t-xs -z-10" />
                <div className="absolute -right-1 top-2.5 w-1.5 h-11 bg-[#1A1A1A] border-t-2 border-[#D97706] rounded-t-xs -z-10" />
                
                {/* Tựa lưng ghế màu xanh đặc trưng hội trường */}
                <div className="w-full h-full bg-[#1E3A8A] border-2 border-[#0F172A] rounded-t-xl overflow-hidden flex flex-col justify-between shadow-md">
                  {/* Đệm tựa đầu màu đỏ nỉ - KHÔNG CÓ SỐ */}
                  <div className="w-full h-4 sm:h-5 bg-[#DC2626] border-b-2 border-[#991B1B] rounded-t-lg shadow-inner" />
                  {/* Vỏ ghế nhựa đen phía sau */}
                  <div className="w-full h-3 bg-[#0F172A] opacity-60" />
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Mascot Frogs On Stage */}
        {filtered.map((c) => {
          const pos = positions[c.id] || { x: c.x || 50, y: c.y || 75, dir: 1, scale: c.scale || 1 };
          const isUserFrog = newRegistrant && (c.id === `frog-${newRegistrant.id}` || c.name.includes(newRegistrant.fullName));
          const isHovered = hoveredId === c.id;
          const isAmbient = ambientSpeakerId === c.id;

          // Only user frog, hovered frog, or the 1 ambient rotating speaker show a speech bubble
          const showBubble = isUserFrog || isHovered || isAmbient;

          // Dynamic horizontal positioning to prevent bubble edge clipping
          const bubbleAlignClass = 
            pos.x < 24 
              ? 'left-0 translate-x-0' 
              : pos.x > 76 
                ? 'right-0 left-auto translate-x-0' 
                : 'left-1/2 -translate-x-1/2';

          const pointerAlignClass = 
            pos.x < 24 
              ? 'left-6 -translate-x-1/2' 
              : pos.x > 76 
                ? 'right-6 -translate-x-1/2' 
                : 'left-1/2 -translate-x-1/2';

          // Depth-based z-index: front row (larger y) rendered above back row
          const baseZ = Math.round(pos.y);
          const computedZ = (isUserFrog ? 60 : baseZ) + (isHovered ? 150 : (showBubble ? 30 : 0));

          return (
            <div
              key={c.id}
              onClick={(e) => handleCharacterClick(c, e)}
              onMouseEnter={() => setHoveredId(c.id)}
              onMouseLeave={() => setHoveredId(null)}
              onTouchStart={() => setHoveredId(c.id)}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: `translate(-50%, -50%) scaleX(${pos.dir})`,
                zIndex: computedZ
              }}
              className="absolute cursor-pointer transition-transform duration-75 group select-none"
              title={`Nhấp để xem lời chúc của ${c.name}`}
            >
              {/* Highlight Halo for New Registrant */}
              {isUserFrog && (
                <div className="absolute -inset-6 rounded-full bg-[#F4C542]/30 border-2 border-dashed border-[#B94D35] animate-spin -z-10" style={{ animationDuration: '8s' }} />
              )}

              {/* Compact Name Tag (Visible when speech bubble is NOT shown - clean & zero clutter) */}
              {!showBubble && (
                <div 
                  style={{ transform: `scaleX(${pos.dir})` }}
                  className="absolute -top-7 sm:-top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-white/95 border border-[#20231F] text-[#20231F] text-[10px] sm:text-[11px] font-bold font-display shadow-xs flex items-center gap-1 whitespace-nowrap pointer-events-none group-hover:scale-105 transition-transform"
                >
                  <span className="truncate max-w-[85px] sm:max-w-[120px]">{c.name}</span>
                  <span className={`text-[8px] font-mono px-1 rounded ${
                    c.role === 'ALUMNI' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  }`}>
                    {c.role === 'ALUMNI' ? 'Cựu' : 'TV'}
                  </span>
                </div>
              )}

              {/* Speech Bubble (Upright, smoothly shown for active speakers) */}
              {showBubble && (
                <div 
                  style={{ transform: `scaleX(${pos.dir})` }}
                  className={`absolute -top-24 sm:-top-28 ${bubbleAlignClass} w-44 sm:w-56 p-2 sm:p-2.5 rounded-sm bg-white border-2 text-left shadow-poster transition-all duration-200 animate-fadeIn ${
                    isUserFrog 
                      ? 'border-[#B94D35] ring-2 ring-[#F4C542]' 
                      : isHovered 
                        ? 'border-[#F4C542] ring-2 ring-[#20231F]' 
                        : 'border-[#20231F]'
                  }`}
                >
                  {isUserFrog && (
                    <span className="bg-[#B94D35] text-white font-mono font-bold text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider block text-center mb-1 animate-pulse">
                      ✨ BẠN Ở ĐÂY NÈ! ✨
                    </span>
                  )}
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold text-[#20231F] font-display truncate">
                      {c.name}
                    </span>
                    <span className={`text-[8px] sm:text-[9px] font-mono px-1 sm:px-1.5 py-0.5 rounded border shrink-0 ${
                      c.role === 'ALUMNI'
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    }`}>
                      {c.role === 'ALUMNI' ? 'Cựu TV' : 'Thành viên'}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-[#20231F]/90 font-serif italic line-clamp-2 leading-tight">
                    "{c.wish}"
                  </p>
                  {/* Pointer */}
                  <div className={`absolute -bottom-2 ${pointerAlignClass} w-0 h-0 border-x-4 border-x-transparent border-t-8 border-t-[#20231F]`} />
                </div>
              )}

              {/* The Iconic Yellow-Shirt Cóc Sài Gòn 2D Vector Mascot */}
              <div 
                style={{ transform: `scale(${pos.scale || 1})` }}
                className="relative w-14 h-14 sm:w-18 sm:h-18 animate-float-gentle transition-transform"
              >
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

  // Dedicated Portal Modal for Clicked Frog Wish to prevent any z-index or stacking context clipping
  const renderKeepsakeModal = () => {
    if (!activeCharacter) return null;
    if (typeof document === 'undefined') return null;

    return createPortal(
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#20231F]/80 backdrop-blur-md animate-fadeIn"
        onClick={() => setActiveCharacter(null)}
      >
        <div 
          className="relative w-full max-w-md bg-[#F4EEDF] rounded-sm border-2 border-[#20231F] p-6 shadow-poster-lg animate-paper-unfold z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => setActiveCharacter(null)}
            className="absolute top-4 right-4 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-sm border-2 border-[#20231F] bg-white hover:bg-[#B94D35] hover:text-white text-[#20231F] transition-colors shadow-xs active:scale-95"
            title="Đóng lời chúc"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5 mb-4 pr-10">
            <div className="w-12 h-12 rounded-sm bg-[#F4C542] border-2 border-[#20231F] flex items-center justify-center text-2xl shadow-sm shrink-0">
              🐸
            </div>
            <div>
              <h3 className="font-display font-black text-xl text-[#20231F] leading-tight">
                {activeCharacter.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="stamp-seal text-[9px] bg-white">
                  {activeCharacter.role === 'ALUMNI' ? 'CỰU THÀNH VIÊN' : 'THÀNH VIÊN ĐƯƠNG NHIỆM'}
                </span>
                <span className="text-[11px] font-mono text-[#20231F]/70">
                  Cóc Sài Gòn 17Y
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-sm bg-white border-2 border-[#20231F] mb-4 relative shadow-poster-sm">
            <span className="text-xs font-mono font-bold text-[#B94D35] block mb-1.5">
              LỜI CHÚC SINH NHẬT 17Y:
            </span>
            <p className="font-editorial italic text-base sm:text-lg text-[#20231F] leading-relaxed">
              "{activeCharacter.wish}"
            </p>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#20231F]/20 gap-3">
            <span className="text-[11px] font-mono text-[#20231F]/60">
              CLB Truyền Thông CSG
            </span>
            <button
              type="button"
              onClick={() => {
                triggerConfettiBlast();
                setActiveCharacter(null);
              }}
              className="px-4 py-2.5 min-h-[44px] rounded-sm bg-[#20231F] text-white font-bold text-xs uppercase hover:bg-[#B94D35] transition-colors shadow-sm flex items-center gap-1.5 active:scale-95 shrink-0"
            >
              <span>Gửi Tim Chúc Mừng</span>
              <span>💛</span>
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  // Full-screen modal mode (w-screen h-screen fixed inset-0)
  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 w-screen h-screen bg-[#1C140D] flex flex-col overflow-hidden animate-fadeIn">
        {stageContent}
        {renderKeepsakeModal()}
      </div>
    );
  }

  // Non-modal inline rendering (e.g. inside Screen 6 of RegistrationModal)
  return (
    <div className="w-full h-full flex flex-col flex-1 overflow-hidden">
      {stageContent}
      {renderKeepsakeModal()}
    </div>
  );
};
