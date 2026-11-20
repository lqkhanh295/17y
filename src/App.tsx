import React, { useState, useEffect } from 'react';
import { ArrowRight, ShieldCheck, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AudioPlayerToggle } from './components/AudioPlayerToggle';
import { MemoryAlbum, ALBUM_PHOTOS } from './components/MemoryAlbum';
import { RegistrationModal } from './components/RegistrationModal';
import { PaymentLookupModal } from './components/PaymentLookupModal';
import { AdminDashboard } from './components/AdminDashboard';
import { RegistrationRecord } from './types';
import { apiClient } from './services/apiClient';
import { audioService } from './services/audioService';

// Default initial fallback registrations
const INITIAL_REGISTRATIONS: RegistrationRecord[] = [
  {
    id: 'reg-001',
    memberId: 'm-001',
    fullName: 'Huỳnh Tấn Phát',
    mssv: 'SE120101',
    role: 'ALUMNI',
    honorific: 'Anh',
    gmail: 'phat.huynh@gmail.com',
    personalPhone: '0909123456',
    emergencyPhone: '0909988776',
    allergies: ['Không uống được cồn'],
    allergyNote: 'Uống nước ngọt hoặc mocktail',
    wishes: 'Chúc Cóc Sài Gòn mãi là ngôi nhà ấm áp của bao thế hệ! 💛',
    plan: 'FULL',
    totalRequired: 449000,
    paidAmount: 449000,
    remainingAmount: 0,
    receiptPhase1Url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80',
    status: 'COMPLETED_100',
    isApproved100: true,
    approvedBy: 'BTC_Admin',
    ticketCode: 'CSG17Y-HP12',
    ticketToken: 'TKT-HP12-VIP',
    createdAt: '2026-11-14T10:30:00Z',
    isCheckedIn: true,
    checkedInAt: '2026-11-20T18:15:00Z',
    checkedInBy: 'BTC_Admin'
  },
  {
    id: 'reg-002',
    memberId: 'm-010',
    fullName: 'Nguyễn Phúc An',
    mssv: 'SE170112',
    role: 'ACTIVE',
    honorific: 'Bạn',
    gmail: 'an.np.se17@gmail.com',
    personalPhone: '0918765432',
    emergencyPhone: '0912334455',
    allergies: ['Dị ứng hải sản'],
    allergyNote: '',
    wishes: 'Đêm nay Cóc cháy hết mình nha anh em ơi! 🔥',
    plan: 'DEPOSIT_150',
    totalRequired: 349000,
    paidAmount: 150000,
    remainingAmount: 199000,
    receiptPhase1Url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80',
    status: 'DEPOSITED',
    isApproved100: false,
    ticketCode: 'CSG17Y-AN17',
    ticketToken: 'TKT-AN17-PENDING',
    createdAt: '2026-11-14T14:20:00Z'
  },
  {
    id: 'reg-003',
    memberId: 'm-002',
    fullName: 'Trần Thảo My',
    mssv: 'SE130245',
    role: 'ALUMNI',
    honorific: 'Chị',
    gmail: 'thaomy.csg@gmail.com',
    personalPhone: '0933221100',
    emergencyPhone: '0933112233',
    allergies: [],
    allergyNote: '',
    wishes: 'Hẹn gặp lại các em tại đêm tiệc 17Y hoành tráng! ✨',
    plan: 'FULL',
    totalRequired: 449000,
    paidAmount: 449000,
    remainingAmount: 0,
    receiptPhase1Url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80',
    status: 'COMPLETED_100',
    isApproved100: true,
    approvedBy: 'BTC_Admin',
    ticketCode: 'CSG17Y-TM13',
    ticketToken: 'TKT-TM13-VIP',
    createdAt: '2026-11-15T08:10:00Z',
    isCheckedIn: false
  }
];

export const App: React.FC = () => {
  // Modal states
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isLookupOpen, setIsLookupOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Registrations state
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>(INITIAL_REGISTRATIONS);

  // Optional Wish state
  const [wishAuthor, setWishAuthor] = useState('');
  const [wishContent, setWishContent] = useState('');
  const [wishSubmitted, setWishSubmitted] = useState(false);

  // URL-based routing handlers
  const openRegister = () => {
    if (window.location.pathname !== '/register') {
      window.history.pushState({}, '', '/register');
    }
    setIsRegisterOpen(true);
    setIsLookupOpen(false);
    setIsAdminOpen(false);
  };

  const openLookup = () => {
    if (window.location.pathname !== '/portal') {
      window.history.pushState({}, '', '/portal');
    }
    setIsLookupOpen(true);
    setIsRegisterOpen(false);
    setIsAdminOpen(false);
  };

  const openAdmin = () => {
    if (window.location.pathname !== '/admin') {
      window.history.pushState({}, '', '/admin');
    }
    setIsAdminOpen(true);
    setIsRegisterOpen(false);
    setIsLookupOpen(false);
  };

  const closeModals = () => {
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }
    setIsRegisterOpen(false);
    setIsLookupOpen(false);
    setIsAdminOpen(false);
  };

  // Sync initial URL on mount and handle Back/Forward browser navigation
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      if (path.startsWith('/register')) {
        setIsRegisterOpen(true);
        setIsLookupOpen(false);
        setIsAdminOpen(false);
      } else if (path.startsWith('/portal')) {
        setIsLookupOpen(true);
        setIsRegisterOpen(false);
        setIsAdminOpen(false);
      } else if (path.startsWith('/admin')) {
        setIsAdminOpen(true);
        setIsRegisterOpen(false);
        setIsLookupOpen(false);
      } else {
        setIsRegisterOpen(false);
        setIsLookupOpen(false);
        setIsAdminOpen(false);
      }
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Handle new registration completed
  const handleRegistrationComplete = (newRecord: RegistrationRecord) => {
    setRegistrations(prev => [newRecord, ...prev]);

    // Trigger celebration chime & confetti
    audioService.playCelebrationChime();
    confetti({
      particleCount: 80,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#F4C542', '#B94D35', '#20231F', '#F4EEDF']
    });
  };

  // Handle optional minimal wish submission
  const handleWishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishContent.trim()) return;

    try {
      await apiClient.submitWish({
        authorName: wishAuthor.trim() || 'Người bạn Cóc Sài Gòn',
        role: 'ACTIVE',
        content: wishContent.trim(),
        isPublic: true
      });
      setWishSubmitted(true);
      setWishContent('');
      setWishAuthor('');
    } catch {
      setWishSubmitted(true);
    }
  };

  // Admin approves 100%
  const handleApprove100 = (id: string) => {
    setRegistrations(prev => prev.map(r => {
      if (r.id === id) {
        return {
          ...r,
          isApproved100: true,
          status: 'COMPLETED_100',
          approvedBy: 'BTC_Admin',
          approvedAt: new Date().toISOString()
        };
      }
      return r;
    }));
  };

  return (
    <div className="relative min-h-screen bg-csg-paper bg-paper-texture text-csg-black flex flex-col selection:bg-csg-yellow selection:text-csg-black font-body">
      
      {/* Floating Audio Controller */}
      <AudioPlayerToggle />

      {/* ================= ULTRA-MINIMAL MASTHEAD ================= */}
      <header className="sticky top-0 z-40 bg-csg-paper/95 backdrop-blur-md border-b border-csg-black/30">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-8 h-14 flex items-center justify-between">
          {/* Identity */}
          <a href="/" onClick={(e) => { e.preventDefault(); closeModals(); }} className="flex items-center gap-2 group">
            <span className="font-display font-extrabold text-base tracking-tight text-csg-black uppercase">
              CÓC SÀI GÒN <span className="font-editorial italic font-normal text-csg-red lowercase text-lg">17 năm</span>
            </span>
          </a>

          {/* Minimal Links */}
          <nav className="flex items-center gap-5 sm:gap-7 font-mono text-xs uppercase tracking-wider text-csg-black/80 font-medium">
            <a href="#memories" className="hover:text-csg-red transition-colors hidden sm:inline">
              SỔ KỶ NIỆM
            </a>
            <button
              onClick={openLookup}
              className="hover:text-csg-red transition-colors"
            >
              TRA CỨU VÉ
            </button>
            <button
              onClick={openRegister}
              className="btn-editorial-primary px-3.5 py-1.5 font-display font-bold text-xs uppercase flex items-center gap-1 shadow-sm"
            >
              <span>ĐĂNG KÝ ↗</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Memory Album Canvas */}
      <main className="relative z-10 flex-1 max-w-[1360px] mx-auto px-4 sm:px-8 w-full py-8 sm:py-12 space-y-20 sm:space-y-32">
        
        {/* ================= OPENING SPREAD: THE MEMORY DESK & GALA INVITATION ================= */}
        <section className="relative">
          
          {/* Subtle Archival Running Head */}
          <div className="flex items-center justify-between border-b border-csg-black/20 pb-2.5 mb-6 sm:mb-8 font-mono text-xs text-csg-black/60">
            <div className="flex items-center gap-2 font-semibold">
              <span className="text-csg-black">CUỐN KỶ YẾU 17 NĂM</span>
              <span>•</span>
              <span className="text-csg-red uppercase">GALA 19.12.2026</span>
            </div>
            <span className="hidden sm:inline italic font-editorial text-csg-black/70">
              "Some memories never leave."
            </span>
          </div>

          {/* The Asymmetric Scrapbook Spread */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* LEFT: Living Memory Photograph (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Dominant Framed Photo Print */}
              <div className="bg-white p-3 sm:p-4 pb-7 sm:pb-9 shadow-paper-lg border border-csg-black/25 relative group">
                {/* Washi Tape Strip at Center */}
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#E5DEC9]/85 border border-csg-black/10 backdrop-blur-[1px] -rotate-1 shadow-sm pointer-events-none" />
                
                {/* 17Y Anniversary Stamp */}
                <div className="absolute top-5 left-5 z-10 px-2.5 py-1 bg-csg-yellow text-csg-black border border-csg-black font-mono text-[11px] font-extrabold uppercase -rotate-2 shadow-sm pointer-events-none">
                  ★ 17 NĂM SẮC ÁO VÀNG
                </div>

                <div className="overflow-hidden bg-csg-muted">
                  <img
                    src={ALBUM_PHOTOS[0].url}
                    alt={ALBUM_PHOTOS[0].alt}
                    className="w-full aspect-[16/10] sm:aspect-[16/9] object-cover transition-transform duration-700 group-hover:scale-[1.01]"
                  />
                </div>

                <div className="pt-3 px-1 flex items-baseline justify-between">
                  <p className="font-handwriting text-2xl sm:text-3xl text-csg-black/85 -rotate-1">
                    "Những năm tháng mình đã cùng nhau..."
                  </p>
                  <span className="font-mono text-[11px] text-csg-black/50 uppercase tracking-wider hidden sm:inline">
                    Đêm Gala Hội Ngộ
                  </span>
                </div>
              </div>

              {/* Minimal Organic Editorial Note */}
              <p className="font-editorial italic text-base sm:text-lg text-csg-black/75 px-1 leading-relaxed">
                17 năm trôi qua, từng thế hệ đã đến, đã trưởng thành và mang theo sắc áo vàng đi khắp muôn phương. Đêm nay, chiếc bàn tiệc ấy lại được thắp sáng để đón bạn trở về.
              </p>
            </div>

            {/* RIGHT: Pinned Keepsake Gala Invitation (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Physical Invitation Ticket Stub */}
              <div className="bg-[#FFFDF8] border-2 border-csg-black p-6 sm:p-8 shadow-poster relative space-y-6">
                
                {/* Perforated Top Seal */}
                <div className="flex items-center justify-between border-b-2 border-dashed border-csg-black/25 pb-4">
                  <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-csg-red">
                    THƯ MỜI HỘI NGỘ • SỐ 17
                  </span>
                  <span className="font-mono text-[11px] text-csg-black/50">
                    NĂM 2009 — 2026
                  </span>
                </div>

                {/* Event Heading */}
                <div className="space-y-1">
                  <h1 className="text-3xl sm:text-4xl font-display font-extrabold uppercase text-csg-black leading-[1.05] tracking-tight">
                    ĐẠI TIỆC GALA 17Y
                  </h1>
                  <p className="font-editorial italic text-base text-csg-black/70">
                    Cóc Sài Gòn — Mười Bảy Năm Một Mái Nhà
                  </p>
                </div>

                {/* Event Particulars */}
                <div className="font-mono text-xs divide-y divide-csg-black/15 py-1">
                  <div className="flex justify-between py-2.5">
                    <span className="text-csg-black/60 uppercase">THỜI GIAN:</span>
                    <span className="font-bold text-csg-black">18:00 • Thứ Bảy, 19.12.2026</span>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <span className="text-csg-black/60 uppercase">ĐỊA ĐIỂM:</span>
                    <span className="font-bold text-csg-black text-right">Asiana Plaza Tân Phú, TP. HCM</span>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <span className="text-csg-black/60 uppercase">TRANG PHỤC:</span>
                    <span className="font-bold text-csg-black">Sắc Áo Vàng Truyền Thống</span>
                  </div>
                </div>

                {/* Primary RSVP Action Right on Ticket */}
                <div className="space-y-3 pt-2">
                  <button
                    onClick={openRegister}
                    className="btn-editorial-primary w-full py-4 font-display font-extrabold text-sm sm:text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-poster"
                  >
                    <span>ĐĂNG KÝ THAM GIA</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="flex items-center justify-between font-mono text-xs pt-1">
                    <button
                      onClick={openLookup}
                      className="text-csg-black/65 hover:text-csg-red underline decoration-1 underline-offset-4 transition-colors"
                    >
                      Tra cứu vé đã đặt →
                    </button>
                    <span className="text-csg-black/40 text-[11px]">
                      Hạn chót: 15.12.2026
                    </span>
                  </div>
                </div>

              </div>

              {/* Overlapping Candid Polaroid Pinned to Corner */}
              <div className="hidden sm:flex items-center gap-4 bg-white p-3 shadow-paper-md border border-csg-black/20 -rotate-1 hover:rotate-0 transition-transform duration-300">
                <div className="w-16 h-16 shrink-0 overflow-hidden bg-csg-muted">
                  <img
                    src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=300&q=80"
                    alt="Nụ cười đồng đội"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-handwriting text-xl text-csg-black/85 leading-snug">
                    "Gặp lại những người anh, người chị, người bạn từng cùng mình trải qua thời sinh viên rực rỡ nhất."
                  </p>
                </div>
              </div>

            </div>

          </div>

        </section>

        {/* ================= THE LIVING PHOTO ALBUM SPREADS ================= */}
        <MemoryAlbum />

        {/* ================= SỔ LƯU BÚT: MEMO CARD IN SCRAPBOOK ================= */}
        <section className="max-w-xl mx-auto pt-8">
          <div className="bg-[#FFFDF8] border-2 border-csg-black p-6 sm:p-8 shadow-poster relative space-y-4">
            
            {/* Memo Tape */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#E5DEC9]/85 border border-csg-black/10 backdrop-blur-[1px] rotate-1 shadow-sm pointer-events-none" />

            <div className="text-center space-y-1">
              <span className="font-mono text-[11px] font-bold text-csg-red uppercase tracking-widest">
                SỔ LƯU BÚT 17 NĂM
              </span>
              <h2 className="text-xl sm:text-2xl font-display font-extrabold uppercase text-csg-black">
                Để lại một dòng cho những năm tháng này
              </h2>
            </div>

            {wishSubmitted ? (
              <div className="p-4 bg-csg-surface border border-csg-black font-mono text-xs text-csg-black flex items-center justify-center gap-2">
                <Check className="w-4 h-4 text-csg-red shrink-0" />
                <span>Cảm ơn bạn. Dòng lưu bút đã được cài vào cuốn sổ kỷ niệm 17 năm!</span>
              </div>
            ) : (
              <form onSubmit={handleWishSubmit} className="space-y-3">
                <input
                  type="text"
                  placeholder="Tên / Khóa (VD: Anh Phát K12)"
                  value={wishAuthor}
                  onChange={(e) => setWishAuthor(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-csg-paper border border-csg-black/40 text-xs font-mono outline-none focus:border-csg-black focus:bg-white transition-colors"
                  required
                />
                <textarea
                  rows={2}
                  placeholder="Một dòng gửi gắm đến Cóc Sài Gòn..."
                  value={wishContent}
                  onChange={(e) => setWishContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-csg-paper border border-csg-black/40 text-xs font-mono outline-none focus:border-csg-black focus:bg-white resize-none transition-colors"
                  required
                />
                <button
                  type="submit"
                  className="w-full py-2.5 bg-csg-black text-csg-yellow font-mono text-xs font-bold uppercase tracking-wider hover:bg-csg-red hover:text-white transition-colors"
                >
                  ĐÓNG DẤU LƯU BÚT 17Y →
                </button>
              </form>
            )}
          </div>
        </section>

      </main>

      {/* ================= COLOPHON FOOTER ================= */}
      <footer className="relative z-10 bg-csg-surface border-t border-csg-black/30 py-6 px-4 sm:px-8 mt-16">
        <div className="max-w-[1360px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs text-csg-black/70 text-center sm:text-left">
          <span>CLB TRUYỀN THÔNG CÓC SÀI GÒN • 2009 — 2026 • ĐẠI TIỆC GALA 17Y TẠI ASIANA PLAZA TÂN PHÚ</span>

          <div className="flex items-center gap-4">
            <button
              onClick={openLookup}
              className="hover:text-csg-red underline decoration-1 underline-offset-4 transition-colors"
            >
              Tra cứu vé
            </button>
            <span>•</span>
            <button
              onClick={openAdmin}
              className="hover:text-csg-red flex items-center gap-1 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-csg-red" />
              <span>Cổng Quản Trị BTC</span>
            </button>
          </div>
        </div>
      </footer>

      {/* ================= MOBILE STICKY CTA PILL ================= */}
      <div className="sm:hidden fixed bottom-5 right-5 z-40 animate-fadeIn">
        <button
          onClick={openRegister}
          className="btn-editorial-primary px-4 py-2.5 font-display font-extrabold text-xs uppercase shadow-poster flex items-center gap-1.5"
          aria-label="Đăng ký tham gia 17Y"
        >
          <span>ĐĂNG KÝ 17Y ↗</span>
        </button>
      </div>

      {/* ================= FUNCTIONAL MODALS (100% PRESERVED) ================= */}
      <RegistrationModal
        isOpen={isRegisterOpen}
        onClose={closeModals}
        onRegistrationComplete={handleRegistrationComplete}
        onOpenPortal={openLookup}
      />

      <PaymentLookupModal
        isOpen={isLookupOpen}
        onClose={closeModals}
        onPaymentSuccess={() => {}}
      />

      <AdminDashboard
        isOpen={isAdminOpen}
        onClose={closeModals}
        registrations={registrations}
        onApprove100={handleApprove100}
        onSimulateEmailDispatch={() => {
          setRegistrations(prev => prev.map(r => r.isApproved100 ? { ...r, isEmailSent: true } : r));
        }}
      />
    </div>
  );
};
