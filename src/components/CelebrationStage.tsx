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
      <div className="relative w-full h-[500px] sm:h-[580px] rounded-sm bg-gradient-to-b from-[#0D0F14] via-[#14171F] to-[#241B16] border-2 border-[#20231F] overflow-hidden shadow-poster select-none">
        
        {/* ========================================================================= */}
        {/* STAGE LIGHTING RIG: KHUNG TRUSS, ĐÈN BEAM, PARLED & KATANA CHẠY           */}
        {/* ========================================================================= */}

        {/* Overhead Heavy-Duty Aluminum Stage Truss */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-[#12141A] border-b-2 border-[#232733] z-20 flex items-center justify-between px-4">
          <div className="absolute inset-0 opacity-25 bg-[repeating-linear-gradient(45deg,#343A4C_0px,#343A4C_2px,transparent_2px,transparent_14px)]" />
          
          {/* Par LED Wash Cans array along truss */}
          <div className="relative z-10 w-full flex justify-around items-center">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="relative flex flex-col items-center">
                {/* Parled Fixture Body */}
                <div className={`w-3.5 h-3.5 rounded-full border ${
                  i % 2 === 0 ? 'bg-[#2A2210] border-[#F4C542]' : 'bg-[#261210] border-[#B94D35]'
                } flex items-center justify-center shadow-sm`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    i % 2 === 0 ? 'bg-[#F4C542]' : 'bg-[#B94D35]'
                  } animate-pulse`} />
                </div>
                {/* Parled Light Cone Wash */}
                <div 
                  className={`absolute top-3.5 w-16 sm:w-24 h-48 sm:h-64 pointer-events-none stage-parled-pulse ${
                    i % 2 === 0 
                      ? 'bg-gradient-to-b from-[#F4C542]/30 via-[#F4C542]/10 to-transparent' 
                      : 'bg-gradient-to-b from-[#B94D35]/30 via-[#B94D35]/10 to-transparent'
                  } blur-xl`} 
                  style={{ animationDelay: `${(i * 0.3).toFixed(1)}s` }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ĐÈN BEAM (Moving Head Volumetric Sweeping Beams) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
          {/* Left Sweeping Beams */}
          <div 
            className="absolute -top-6 left-[14%] w-24 sm:w-36 h-[540px] bg-gradient-to-b from-[#F4C542]/50 via-[#F4C542]/15 to-transparent blur-lg stage-beam-left"
            style={{ clipPath: 'polygon(45% 0%, 55% 0%, 100% 100%, 0% 100%)' }}
          />
          <div 
            className="absolute -top-6 left-[26%] w-20 sm:w-28 h-[510px] bg-gradient-to-b from-[#FFF]/35 via-[#F4C542]/15 to-transparent blur-md stage-beam-cross"
            style={{ clipPath: 'polygon(46% 0%, 54% 0%, 100% 100%, 0% 100%)' }}
          />

          {/* Right Sweeping Beams */}
          <div 
            className="absolute -top-6 right-[14%] w-24 sm:w-36 h-[540px] bg-gradient-to-b from-[#F4C542]/50 via-[#F4C542]/15 to-transparent blur-lg stage-beam-right"
            style={{ clipPath: 'polygon(45% 0%, 55% 0%, 100% 100%, 0% 100%)' }}
          />
          <div 
            className="absolute -top-6 right-[26%] w-20 sm:w-28 h-[510px] bg-gradient-to-b from-[#B94D35]/45 via-[#B94D35]/15 to-transparent blur-md stage-beam-center"
            style={{ clipPath: 'polygon(46% 0%, 54% 0%, 100% 100%, 0% 100%)' }}
          />

          {/* Center Fan Beams */}
          <div 
            className="absolute -top-6 left-1/2 -translate-x-1/2 w-48 sm:w-64 h-[500px] bg-gradient-to-b from-[#F4C542]/35 via-[#F4C542]/10 to-transparent blur-xl stage-beam-center"
            style={{ clipPath: 'polygon(48% 0%, 52% 0%, 100% 100%, 0% 100%)' }}
          />
        </div>

        {/* ĐÈN KATANA (Motorized LED Tilt Bar / Pixel Batten Chasing Light) */}
        {/* Top Katana Bar */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[74%] max-w-[560px] z-15 flex flex-col items-center">
          <div className="w-full h-2.5 rounded-sm bg-[#090A0D] border border-[#2D3342] p-0.5 flex gap-1 overflow-hidden shadow-[0_0_15px_rgba(244,197,66,0.5)]">
            <div className="w-full h-full stage-katana-chase rounded-xs" />
          </div>
          {/* Katana Light Blade Sweep (Lưỡi sáng Katana quét xuống sân khấu) */}
          <div 
            className="w-full h-36 bg-gradient-to-b from-[#F4C542]/40 via-[#F4C542]/10 to-transparent blur-sm stage-katana-blade pointer-events-none"
            style={{ clipPath: 'polygon(5% 0%, 95% 0%, 100% 100%, 0% 100%)' }}
          />
        </div>

        {/* ========================================================================= */}
        {/* MÀN HÌNH LED MÀU ĐEN Ở GIỮA (CONCERT BLACK LED WALL)                       */}
        {/* ========================================================================= */}
        <div className="absolute top-16 sm:top-18 left-1/2 -translate-x-1/2 w-[84%] sm:w-[72%] max-w-[570px] h-[175px] sm:h-[195px] z-10 pointer-events-none">
          {/* Ambient LED Screen Backlight Glow */}
          <div className="absolute -inset-2 bg-[#F4C542]/15 rounded-sm blur-xl -z-10" />

          {/* Heavy Black LED Cabinet Frame */}
          <div className="w-full h-full bg-[#0A0C10] border-2 sm:border-3 border-[#242936] rounded-sm p-2.5 sm:p-3.5 flex flex-col justify-between relative overflow-hidden shadow-2xl">
            {/* LED Matrix Pixel Grid Pattern */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#4A5568_1px,transparent_1px)] [background-size:5px_5px]" />
            <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#1E2330_1px,transparent_1px),linear-gradient(to_bottom,#1E2330_1px,transparent_1px)] [background-size:40px_40px]" />

            {/* LED Top Status Header */}
            <div className="relative z-10 flex items-center justify-between border-b border-[#202533] pb-1.5 font-mono text-[9px] sm:text-[10px]">
              <div className="flex items-center gap-1.5 text-[#F4C542]">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
                <span className="font-bold tracking-widest uppercase">STAGE LED • GALA 17Y</span>
              </div>
              <div className="flex items-center gap-2 text-white/50">
                <span>4K DCI // LIVE FEED</span>
                <span className="hidden sm:inline">19.12.2026</span>
              </div>
            </div>

            {/* LED Main Typography / Visual Centerpiece */}
            <div className="relative z-10 text-center py-1 sm:py-2 space-y-1">
              <span className="font-mono text-[9px] sm:text-[11px] text-[#F4C542] uppercase tracking-[0.25em] font-semibold block">
                CLB TRUYỀN THÔNG CÓC SÀI GÒN
              </span>
              <h3 className="font-display font-black text-xl sm:text-3xl text-white tracking-wider uppercase leading-none drop-shadow-[0_0_12px_rgba(244,197,66,0.6)]">
                17 NĂM MỘT MÁI NHÀ
              </h3>
              <p className="font-mono text-[10px] sm:text-xs text-[#EAE4D6]/70 tracking-widest">
                ★ 2009 — 2026 ★ ĐẠI TIỆC HỘI NGỘ
              </p>
            </div>

            {/* LED Bottom Audio Equalizer Visualizer & Katana Sub-bar */}
            <div className="relative z-10 pt-1 border-t border-[#202533] flex items-end justify-between px-2">
              {/* Audio Spectrum Equalizer Bars */}
              <div className="flex items-end gap-1 h-5 w-28 sm:w-40">
                {[...Array(14)].map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-t-xs ${
                      i % 3 === 0 
                        ? 'bg-[#F4C542] stage-eq-1' 
                        : i % 3 === 1 
                        ? 'bg-[#B94D35] stage-eq-2' 
                        : 'bg-white stage-eq-3'
                    }`}
                    style={{ animationDelay: `${(i * 0.12).toFixed(2)}s` }}
                  />
                ))}
              </div>

              {/* Katana Bottom Chasing Bar */}
              <div className="flex items-center gap-1.5 font-mono text-[9px] text-[#F4C542]/80">
                <span className="hidden sm:inline">KATANA SYSTEM</span>
                <div className="w-16 sm:w-24 h-1.5 bg-[#12141A] rounded-full overflow-hidden border border-[#2D3342]">
                  <div className="w-full h-full stage-katana-chase" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SÀN SÂN KHẤU MÀU NÂU (RICH BROWN THEATRICAL WOODEN FLOOR)                 */}
        {/* ========================================================================= */}
        <div className="absolute bottom-0 left-0 right-0 h-44 sm:h-50 bg-gradient-to-b from-[#54341E] via-[#3E2313] to-[#2B170B] border-t-2 border-[#1E1107] overflow-hidden">
          {/* Wood Planks Seams (Perspective & Horizontal boards) */}
          <div className="w-full h-full opacity-40 bg-[repeating-linear-gradient(90deg,#1A0C04_0px,#1A0C04_2px,transparent_2px,transparent_56px)]" />
          <div className="absolute inset-0 opacity-25 bg-[repeating-linear-gradient(0deg,#1A0C04_0px,#1A0C04_1px,transparent_1px,transparent_28px)]" />
          
          {/* Polished Stage Gloss / Light Reflection from LED & Beams */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-amber-400/5 to-transparent pointer-events-none" />
          
          {/* Stage Front Apron & Fascia (Bục trước sân khấu có chiều sâu) */}
          <div className="absolute bottom-0 left-0 right-0 h-6 bg-[#1A0C04] border-t border-[#3E2313]/50 flex items-center justify-between px-4">
            <span className="font-mono text-[8px] text-[#A67C52]/50 tracking-widest uppercase">
              ASIANA PLAZA • MAIN STAGE
            </span>
            <span className="font-mono text-[8px] text-[#A67C52]/50 tracking-widest uppercase">
              STAGE ELEVATION: +1.20M
            </span>
          </div>

          {/* Golden Stage Footlights Along Rim */}
          <div className="absolute top-1 left-0 right-0 flex justify-between px-4 sm:px-10">
            {[...Array(14)].map((_, i) => (
              <div key={i} className="relative flex flex-col items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-[#F4C542] border border-[#1A0C04] shadow-[0_0_8px_#F4C542]" />
                <div className="w-6 h-8 bg-gradient-to-t from-transparent to-[#F4C542]/20 blur-xs -translate-y-2 pointer-events-none" />
              </div>
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
