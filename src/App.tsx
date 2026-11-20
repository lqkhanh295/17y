import React, { useState, useEffect } from 'react';
import { ArrowRight, ShieldCheck, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AudioPlayerToggle } from './components/AudioPlayerToggle';
import { MemoryAlbum } from './components/MemoryAlbum';
import { RegistrationModal } from './components/RegistrationModal';
import { PaymentLookupModal } from './components/PaymentLookupModal';
import { AdminDashboard } from './components/AdminDashboard';
import { RegistrationRecord } from './types';
import { apiClient } from './services/apiClient';
import { audioService } from './services/audioService';

// Fallback seed registrations
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

      {/* ================= MINIMAL NAVIGATION ================= */}
      <header className="sticky top-0 z-40 bg-csg-paper/95 backdrop-blur-md border-b-2 border-csg-black">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          {/* Identity */}
          <a href="/" onClick={(e) => { e.preventDefault(); closeModals(); }} className="flex items-center gap-2 group">
            <span className="font-display font-extrabold text-lg sm:text-xl uppercase tracking-tight text-csg-black">
              CÓC SÀI GÒN <span className="text-csg-red">17Y</span>
            </span>
          </a>

          {/* Minimal Links */}
          <nav className="flex items-center gap-6 sm:gap-8 font-mono text-xs font-bold uppercase tracking-wider text-csg-black/80">
            <a href="#memories" className="hover:text-csg-red transition-colors">
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

      {/* Main Content Area */}
      <main className="relative z-10 flex-1">
        
        {/* ================= 01. THE NEW HERO: VISUAL CENTERPIECE ================= */}
        <section className="pt-8 sm:pt-14 pb-16 sm:pb-24 px-4 sm:px-8 max-w-[1400px] mx-auto">
          <div className="space-y-6 sm:space-y-10">
            
            {/* Top Identity Line */}
            <div className="flex items-baseline justify-between border-b-2 border-csg-black pb-3 font-mono text-xs text-csg-black/70">
              <span className="font-bold text-csg-black uppercase tracking-wider">
                17 NĂM CÓC SÀI GÒN • 2009 — 2026
              </span>
              <span className="font-bold text-csg-red tracking-widest uppercase">
                19.12.2026 • GALA DINNER
              </span>
            </div>

            {/* Visual Centerpiece (The Photobook Open Spread) */}
            <div className="relative border-2 border-csg-black shadow-poster-lg overflow-hidden bg-csg-muted">
              <img
                src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1800&q=85"
                alt="Đại tiệc kỷ niệm Cóc Sài Gòn"
                className="w-full aspect-[16/9] sm:aspect-[21/9] object-cover filter contrast-[102%] saturate-[105%]"
              />

              {/* Watermark 17Y inside the image */}
              <div 
                aria-hidden="true" 
                className="absolute top-4 right-4 sm:top-8 sm:right-8 text-6xl sm:text-9xl font-display font-extrabold text-white/20 select-none pointer-events-none"
              >
                17Y
              </div>
            </div>

            {/* Short Meaningful Headline & Direct Action */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-2">
              <div className="space-y-2 max-w-2xl">
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold uppercase tracking-tight text-csg-black leading-[0.92]">
                  NHỮNG NĂM THÁNG <br />
                  <span className="font-editorial italic font-normal text-csg-red text-5xl sm:text-7xl lg:text-8xl">
                    Mình Đã Cùng Nhau.
                  </span>
                </h1>
                <p className="font-editorial italic text-base sm:text-lg text-csg-black/75 pt-1">
                  "Không cần đọc nhiều. Chỉ cần nhìn những bức ảnh, là nhớ lại những năm tháng đó."
                </p>
              </div>

              {/* Primary Single CTA */}
              <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <button
                  onClick={openRegister}
                  className="btn-editorial-primary px-8 py-4 font-display font-extrabold text-base sm:text-lg uppercase tracking-wider flex items-center justify-center gap-2 shadow-poster"
                >
                  <span>ĐĂNG KÝ THAM GIA</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* ================= 02. MEMORY ALBUM: FLUID PHOTO JOURNEY ================= */}
        <MemoryAlbum />

        {/* ================= 03. COMPACT EVENT INVITATION ================= */}
        <section id="event" className="py-20 sm:py-28 px-4 sm:px-8 max-w-[1400px] mx-auto border-t-2 border-csg-black">
          <div className="bg-csg-surface border-2 border-csg-black shadow-poster p-6 sm:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Event Title */}
              <div className="lg:col-span-5 space-y-2">
                <span className="font-mono text-xs font-bold text-csg-red tracking-widest uppercase">
                  THƯ MỜI SỰ KIỆN
                </span>
                <h2 className="text-3xl sm:text-5xl font-display font-extrabold uppercase text-csg-black leading-[0.95]">
                  Đại Tiệc Gala 17Y <br />
                  <span className="font-editorial italic font-normal text-csg-red text-2xl sm:text-4xl">Đêm Hội Ngộ.</span>
                </h2>
              </div>

              {/* Essential Event Metadata List */}
              <div className="lg:col-span-4 font-mono text-xs sm:text-sm divide-y divide-csg-black/15 py-1">
                <div className="flex justify-between py-2.5">
                  <span className="text-csg-black/60 uppercase">THỜI GIAN:</span>
                  <span className="font-bold text-csg-black">18:00 • Thứ Bảy, 19.12.2026</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-csg-black/60 uppercase">ĐỊA ĐIỂM:</span>
                  <span className="font-bold text-csg-black">Asiana Plaza Tân Phú, TP. HCM</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-csg-black/60 uppercase">TRANG PHỤC:</span>
                  <span className="font-bold text-csg-black">Sắc Áo Vàng truyền thống</span>
                </div>
              </div>

              {/* Action Column */}
              <div className="lg:col-span-3 flex flex-col items-stretch lg:items-end gap-3">
                <button
                  onClick={openRegister}
                  className="btn-editorial-primary px-6 py-4 font-display font-extrabold text-sm sm:text-base uppercase tracking-wider shadow-poster flex items-center justify-center gap-2"
                >
                  <span>ĐĂNG KÝ VÉ ↗</span>
                </button>
                <button
                  onClick={openLookup}
                  className="font-mono text-xs text-csg-black/70 hover:text-csg-red underline decoration-1 underline-offset-4 text-center lg:text-right"
                >
                  Tra cứu vé đã đặt →
                </button>
              </div>

            </div>
          </div>
        </section>

        {/* ================= 04. COMPACT WISH BOX ================= */}
        <section className="py-16 sm:py-20 px-4 sm:px-8 max-w-2xl mx-auto border-t-2 border-csg-black text-center space-y-4">
          <h3 className="text-xl sm:text-2xl font-display font-extrabold uppercase text-csg-black">
            Để lại một điều cho những năm tháng này.
          </h3>

          {wishSubmitted ? (
            <div className="p-4 bg-csg-surface border-2 border-csg-black font-mono text-xs text-csg-black flex items-center justify-center gap-2">
              <Check className="w-4 h-4 text-csg-red" />
              <span>Cảm ơn bạn. Lời chúc đã được lưu lại trong kỷ yếu 17 năm!</span>
            </div>
          ) : (
            <form onSubmit={handleWishSubmit} className="space-y-3 text-left">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Tên / Khóa (VD: Anh Phát K12)"
                  value={wishAuthor}
                  onChange={(e) => setWishAuthor(e.target.value)}
                  className="px-3.5 py-2.5 bg-csg-paper border-2 border-csg-black text-xs font-mono sm:w-1/3 outline-none focus:bg-white"
                  required
                />
                <input
                  type="text"
                  placeholder="Một dòng gửi Cóc Sài Gòn..."
                  value={wishContent}
                  onChange={(e) => setWishContent(e.target.value)}
                  className="px-3.5 py-2.5 bg-csg-paper border-2 border-csg-black text-xs font-mono flex-1 outline-none focus:bg-white"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-csg-black text-csg-yellow font-mono text-xs font-bold uppercase tracking-wider hover:bg-csg-red transition-colors"
              >
                GỬI LƯU BÚT 17Y →
              </button>
            </form>
          )}
        </section>

      </main>

      {/* ================= 05. COLOPHON FOOTER ================= */}
      <footer className="relative z-10 bg-csg-surface border-t-2 border-csg-black py-6 px-4 sm:px-8">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs text-csg-black/70 text-center sm:text-left">
          <span>CÓC SÀI GÒN // 17 YEARS (2009 — 2026) • ASIANA PLAZA TÂN PHÚ</span>

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
