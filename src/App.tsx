import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, ShieldCheck, Search, ChevronDown, Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AudioPlayerToggle } from './components/AudioPlayerToggle';
import { ExhibitionArchive } from './components/ExhibitionArchive';
import { RegistrationModal } from './components/RegistrationModal';
import { PaymentLookupModal } from './components/PaymentLookupModal';
import { AdminDashboard } from './components/AdminDashboard';
import { CinematicFilmOpening } from './components/CinematicFilmOpening';
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
  // One-time Cinematic Film Opening intro state
  const [showCinematicIntro, setShowCinematicIntro] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return false;
    }
    const path = window.location.pathname;
    if (path === '/register' || path === '/portal' || path === '/admin' || window.location.hash) {
      return false;
    }
    return sessionStorage.getItem('csg17y_film_intro_viewed') !== 'true';
  });

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
      {/* One-Time Cinematic Analog Film Opening Transition */}
      {showCinematicIntro && (
        <CinematicFilmOpening onComplete={() => setShowCinematicIntro(false)} />
      )}

      {/* Floating Audio Controller */}
      <AudioPlayerToggle />

      {/* ================= MINIMALIST EDITORIAL NAVIGATION ================= */}
      <header className="sticky top-0 z-40 bg-csg-paper/90 backdrop-blur-md border-b-2 border-csg-black">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          {/* Masthead Mark */}
          <a href="/" onClick={(e) => { e.preventDefault(); closeModals(); }} className="flex items-center gap-2 group">
            <span className="font-display font-extrabold text-lg sm:text-xl uppercase tracking-tight text-csg-black">
              CÓC SÀI GÒN <span className="text-csg-red">17Y</span>
            </span>
          </a>

          {/* Direct Navigation Links */}
          <nav className="flex items-center gap-6 sm:gap-8 font-mono text-xs font-bold uppercase tracking-wider text-csg-black/80">
            <a href="#archive" className="hover:text-csg-red transition-colors">
              KỶ NIỆM
            </a>
            <a href="#event" className="hover:text-csg-red transition-colors">
              SỰ KIỆN
            </a>
            <button
              onClick={openLookup}
              className="hover:text-csg-red transition-colors hidden sm:inline"
            >
              TRA CỨU VÉ
            </button>
            <button
              onClick={openRegister}
              className="btn-editorial-primary px-3.5 sm:px-4 py-1.5 font-display font-bold text-xs uppercase flex items-center gap-1.5 shadow-sm"
            >
              <span>ĐĂNG KÝ ↗</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area: Compact Streamlined Journey */}
      <main className="relative z-10 flex-1">
        
        {/* ================= 01. OPENING EXPERIENCE (ART-DIRECTED FIRST VIEWPORT) ================= */}
        <section className="relative min-h-[85vh] sm:min-h-[90vh] flex flex-col justify-between pt-6 sm:pt-10 pb-12 px-4 sm:px-8 max-w-[1400px] mx-auto w-full overflow-hidden border-b-2 border-csg-black">
          
          {/* Oversized 17Y Visual Watermark Underneath */}
          <div 
            aria-hidden="true" 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[32vw] sm:text-[25vw] font-display font-extrabold text-[#E5DEC9]/45 select-none pointer-events-none z-0 tracking-tighter leading-none"
          >
            17Y
          </div>

          {/* Top Metadata Strip */}
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-csg-black/20 pb-3 gap-1 font-mono text-xs text-csg-black/70">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-csg-red animate-pulse" />
              <span className="font-bold text-csg-black uppercase">CLB TRUYỀN THÔNG CÓC SÀI GÒN</span>
              <span>•</span>
              <span>2009 — 2026</span>
            </div>
            <div className="font-bold text-csg-black">
              19.12.2026 // ĐẠI TIỆC GALA HOÀNG KIM
            </div>
          </div>

          {/* Centerpiece: Art-Directed Photograph & Integrated Headline */}
          <div className="relative z-10 my-8 sm:my-12">
            <div className="relative max-w-5xl mx-auto">
              {/* Grand Archival Hero Photo */}
              <div className="relative aspect-[16/9] sm:aspect-[21/9] bg-csg-muted overflow-hidden border-2 border-csg-black shadow-poster-lg">
                <img
                  src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1600&q=85"
                  alt="Đại tiệc Gala Cóc Sài Gòn"
                  className="w-full h-full object-cover filter contrast-[103%] saturate-[105%]"
                />
                
                {/* Photo Caption Pill */}
                <div className="absolute top-3 left-3 bg-csg-paper/95 border border-csg-black px-2.5 py-1 text-[11px] font-mono font-bold uppercase text-csg-black">
                  TƯ LIỆU CSG // ASIANA PLAZA
                </div>
              </div>

              {/* Overlapping Grand Headline */}
              <div className="mt-6 sm:-mt-10 sm:ml-8 relative z-20 space-y-2">
                <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-extrabold uppercase tracking-[-0.03em] text-csg-black leading-[0.9] drop-shadow-sm">
                  NHỮNG NĂM THÁNG <br />
                  <span className="font-editorial italic font-normal text-csg-red text-5xl sm:text-7xl md:text-8xl lg:text-9xl">
                    Mình Đã Cùng Nhau.
                  </span>
                </h1>
              </div>
            </div>
          </div>

          {/* Bottom Action Strip */}
          <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-csg-black/20">
            <div className="font-mono text-xs text-csg-black/80 space-y-0.5">
              <p className="font-bold text-csg-black">18:00 • THỨ BẢY, 19.12.2026</p>
              <p>ASIANA PLAZA TÂN PHÚ, TP. HỒ CHÍ MINH</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={openRegister}
                className="btn-editorial-primary flex-1 sm:flex-none px-8 py-3.5 font-display font-extrabold text-sm sm:text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-poster"
              >
                <span>ĐĂNG KÝ THAM GIA</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="#archive"
                className="hidden md:flex p-3.5 border-2 border-csg-black bg-csg-surface hover:bg-csg-muted transition-colors text-csg-black"
                title="Khám phá kỷ yếu ảnh"
                aria-label="Cuộn xuống xem kỷ yếu"
              >
                <ChevronDown className="w-5 h-5" />
              </a>
            </div>
          </div>
        </section>

        {/* ================= 02. MEMORY ARCHIVE (THE PHOTOGRAPHIC EXHIBITION) ================= */}
        <ExhibitionArchive />

        {/* ================= 03. THE EVENT (COMPACT EDITORIAL STRIP) ================= */}
        <section id="event" className="py-16 sm:py-24 px-4 sm:px-8 max-w-[1400px] mx-auto border-t-2 border-csg-black">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Title Block */}
            <div className="lg:col-span-4 space-y-2">
              <span className="font-mono text-xs font-bold text-csg-red tracking-widest uppercase">
                03 // THE EVENT
              </span>
              <h2 className="text-3xl sm:text-5xl font-display font-extrabold uppercase text-csg-black leading-[0.95]">
                Gala 17Y <br />
                <span className="font-editorial italic font-normal text-csg-red">Đêm Hội Ngộ.</span>
              </h2>
            </div>

            {/* Compact Essential Metadata Table */}
            <div className="lg:col-span-5 font-mono text-xs sm:text-sm divide-y divide-csg-black/15 py-2 border-y lg:border-y-0 lg:border-l-2 border-csg-black lg:pl-8">
              <div className="flex justify-between py-2">
                <span className="text-csg-black/60 uppercase">THỜI GIAN</span>
                <span className="font-bold text-csg-black">18:00 • Thứ Bảy, 19.12.2026</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-csg-black/60 uppercase">ĐỊA ĐIỂM</span>
                <span className="font-bold text-csg-black">Asiana Plaza Tân Phú, TP. HCM</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-csg-black/60 uppercase">DRESS CODE</span>
                <span className="font-bold text-csg-black">Sắc Áo Vàng hoặc Vàng - Đen - Trắng</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-csg-black/60 uppercase">QUY MÔ</span>
                <span className="font-bold text-csg-black">200 ghế ngồi dành riêng cho Cóc</span>
              </div>
            </div>

            {/* Direct CTA */}
            <div className="lg:col-span-3 flex flex-col items-start lg:items-end gap-3">
              <button
                onClick={openRegister}
                className="btn-editorial-primary w-full sm:w-auto px-8 py-4 font-display font-extrabold text-sm sm:text-base uppercase tracking-wider shadow-poster flex items-center justify-center gap-2"
              >
                <span>ĐĂNG KÝ VÉ NGAY ↗</span>
              </button>
              <button
                onClick={openLookup}
                className="font-mono text-xs text-csg-black/70 hover:text-csg-red underline decoration-1 underline-offset-4"
              >
                Tra cứu vé & số dư cá nhân →
              </button>
            </div>
          </div>
        </section>

        {/* ================= 04. OPTIONAL WISH / MESSAGE ================= */}
        <section id="wishes" className="py-16 sm:py-24 px-4 sm:px-8 max-w-3xl mx-auto border-t-2 border-csg-black text-center space-y-6">
          <span className="font-mono text-xs font-bold text-csg-red tracking-widest uppercase">
            04 // WISH
          </span>
          <h2 className="text-2xl sm:text-4xl font-display font-extrabold uppercase text-csg-black">
            Để lại một điều cho những năm tháng này.
          </h2>

          {wishSubmitted ? (
            <div className="p-6 bg-csg-surface border-2 border-csg-black font-mono text-xs text-csg-black flex items-center justify-center gap-2">
              <Check className="w-4 h-4 text-csg-red" />
              <span>Cảm ơn bạn. Lời chúc đã được lưu lại trong cuốn kỷ yếu 17 năm!</span>
            </div>
          ) : (
            <form onSubmit={handleWishSubmit} className="space-y-3 text-left">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Họ tên / Khóa (VD: Anh Phát K12)"
                  value={wishAuthor}
                  onChange={(e) => setWishAuthor(e.target.value)}
                  className="px-3.5 py-3 bg-csg-paper border-2 border-csg-black text-xs font-mono sm:w-1/3 outline-none focus:bg-white focus:ring-1 focus:ring-csg-red"
                  required
                />
                <input
                  type="text"
                  placeholder="Một dòng nhắn gửi Cóc Sài Gòn..."
                  value={wishContent}
                  onChange={(e) => setWishContent(e.target.value)}
                  className="px-3.5 py-3 bg-csg-paper border-2 border-csg-black text-xs font-mono flex-1 outline-none focus:bg-white focus:ring-1 focus:ring-csg-red"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-csg-black text-csg-yellow font-mono text-xs font-bold uppercase tracking-wider hover:bg-csg-red transition-colors flex items-center justify-center gap-2"
              >
                <span>GỬI LƯU BÚT 17Y →</span>
              </button>
            </form>
          )}
        </section>

      </main>

      {/* ================= 05. MINIMALIST COLOPHON FOOTER ================= */}
      <footer className="relative z-10 bg-csg-surface border-t-2 border-csg-black py-8 px-4 sm:px-8">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-csg-black/70 text-center sm:text-left">
          <div>
            <span className="font-bold text-csg-black">CÓC SÀI GÒN // 17 YEARS (2009 — 2026)</span>
            <p className="text-[11px] text-csg-black/50">Asiana Plaza Tân Phú, TP. Hồ Chí Minh</p>
          </div>

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

      {/* ================= FUNCTIONAL MODALS ================= */}
      {/* Registration Modal: Preserves 100% of 6-Step Workflow */}
      <RegistrationModal
        isOpen={isRegisterOpen}
        onClose={closeModals}
        onRegistrationComplete={handleRegistrationComplete}
        onOpenPortal={openLookup}
      />

      {/* Payment Lookup Modal: Preserves Balance Payment & Ticket Access */}
      <PaymentLookupModal
        isOpen={isLookupOpen}
        onClose={closeModals}
        onPaymentSuccess={() => {}}
      />

      {/* Admin Dashboard: Preserves Full Security Verification & Check-in */}
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
