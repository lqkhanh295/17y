import React, { useState, useEffect, useMemo } from 'react';
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
  const [stageLightsOn, setStageLightsOn] = useState(true);

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
    // Generate initial stage floor positions (walking on real hall wooden floor)
    const pos: { [id: string]: { x: number; y: number; dir: number } } = {};
    allCharacters.forEach((c, idx) => {
      const isNewUser = newRegistrant && (c.id === `frog-${newRegistrant.id}` || c.name.includes(newRegistrant.fullName));
      pos[c.id] = {
        x: isNewUser ? 50 : (c.x || 16 + ((idx * 18) % 68)),
        y: isNewUser ? 68 : (c.y || 62 + ((idx * 3) % 12)),
        dir: c.direction || (idx % 2 === 0 ? 1 : -1)
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
          let { x, y, dir } = next[c.id];
          const isCenter = newRegistrant && (c.id === `frog-${newRegistrant.id}` || c.name.includes(newRegistrant.fullName));
          const speed = isCenter ? 0.05 : 0.12;
          x += dir * speed;

          // Confine walking across the stage floor
          if (x > 86) {
            x = 86;
            dir = -1;
          } else if (x < 14) {
            x = 14;
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

          {/* Toggle Gala Stage Lighting */}
          <button
            type="button"
            onClick={() => setStageLightsOn(!stageLightsOn)}
            className={`px-3 py-1.5 rounded-sm text-xs font-bold font-mono transition-all border-2 flex items-center gap-1.5 whitespace-nowrap ${
              stageLightsOn
                ? 'bg-[#20231F] text-[#F4C542] border-[#20231F]'
                : 'bg-[#F4EEDF] text-[#20231F] border-[#20231F]/40 hover:border-[#20231F]'
            }`}
            title={stageLightsOn ? 'Tắt hiệu ứng đèn sân khấu' : 'Bật hiệu ứng đèn sân khấu'}
          >
            <Lightbulb className={`w-3.5 h-3.5 ${stageLightsOn ? 'text-[#F4C542]' : 'text-[#20231F]/50'}`} />
            <span>{stageLightsOn ? 'ĐÈN: BẬT' : 'ĐÈN: TẮT'}</span>
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

      {/* Theatrical Stage Canvas - Tái hiện 3D hội trường thực tế từ ảnh chụp */}
      <div className="relative w-full h-[520px] sm:h-[600px] rounded-sm bg-[#1C140D] border-2 border-[#20231F] overflow-hidden shadow-poster select-none perspective-[1000px]">
        
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
        <div className="absolute top-12 sm:top-14 left-1/2 -translate-x-1/2 w-[62%] sm:w-[50%] max-w-[430px] aspect-[16/9] z-20 pointer-events-none">
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
            <div className="absolute top-9 left-1/2 -translate-x-1/2 w-[48%] max-w-[380px] z-25 flex flex-col items-center">
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
