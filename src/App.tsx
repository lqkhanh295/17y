import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Calendar, MapPin, Clock, ArrowRight, ShieldCheck, 
  Search, Heart, Music, ChevronRight, CheckCircle2, Users, Award,
  PartyPopper, MessageSquare, Quote, Shirt, Wine, Gift, Compass, Menu, X,
  Bookmark, Ticket, Image as ImageIcon
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AudioPlayerToggle } from './components/AudioPlayerToggle';
import { MemoryWall } from './components/MemoryWall';
import { RegistrationModal } from './components/RegistrationModal';
import { PaymentLookupModal } from './components/PaymentLookupModal';
import { AdminDashboard } from './components/AdminDashboard';
import { CelebrationStage } from './components/CelebrationStage';
import { CinematicFilmOpening } from './components/CinematicFilmOpening';
import { MascotFrog, RegistrationRecord } from './types';
import { apiClient } from './services/apiClient';
import { audioService } from './services/audioService';

// Target Event Timestamp: Saturday, December 19, 2026 at 18:00 (GMT+7)
const EVENT_TIMESTAMP = new Date('2026-12-19T18:00:00+07:00').getTime();

function calculateTimeLeft() {
  const now = Date.now();
  const diff = Math.max(0, EVENT_TIMESTAMP - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}

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
    // Skip if user prefers reduced motion
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return false;
    }
    // Skip if navigating directly into sub-routes or specific anchor sections
    const path = window.location.pathname;
    if (path === '/register' || path === '/portal' || path === '/admin' || window.location.hash) {
      return false;
    }
    // Skip if already watched in this session
    return sessionStorage.getItem('csg17y_film_intro_viewed') !== 'true';
  });

  // Modal states
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isLookupOpen, setIsLookupOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Registrations state
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>(INITIAL_REGISTRATIONS);

  // Mascots crowd on Celebration Stage
  const [stageCharacters, setStageCharacters] = useState<MascotFrog[]>([
    {
      id: 'char-1',
      name: 'Anh Huỳnh Tấn Phát',
      role: 'ALUMNI',
      wish: 'Chúc Cóc Sài Gòn mãi là ngôi nhà ấm áp của bao thế hệ! 💛',
      x: 18,
      y: 78,
      scale: 1,
      direction: 1
    },
    {
      id: 'char-2',
      name: 'Chị Trần Thảo My',
      role: 'ALUMNI',
      wish: 'Hẹn gặp lại các em tại đêm tiệc 17Y hoành tráng! ✨',
      x: 48,
      y: 82,
      scale: 1,
      direction: -1
    },
    {
      id: 'char-3',
      name: 'Bạn Nguyễn Phúc An',
      role: 'ACTIVE',
      wish: 'Đêm nay Cóc cháy hết mình nha anh em ơi! 🔥',
      x: 75,
      y: 75,
      scale: 1,
      direction: 1
    }
  ]);

  // Public wishes highlight
  const [wishesList, setWishesList] = useState<any[]>([]);

  // Real Dynamic Countdown Timer
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // URL-based routing handlers
  const openRegister = () => {
    if (window.location.pathname !== '/register') {
      window.history.pushState({}, '', '/register');
    }
    setIsRegisterOpen(true);
    setIsLookupOpen(false);
    setIsAdminOpen(false);
    setIsMobileMenuOpen(false);
  };

  const openLookup = () => {
    if (window.location.pathname !== '/portal') {
      window.history.pushState({}, '', '/portal');
    }
    setIsLookupOpen(true);
    setIsRegisterOpen(false);
    setIsAdminOpen(false);
    setIsMobileMenuOpen(false);
  };

  const openAdmin = () => {
    if (window.location.pathname !== '/admin') {
      window.history.pushState({}, '', '/admin');
    }
    setIsAdminOpen(true);
    setIsRegisterOpen(false);
    setIsLookupOpen(false);
    setIsMobileMenuOpen(false);
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

  // Load live data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const chars = await apiClient.getStageCharacters();
        if (chars && chars.length > 0) {
          setStageCharacters(chars);
        }
      } catch (err) {
        console.warn('Using seeded characters fallback:', err);
      }

      try {
        const wishes = await apiClient.getPublicWishes();
        if (wishes && wishes.length > 0) {
          setWishesList(wishes);
        }
      } catch (err) {
        console.warn('Using seeded wishes fallback:', err);
      }
    };

    fetchData();
  }, []);

  // Handle new registration completed
  const handleRegistrationComplete = (newRecord: RegistrationRecord) => {
    setRegistrations(prev => [newRecord, ...prev]);

    // Spawn new mascot frog on the celebration stage
    const newMascot: MascotFrog = {
      id: 'mascot-' + Date.now(),
      name: `${newRecord.honorific} ${newRecord.fullName}`,
      role: newRecord.role,
      wish: newRecord.wishes,
      x: 30 + Math.random() * 40,
      y: 72 + Math.random() * 12,
      scale: 1,
      direction: Math.random() > 0.5 ? 1 : -1
    };
    setStageCharacters(prev => [...prev, newMascot]);

    // Also add to public wishes preview
    setWishesList(prev => [{
      id: 'w-' + Date.now(),
      authorName: `${newRecord.honorific} ${newRecord.fullName}`,
      role: newRecord.role,
      content: newRecord.wishes,
      isPublic: true,
      moderationStatus: 'APPROVED'
    }, ...prev]);

    // Trigger celebration effects
    audioService.playCelebrationChime();
    confetti({
      particleCount: 80,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#F4C542', '#B94D35', '#20231F', '#10B981', '#F4EEDF']
    });
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
      {/* One-Time Cinematic Analog Film Opening */}
      {showCinematicIntro && (
        <CinematicFilmOpening onComplete={() => setShowCinematicIntro(false)} />
      )}

      {/* Floating Audio Controller */}
      <AudioPlayerToggle />

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-csg-paper/95 backdrop-blur-md border-b-2 border-csg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          {/* Masthead Brand */}
          <a href="/" onClick={(e) => { e.preventDefault(); closeModals(); }} className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-csg-yellow border-2 border-csg-black flex items-center justify-center text-csg-black font-extrabold text-xl shadow-poster-sm transition-transform group-hover:scale-105">
              <span>🐸</span>
            </div>
            <div>
              <span className="font-display font-extrabold text-lg sm:text-xl uppercase tracking-tight text-csg-black block leading-none">
                CÓC SÀI GÒN <span className="text-csg-red">17Y</span>
              </span>
              <span className="text-[10px] font-mono tracking-widest text-csg-black/70 uppercase">
                Ấn Phẩm Kỷ Niệm 17 Năm • 2009 - 2026
              </span>
            </div>
          </a>

          {/* Quick Nav Links */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-csg-black/80 font-mono">
            <a href="#the-party" className="hover:text-csg-red hover:underline decoration-csg-yellow decoration-2 transition-colors">
              The Party
            </a>
            <a href="#ky-niem" className="hover:text-csg-red hover:underline decoration-csg-yellow decoration-2 transition-colors">
              Kỷ Yếu Kỷ Niệm
            </a>
            <a href="#wishes" className="hover:text-csg-red hover:underline decoration-csg-yellow decoration-2 transition-colors">
              Lưu Bút 17Y
            </a>
            <a href="#san-khau" className="hover:text-csg-red hover:underline decoration-csg-yellow decoration-2 transition-colors">
              Stage 17Y
            </a>
          </nav>

          {/* Action Links */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={openLookup}
              className="hidden sm:inline font-mono text-xs font-bold text-csg-black/80 hover:text-csg-red underline decoration-1 underline-offset-4 py-2 transition-colors"
            >
              Tra cứu vé cá nhân
            </button>

            <button
              onClick={openRegister}
              className="btn-editorial-primary px-4 sm:px-5 py-2.5 font-display font-bold text-xs sm:text-sm uppercase tracking-wide flex items-center gap-2"
            >
              <span>Đăng Ký Tham Gia</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 bg-csg-surface border-2 border-csg-black text-csg-black hover:bg-csg-muted transition-colors ml-1"
              aria-label="Mở menu di động"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-csg-red" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-csg-paper border-t-2 border-b-2 border-csg-black px-4 py-4 space-y-3 animate-fadeIn shadow-poster">
            <div className="flex flex-col space-y-2 text-xs font-bold uppercase tracking-wider font-mono">
              <a 
                href="#the-party" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 hover:bg-csg-surface text-csg-black hover:text-csg-red transition-colors flex items-center justify-between border-b border-csg-muted"
              >
                <span>The Party (Đêm tiệc 17Y)</span>
                <ChevronRight className="w-4 h-4 text-csg-black/40" />
              </a>
              <a 
                href="#ky-niem" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 hover:bg-csg-surface text-csg-black hover:text-csg-red transition-colors flex items-center justify-between border-b border-csg-muted"
              >
                <span>Kỷ Yếu Kỷ Niệm (Tư Liệu)</span>
                <ChevronRight className="w-4 h-4 text-csg-black/40" />
              </a>
              <a 
                href="#wishes" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 hover:bg-csg-surface text-csg-black hover:text-csg-red transition-colors flex items-center justify-between border-b border-csg-muted"
              >
                <span>Wish Gate (Lưu bút 17Y)</span>
                <ChevronRight className="w-4 h-4 text-csg-black/40" />
              </a>
              <a 
                href="#san-khau" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 hover:bg-csg-surface text-csg-black hover:text-csg-red transition-colors flex items-center justify-between"
              >
                <span>Stage 17Y (Sân khấu Cóc Vàng)</span>
                <ChevronRight className="w-4 h-4 text-csg-black/40" />
              </a>
            </div>

            <div className="pt-3 border-t border-csg-black/15 flex flex-col gap-2">
              <button
                onClick={openRegister}
                className="btn-editorial-primary w-full py-3 font-display font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2"
              >
                <span>Đăng Ký Tham Gia Ngay</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={openLookup}
                className="w-full py-2.5 bg-csg-surface text-csg-black border-2 border-csg-black text-xs font-bold font-mono flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4 text-csg-red" />
                <span>Tra cứu vé cá nhân & hồ sơ</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1">
        {/* ================= HERO SECTION (EDITORIAL BROADSIDE & MAGAZINE COVER) ================= */}
        <section className="pt-6 sm:pt-10 pb-16 px-4 sm:px-6 max-w-7xl mx-auto">
          {/* Masthead Eyebrow & Top Broadside Banner */}
          <div className="border-b-2 border-csg-black pb-4 mb-8 sm:mb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="font-mono text-[11px] text-csg-black/60 uppercase tracking-widest mb-1.5 flex flex-wrap items-center gap-2">
                  <span>ĐẠI HỌC FPT TP. HỒ CHÍ MINH</span>
                  <span>•</span>
                  <span>CLB TRUYỀN THÔNG CÓC SÀI GÒN</span>
                  <span>•</span>
                  <span className="text-csg-red font-bold">2009 - 2026</span>
                </div>
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold uppercase tracking-[-0.03em] text-csg-black leading-[0.9]">
                  NHỮNG NĂM THÁNG <br className="hidden sm:inline" />
                  <span className="text-csg-red underline decoration-csg-yellow decoration-4 underline-offset-4">MÌNH ĐÃ</span> CÙNG NHAU.
                </h1>
              </div>
              <div className="font-mono text-left md:text-right text-xs text-csg-black/75 space-y-0.5 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-csg-black/20">
                <p className="font-bold text-csg-black">GALA DINNER • 17 YEARS OF MEMORIES</p>
                <p>18:00 • THỨ BẢY, 19/12/2026</p>
                <p className="text-csg-red font-bold">ASIANA PLAZA TÂN PHÚ</p>
              </div>
            </div>
          </div>

          {/* Asymmetric Editorial Spread */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
            {/* Left Column: Typographic Narrative, Colophon & RSVP (7 Columns) */}
            <div className="lg:col-span-7 space-y-6">
              <p className="font-editorial italic text-2xl sm:text-3xl text-csg-black/90 leading-snug">
                "17 năm sắc áo vàng — Nơi thanh xuân tụ hội và câu chuyện chưa bao giờ kết thúc."
              </p>

              <p className="text-csg-black/80 font-sans text-sm sm:text-base leading-relaxed max-w-xl">
                Dành riêng cho các thế hệ Cựu thành viên và Thành viên đương nhiệm CLB Truyền thông Cóc Sài Gòn. Cùng ngồi lại bên nhau, lật mở cuốn kỷ yếu sống, thổi nến sinh nhật và thắp sáng sân khấu tuổi 17.
              </p>

              {/* Event Colophon (Clean Typographic List, Unboxed) */}
              <div className="py-4 border-y border-csg-black/20 space-y-2.5 font-mono text-xs max-w-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1 border-b border-csg-black/10">
                  <span className="text-csg-black/60 uppercase">THỜI GIAN KHAI TIỆC</span>
                  <span className="font-bold text-csg-black">18:00 • Thứ Bảy, 19 Tháng 12, 2026</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1 border-b border-csg-black/10">
                  <span className="text-csg-black/60 uppercase">ĐỊA ĐIỂM TỔ CHỨC</span>
                  <span className="font-bold text-csg-black">Asiana Plaza Tân Phú, TP. Hồ Chí Minh</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1 border-b border-csg-black/10">
                  <span className="text-csg-black/60 uppercase">DRESS CODE</span>
                  <span className="font-bold text-csg-black">Sắc Áo Vàng hoặc Vàng - Đen - Trắng</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1">
                  <span className="text-csg-black/60 uppercase">QUY MÔ THAM DỰ</span>
                  <span className="font-bold text-csg-black">200 ghế ngồi dành riêng cho các thế hệ Cóc</span>
                </div>
              </div>

              {/* Countdown Colophon (Single Elegant Monospaced Line) */}
              <div className="font-mono text-xs text-csg-black/80 flex flex-wrap items-center gap-2 pt-1">
                <span className="w-2 h-2 rounded-full bg-csg-red animate-pulse" />
                <span className="font-bold tracking-wider uppercase text-csg-black/70">ĐẾM NGƯỢC KHAI TIỆC:</span>
                <span className="font-extrabold text-csg-black text-sm tracking-wide">
                  {timeLeft.days} NGÀY {String(timeLeft.hours).padStart(2, '0')} GIỜ {String(timeLeft.minutes).padStart(2, '0')} PHÚT {String(timeLeft.seconds).padStart(2, '0')} GIÂY
                </span>
              </div>

              {/* Primary Invitation RSVP Action */}
              <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <button
                  onClick={openRegister}
                  className="btn-editorial-primary px-8 py-4 font-display font-extrabold text-base sm:text-lg uppercase tracking-wider flex items-center justify-center gap-3 shadow-poster"
                >
                  <span>MỞ THIỆP ĐĂNG KÝ THAM GIA</span>
                  <ArrowRight className="w-5 h-5" />
                </button>

                <button
                  onClick={openLookup}
                  className="font-mono text-xs font-bold text-csg-black/75 hover:text-csg-red underline decoration-1 underline-offset-4 py-2 text-center sm:text-left transition-colors"
                >
                  Tra cứu vé cá nhân & hồ sơ đã duyệt →
                </button>
              </div>

              <p className="text-[11px] font-mono text-csg-black/60 italic">
                * Quy chế tham dự và hỗ trợ chia đợt đóng phí sẽ được tự động cá nhân hóa theo vai trò (Cựu thành viên / Thành viên đương nhiệm) sau bước định danh.
              </p>
            </div>

            {/* Right Column: Prominent Archival Photograph (5 Columns) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="relative aspect-[4/3] bg-csg-muted overflow-hidden border-2 border-csg-black shadow-poster">
                <img
                  src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80"
                  alt="Đêm Gala Cóc Sài Gòn"
                  className="w-full h-full object-cover filter contrast-[103%] saturate-[108%]"
                />
              </div>
              <div className="flex items-center justify-between font-mono text-[11px] text-csg-black/70 border-t border-csg-black/15 pt-2">
                <span className="font-bold text-csg-black">PLATE 17 // ĐÊM HOÀNG KIM GALA 16Y</span>
                <span>TƯ LIỆU LƯU TRỮ CSG • 2025</span>
              </div>
              <p className="font-editorial italic text-sm text-csg-black/80">
                "Có những nơi dù đã đi qua bao lâu, vẫn luôn có một chỗ để trở về."
              </p>
            </div>
          </div>
        </section>

        {/* ================= SECTION: THE PARTY (VỀ ĐÊM TIỆC 17Y) ================= */}
        <section id="the-party" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto border-t-2 border-csg-black">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left Column: Narrative Headline */}
            <div className="lg:col-span-5 space-y-6">
              <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-csg-red uppercase">
                <span>THE PARTY • GALA 17Y</span>
                <span className="w-1.5 h-1.5 rounded-full bg-csg-red" />
              </div>
              <h2 className="text-3xl sm:text-5xl font-display font-extrabold uppercase text-csg-black tracking-tight leading-tight">
                Không Chỉ Là Một Buổi Tiệc. <br />
                <span className="text-csg-red">Là Nơi Trở Về.</span>
              </h2>
              <p className="text-csg-black/80 font-sans text-base leading-relaxed">
                17 năm thành lập CLB Truyền thông Cóc Sài Gòn (2009 - 2026) đánh dấu hành trình của hàng trăm bạn trẻ mang trong mình ngọn lửa truyền thông, nhiếp ảnh, thiết kế và tổ chức sự kiện tại ĐH FPT TP.HCM.
              </p>
              <p className="text-csg-black/80 font-sans text-base leading-relaxed">
                Đêm tiệc sinh nhật 17 tuổi là khoảnh khắc đặc biệt để những người anh, người chị đã ra trường cùng các bạn thành viên thế hệ mới hội ngộ, hàn huyên và nâng ly vì một thanh xuân rực rỡ sắc vàng.
              </p>

              {/* Policy Note (No secret prices revealed publicly) */}
              <div className="p-4 bg-csg-surface border-2 border-csg-black space-y-1">
                <span className="text-xs font-mono font-bold text-csg-black uppercase block">
                  ✨ Cơ chế tài chính công bằng & đồng hành:
                </span>
                <p className="text-xs text-csg-black/80 font-sans">
                  Hệ thống hỗ trợ cơ chế thanh toán linh hoạt (đóng trọn gói hoặc đặt cọc giữ chỗ trước) phù hợp cho từng bạn. Vé QR check-in VIP tự động cấp khi hoàn tất xác thực.
                </p>
              </div>
            </div>

            {/* Right Column: Editorial Schedule Flow (Unboxed) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b-2 border-csg-black pb-2">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-csg-black">
                    CHƯƠNG TRÌNH ĐÊM ĐẠI TIỆC // PROGRAMME
                  </h3>
                  <span className="font-mono text-xs text-csg-black/60">19.12.2026</span>
                </div>

                <div className="divide-y divide-csg-black/15 font-mono text-xs">
                  <div className="py-3.5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-4">
                    <span className="font-bold text-csg-red w-36 shrink-0 text-xs sm:text-sm">18:00 — 18:45</span>
                    <div className="flex-1">
                      <span className="font-bold text-csg-black font-sans text-sm block">Đón Tiếp, Thảm Đỏ & Check-in Polaroid</span>
                      <span className="text-csg-black/70 font-sans text-xs block mt-0.5">
                        Nhận thẻ đeo check-in QR, chụp ảnh lưu niệm lấy liền cùng các thế hệ và ký tên vào bảng lưu bút 17 năm.
                      </span>
                    </div>
                  </div>

                  <div className="py-3.5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-4">
                    <span className="font-bold text-csg-red w-36 shrink-0 text-xs sm:text-sm">18:45 — 19:30</span>
                    <div className="flex-1">
                      <span className="font-bold text-csg-black font-sans text-sm block">Khai Mạc, Thước Phim 17Y & Thổi Nến</span>
                      <span className="text-csg-black/70 font-sans text-xs block mt-0.5">
                        Công chiếu video tư liệu 17 mùa sắc áo vàng, tri ân ban điều hành các thời kỳ và khoảnh khắc thổi nến đại gia đình.
                      </span>
                    </div>
                  </div>

                  <div className="py-3.5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-4">
                    <span className="font-bold text-csg-red w-36 shrink-0 text-xs sm:text-sm">19:30 — 20:30</span>
                    <div className="flex-1">
                      <span className="font-bold text-csg-black font-sans text-sm block">Khai Tiệc Gala Dinner & Nâng Ly</span>
                      <span className="text-csg-black/70 font-sans text-xs block mt-0.5">
                        Thưởng thức đại tiệc ẩm thực phong phú tại Asiana Plaza, giao lưu và kết nối giữa các thế hệ cựu thành viên và đương nhiệm.
                      </span>
                    </div>
                  </div>

                  <div className="py-3.5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-4">
                    <span className="font-bold text-csg-red w-36 shrink-0 text-xs sm:text-sm">20:30 — 22:00</span>
                    <div className="flex-1">
                      <span className="font-bold text-csg-black font-sans text-sm block">Sân Khấu Âm Nhạc Bùng Nổ & Lucky Draw</span>
                      <span className="text-csg-black/70 font-sans text-xs block mt-0.5">
                        Các tiết mục ca nhạc tự biên đặc sắc của Cóc, bốc thăm may mắn quà tặng giới hạn 17Y và chụp ảnh kỷ niệm toàn đoàn.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= SCENE 01: PHOTOBOOK KỶ NIỆM (MEMORY WALL) ================= */}
        <section id="ky-niem">
          <MemoryWall />
        </section>

        {/* ================= SCENE 04: WISH GATE HIGHLIGHTS ================= */}
        <section id="wishes" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto border-t-2 border-csg-black">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-csg-muted">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-csg-red uppercase mb-2">
                <span>SCENE 04 • WISH GATE</span>
                <span className="w-1.5 h-1.5 rounded-full bg-csg-red" />
              </div>
              <h2 className="text-3xl sm:text-5xl font-display font-extrabold uppercase text-csg-black tracking-tight">
                Lưu Bút & Lời Chúc 17Y
              </h2>
              <p className="text-sm sm:text-base text-csg-black/70 font-sans mt-1">
                Những dòng lưu bút và lời chúc chân thành từ các thế hệ Cóc Vàng gửi về mái nhà chung.
              </p>
            </div>

            <button
              onClick={openRegister}
              className="mt-4 md:mt-0 text-xs font-mono font-bold text-csg-black hover:text-csg-red flex items-center gap-1 underline decoration-csg-yellow decoration-2 underline-offset-4"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Gửi lời chúc của bạn →</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(wishesList.length > 0 ? wishesList.slice(0, 3) : [
              {
                id: 'w-1',
                authorName: 'Huỳnh Tấn Phát',
                role: 'Cựu Thành Viên • K12',
                content: 'Chúc Cóc Sài Gòn mãi là ngôi nhà ấm áp của bao thế hệ! Hẹn gặp lại các anh chị em ngày 19/12.'
              },
              {
                id: 'w-2',
                authorName: 'Nguyễn Phúc An',
                role: 'Thành Viên Đương Nhiệm • K18',
                content: 'Đêm nay Cóc cháy hết mình nha anh em ơi! Tự hào là một phần của đại gia đình sắc áo vàng.'
              },
              {
                id: 'w-3',
                authorName: 'Trần Thảo My',
                role: 'Cựu Thành Viên • K13',
                content: 'Hẹn gặp lại các em tại đêm tiệc 17Y hoành tráng! 17 năm một chặng đường rực rỡ.'
              }
            ]).map((w) => (
              <div key={w.id} className="py-5 px-6 border-l-2 border-csg-black bg-csg-surface/50 space-y-3">
                <p className="font-editorial italic text-base text-csg-black/90 leading-relaxed">
                  "{w.content}"
                </p>
                <div className="pt-2 border-t border-csg-black/10 flex flex-col font-mono text-xs">
                  <span className="font-bold text-csg-black">
                    {w.authorName}
                  </span>
                  <span className="text-[11px] text-csg-red font-medium">
                    {w.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================= SCENE 05: CELEBRATION STAGE ================= */}
        <CelebrationStage 
          characters={stageCharacters}
          onOpenRegister={openRegister}
        />

        {/* ================= SECTION: EDITORIAL CLOSING SPREAD ================= */}
        <section className="py-20 sm:py-28 px-4 sm:px-6 border-t-2 border-csg-black">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <span className="font-mono text-xs font-bold text-csg-red uppercase tracking-widest block">
              LỜI NGỎ KẾT THÚC // VOL. XVII
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-display font-extrabold uppercase text-csg-black tracking-tight leading-[0.95]">
              BẠN LÀ MỘT PHẦN CỦA CÂU CHUYỆN NÀY. <br />
              <span className="font-editorial italic font-normal text-csg-red">Giờ là lúc cùng nhau viết tiếp.</span>
            </h2>
            <p className="max-w-xl mx-auto text-csg-black/80 font-sans text-sm sm:text-base leading-relaxed">
              Dù bạn thuộc Gen 1 hay Gen 16, dù đã rời trường nhiều năm hay đang ngày ngày tác nghiệp, chiếc áo vàng và những người bạn cũ vẫn luôn đợi bạn trở về.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={openRegister}
                className="btn-editorial-primary w-full sm:w-auto px-10 py-5 font-display font-extrabold text-base sm:text-lg uppercase tracking-wider shadow-poster flex items-center justify-center gap-3"
              >
                <span>MỞ THIỆP ĐĂNG KÝ THAM GIA ↗</span>
              </button>
              <button
                onClick={openLookup}
                className="font-mono text-xs font-bold text-csg-black/80 hover:text-csg-red underline decoration-1 underline-offset-4 py-3"
              >
                Tra cứu vé cá nhân & hồ sơ đã duyệt →
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Editorial Footer */}
      <footer className="relative z-10 bg-csg-surface py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🐸</span>
            <div>
              <span className="font-display font-extrabold uppercase tracking-wider text-csg-black block text-sm">
                CLB TRUYỀN THÔNG CÓC SÀI GÒN
              </span>
              <span className="text-xs text-csg-black/60 font-mono">
                17 Năm Đồng Hành Cùng Sinh Viên FPTU HCMC (2009 - 2026)
              </span>
            </div>
          </div>

          <div className="text-xs text-csg-black/80 font-mono space-y-1">
            <p>📍 Địa điểm: Asiana Plaza Tân Phú, TP. Hồ Chí Minh</p>
            <p>📞 Hotline hỗ trợ BTC: 0987.654.321 (Thủ Quỹ) • 0909.123.456 (Trưởng BTC)</p>
          </div>

          {/* Admin Portal Access */}
          <div>
            <button
              onClick={openAdmin}
              className="px-4 py-2 bg-csg-paper hover:bg-csg-muted text-csg-black text-xs font-bold border-2 border-csg-black transition-colors flex items-center gap-1.5 mx-auto md:mx-0 shadow-poster-sm"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-csg-red" />
              <span>Cổng Quản Trị BTC</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Registration Wizard Modal */}
      <RegistrationModal
        isOpen={isRegisterOpen}
        onClose={closeModals}
        onRegistrationComplete={handleRegistrationComplete}
        onOpenPortal={openLookup}
      />

      {/* Payment Lookup Modal */}
      <PaymentLookupModal
        isOpen={isLookupOpen}
        onClose={closeModals}
        onPaymentSuccess={() => {
          // Refresh registrations if needed
        }}
      />

      {/* Admin Dashboard Modal */}
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
