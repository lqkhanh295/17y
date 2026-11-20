import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Calendar, MapPin, Clock, ArrowRight, ShieldCheck, 
  Search, Heart, Music, ChevronRight, CheckCircle2, Users, Award,
  PartyPopper, MessageSquare, Quote, Shirt, Wine, Gift, Compass, Menu, X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AudioPlayerToggle } from './components/AudioPlayerToggle';
import { MemoryWall } from './components/MemoryWall';
import { RegistrationModal } from './components/RegistrationModal';
import { PaymentLookupModal } from './components/PaymentLookupModal';
import { AdminDashboard } from './components/AdminDashboard';
import { CelebrationStage } from './components/CelebrationStage';
import { MascotFrog, RegistrationRecord } from './types';
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

  // Countdown timer to Event Day (15/12/2026)
  const [timeLeft, setTimeLeft] = useState({
    days: 30,
    hours: 5,
    minutes: 42,
    seconds: 18
  });

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

  // Countdown tick
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
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
      colors: ['#F5C400', '#D94C2B', '#111111', '#10B981', '#F4F0E6']
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
    <div className="relative min-h-screen bg-csg-paper bg-paper-texture text-csg-black flex flex-col selection:bg-csg-yellow selection:text-csg-black">
      {/* Floating Audio Controller */}
      <AudioPlayerToggle />

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-csg-paper/95 backdrop-blur-md border-b-2 border-csg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          {/* Logo & Brand */}
          <a href="/" onClick={(e) => { e.preventDefault(); closeModals(); }} className="flex items-center gap-3 group">
            <div className="relative w-11 h-11 rounded-xl bg-csg-yellow border-2 border-csg-black flex items-center justify-center text-csg-black font-black text-2xl shadow-paper-sm transition-transform group-hover:scale-105">
              <span>🐸</span>
              <span className="absolute -bottom-2 -right-1 px-1 rounded bg-csg-black text-[9px] font-mono font-bold text-csg-yellow">
                17Y
              </span>
            </div>
            <div>
              <span className="font-display font-black text-lg sm:text-xl uppercase tracking-wider text-csg-black block leading-none">
                CÓC SÀI GÒN <span className="text-csg-red">17Y</span>
              </span>
              <span className="text-[11px] font-mono tracking-widest text-csg-black/70 uppercase">
                CLB Truyền Thông • 2009 - 2026
              </span>
            </div>
          </a>

          {/* Quick Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-bold uppercase tracking-wider text-csg-black/80 font-mono">
            <a href="#the-party" className="hover:text-csg-red hover:underline decoration-csg-yellow decoration-2 transition-colors">
              The Party
            </a>
            <a href="#ky-niem" className="hover:text-csg-red hover:underline decoration-csg-yellow decoration-2 transition-colors">
              Memories
            </a>
            <a href="#wishes" className="hover:text-csg-red hover:underline decoration-csg-yellow decoration-2 transition-colors">
              Wish Gate
            </a>
            <a href="#san-khau" className="hover:text-csg-red hover:underline decoration-csg-yellow decoration-2 transition-colors">
              Stage 17Y
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={openLookup}
              className="px-3.5 py-2.5 rounded-xl bg-csg-surface hover:bg-csg-muted text-csg-black border-2 border-csg-black text-xs font-bold transition-all flex items-center gap-1.5 shadow-paper-sm"
              title="Tra cứu số tiền còn thiếu, đóng số dư & xem vé QR"
            >
              <Search className="w-3.5 h-3.5 text-csg-red" />
              <span className="hidden sm:inline">Tra cứu vé & số dư</span>
              <span className="sm:hidden">Tra vé</span>
            </button>

            <button
              onClick={openRegister}
              className="btn-editorial-primary px-4 sm:px-5 py-2.5 rounded-xl font-display font-black text-xs sm:text-sm uppercase tracking-wide shadow-paper-sm flex items-center gap-2"
            >
              <span>Đăng Ký Tham Gia</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-csg-surface border-2 border-csg-black text-csg-black hover:bg-csg-muted transition-colors ml-1"
              aria-label="Mở menu di động"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-csg-red" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-csg-paper border-t-2 border-b-2 border-csg-black px-4 py-4 space-y-3 animate-fadeIn shadow-paper-md">
            <div className="flex flex-col space-y-2 text-xs font-bold uppercase tracking-wider font-mono">
              <a 
                href="#the-party" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 rounded-lg hover:bg-csg-surface text-csg-black hover:text-csg-red transition-colors flex items-center justify-between"
              >
                <span>The Party (Đêm tiệc 17Y)</span>
                <ChevronRight className="w-4 h-4 text-csg-black/40" />
              </a>
              <a 
                href="#ky-niem" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 rounded-lg hover:bg-csg-surface text-csg-black hover:text-csg-red transition-colors flex items-center justify-between"
              >
                <span>Memories (Photobook Tư Liệu)</span>
                <ChevronRight className="w-4 h-4 text-csg-black/40" />
              </a>
              <a 
                href="#wishes" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 rounded-lg hover:bg-csg-surface text-csg-black hover:text-csg-red transition-colors flex items-center justify-between"
              >
                <span>Wish Gate (Lưu bút 17Y)</span>
                <ChevronRight className="w-4 h-4 text-csg-black/40" />
              </a>
              <a 
                href="#san-khau" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 rounded-lg hover:bg-csg-surface text-csg-black hover:text-csg-red transition-colors flex items-center justify-between"
              >
                <span>Stage 17Y (Sân khấu Cóc Vàng)</span>
                <ChevronRight className="w-4 h-4 text-csg-black/40" />
              </a>
            </div>

            <div className="pt-3 border-t border-csg-black/15 flex flex-col gap-2">
              <button
                onClick={openRegister}
                className="btn-editorial-primary w-full py-3 rounded-xl font-display font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-paper-sm"
              >
                <span>Đăng Ký Tham Gia Ngay</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={openLookup}
                className="w-full py-2.5 rounded-xl bg-csg-surface text-csg-black border-2 border-csg-black text-xs font-bold font-mono flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4 text-csg-red" />
                <span>Tra cứu vé & đóng số dư</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1">
        {/* ================= HERO SECTION (SCENE 02 PREVIEW) ================= */}
        <section className="pt-16 pb-20 px-4 sm:px-6 max-w-6xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-csg-surface border-2 border-csg-black text-csg-black text-xs sm:text-sm font-mono font-bold mb-6 shadow-paper-sm">
            <Sparkles className="w-4 h-4 text-csg-yellow fill-csg-yellow" />
            <span>ĐẠI TIỆC GALA KỶ NIỆM 17 NĂM THÀNH LẬP CLB</span>
          </div>

          {/* Massive Display Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-black tracking-tight uppercase text-csg-black mb-6 leading-[0.98]">
            Những Năm Tháng Mình Đã Cùng Nhau.
            <br />
            <span className="text-csg-red underline decoration-csg-yellow decoration-8 underline-offset-8">
              17 Năm Sắc Áo Vàng
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-csg-black/80 font-sans text-base sm:text-xl leading-relaxed mb-10">
            Dành riêng cho các thế hệ Cựu thành viên và Thành viên đương nhiệm CLB Truyền thông Cóc Sài Gòn. Cùng ngồi lại bên nhau, thổi nến sinh nhật và đốt cháy sân khấu 17 tuổi!
          </p>

          {/* Event Quick Meta (Date & Venue) */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-csg-black font-mono mb-12">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-csg-surface border-2 border-csg-black shadow-paper-sm">
              <Calendar className="w-4 h-4 text-csg-red" />
              <span>18:00 • Thứ Bảy, 15/12/2026</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-csg-surface border-2 border-csg-black shadow-paper-sm">
              <MapPin className="w-4 h-4 text-csg-red" />
              <span>Asiana Plaza Tân Phú, TP. HCM</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-csg-surface border-2 border-csg-black shadow-paper-sm">
              <Users className="w-4 h-4 text-csg-red" />
              <span>Dự kiến: 200+ Cóc Vàng</span>
            </div>
          </div>

          {/* Countdown Clock with Editorial Paper Cards */}
          <div className="grid grid-cols-4 gap-3 sm:gap-6 max-w-lg mx-auto mb-12">
            {[
              { label: 'NGÀY', value: timeLeft.days },
              { label: 'GIỜ', value: timeLeft.hours },
              { label: 'PHÚT', value: timeLeft.minutes },
              { label: 'GIÂY', value: timeLeft.seconds },
            ].map((unit, i) => (
              <div key={i} className="p-3 sm:p-4 rounded-xl bg-csg-surface border-2 border-csg-black shadow-paper-sm">
                <span className="text-2xl sm:text-4xl font-display font-black text-csg-black font-mono block">
                  {String(unit.value).padStart(2, '0')}
                </span>
                <span className="text-[10px] sm:text-xs font-mono font-bold text-csg-black/60 tracking-wider">
                  {unit.label}
                </span>
              </div>
            ))}
          </div>

          {/* Primary CTA with Tactile Feedback */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={openRegister}
              className="btn-editorial-primary w-full sm:w-auto px-10 py-5 rounded-2xl font-display font-black text-lg sm:text-xl uppercase tracking-wider shadow-paper-md flex items-center justify-center gap-3"
            >
              <span>ĐĂNG KÝ THAM GIA TIỆC ↗</span>
            </button>

            <button
              onClick={openLookup}
              className="w-full sm:w-auto px-7 py-5 rounded-2xl bg-csg-surface hover:bg-csg-muted text-csg-black font-bold text-sm sm:text-base border-2 border-csg-black transition-all flex items-center justify-center gap-2 shadow-paper-sm"
            >
              <Search className="w-4 h-4 text-csg-red" />
              <span>Đã đặt cọc? Đóng nốt số dư tại đây</span>
            </button>
          </div>

          {/* Confidential Ticket Pricing Note */}
          <p className="text-xs text-csg-black/60 mt-6 font-mono italic">
            🔒 Mức phí tham dự (349.000đ Thành viên / 449.000đ Cựu thành viên) được bảo mật và tự động hiển thị sau bước định danh.
          </p>
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
              <h2 className="text-3xl sm:text-5xl font-display font-black uppercase text-csg-black tracking-tight leading-tight">
                Không Chỉ Là Một Buổi Tiệc. <br />
                <span className="text-csg-red">Là Nơi Trở Về.</span>
              </h2>
              <p className="text-csg-black/80 font-sans text-base leading-relaxed">
                17 năm thành lập CLB Truyền thông Cóc Sài Gòn (2009 - 2026) đánh dấu hành trình của hàng trăm bạn trẻ mang trong mình ngọn lửa truyền thông, nhiếp ảnh, thiết kế và tổ chức sự kiện.
              </p>
              <p className="text-csg-black/80 font-sans text-base leading-relaxed">
                Đêm tiệc sinh nhật 17 tuổi là khoảnh khắc đặc biệt để những người anh, người chị đã ra trường cùng các bạn thành viên thế hệ mới hội ngộ, hàn huyên và nâng ly vì một thanh xuân rực rỡ sắc vàng.
              </p>

              {/* Secret Pricing Banner */}
              <div className="p-4 rounded-xl bg-csg-yellow/20 border-2 border-csg-black space-y-1">
                <span className="text-xs font-mono font-bold text-csg-black uppercase block">
                  ✨ Cơ chế tài chính công bằng & đồng hành:
                </span>
                <p className="text-xs text-csg-black/80 font-sans">
                  Hệ thống hỗ trợ <strong>đặt cọc trước (100k / 150k)</strong> để giữ chỗ và đóng nốt số dư trước ngày sự kiện. Vé QR check-in VIP tự động cấp khi hoàn tất 100%.
                </p>
              </div>
            </div>

            {/* Right Column: Metadata & Schedule Flow */}
            <div className="lg:col-span-7 space-y-6">
              {/* Event Specification Box */}
              <div className="p-6 sm:p-8 rounded-2xl bg-csg-surface border-2 border-csg-black shadow-paper-md space-y-6">
                <h3 className="text-xl font-display font-black uppercase text-csg-black border-b border-csg-black/15 pb-3">
                  Thông Tin Chi Tiết Buổi Tiệc
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                  <div className="space-y-1">
                    <span className="text-xs font-mono text-csg-black/60 uppercase block">Thời Gian</span>
                    <div className="flex items-center gap-2 font-bold text-csg-black">
                      <Clock className="w-4 h-4 text-csg-red" />
                      <span>18:00 - 22:00 • Thứ Bảy, 15/12/2026</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-mono text-csg-black/60 uppercase block">Địa Điểm Tổ Chức</span>
                    <div className="flex items-center gap-2 font-bold text-csg-black">
                      <MapPin className="w-4 h-4 text-csg-red" />
                      <span>Asiana Plaza Tân Phú, TP. HCM</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-mono text-csg-black/60 uppercase block">Trang Phục (Dress Code)</span>
                    <div className="flex items-center gap-2 font-bold text-csg-black">
                      <Shirt className="w-4 h-4 text-csg-red" />
                      <span>Sắc Áo Vàng hoặc Vàng - Đen - Trắng</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-mono text-csg-black/60 uppercase block">Quy Mô & Số Lượng</span>
                    <div className="flex items-center gap-2 font-bold text-csg-black">
                      <Users className="w-4 h-4 text-csg-red" />
                      <span>Giới hạn 200 ghế cho toàn bộ thế hệ</span>
                    </div>
                  </div>
                </div>

                {/* Timeline flow */}
                <div className="pt-4 border-t border-csg-black/15 space-y-3">
                  <span className="text-xs font-mono text-csg-black/60 uppercase block">Lịch Trình Đêm Tiệc</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-2.5 rounded-lg bg-csg-paper border border-csg-black/20">
                      <span className="text-csg-red font-bold">18:00 - 18:45</span>
                      <p className="font-bold text-csg-black font-sans mt-0.5">Check-in thảm đỏ & Chụp ảnh Polaroid</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-csg-paper border border-csg-black/20">
                      <span className="text-csg-red font-bold">18:45 - 19:30</span>
                      <p className="font-bold text-csg-black font-sans mt-0.5">Khai mạc, Video 17Y & Thổi nến sinh nhật</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-csg-paper border border-csg-black/20">
                      <span className="text-csg-red font-bold">19:30 - 20:30</span>
                      <p className="font-bold text-csg-black font-sans mt-0.5">Khai tiệc Gala Dinner & Giao lưu kết nối</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-csg-paper border border-csg-black/20">
                      <span className="text-csg-red font-bold">20:30 - 22:00</span>
                      <p className="font-bold text-csg-black font-sans mt-0.5">Sân khấu âm nhạc bùng nổ & Lucky Draw</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= SCENE 01: MEMORY WALL ================= */}
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
              <h2 className="text-3xl sm:text-5xl font-display font-black uppercase text-csg-black tracking-tight">
                Lời Chúc Mừng 17Y
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(wishesList.length > 0 ? wishesList.slice(0, 3) : [
              {
                id: 'w-1',
                authorName: 'Anh Huỳnh Tấn Phát',
                role: 'ALUMNI',
                content: 'Chúc Cóc Sài Gòn mãi là ngôi nhà ấm áp của bao thế hệ! 💛'
              },
              {
                id: 'w-2',
                authorName: 'Bạn Nguyễn Phúc An',
                role: 'ACTIVE',
                content: 'Đêm nay Cóc cháy hết mình nha anh em ơi! 🔥'
              },
              {
                id: 'w-3',
                authorName: 'Chị Trần Thảo My',
                role: 'ALUMNI',
                content: 'Hẹn gặp lại các em tại đêm tiệc 17Y hoành tráng! ✨'
              }
            ]).map((w) => (
              <div key={w.id} className="p-6 rounded-2xl bg-csg-surface border-2 border-csg-black shadow-paper-sm relative flex flex-col justify-between">
                <Quote className="w-8 h-8 text-csg-yellow/60 absolute top-4 right-4" />
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="stamp-seal text-[9px]">
                      {w.role === 'ALUMNI' ? 'CỰU THÀNH VIÊN' : 'THÀNH VIÊN'}
                    </span>
                  </div>
                  <p className="font-serif italic text-base text-csg-black leading-relaxed">
                    "{w.content}"
                  </p>
                </div>
                <div className="pt-3 border-t border-csg-muted flex items-center justify-between">
                  <span className="font-display font-black text-sm text-csg-black">
                    {w.authorName}
                  </span>
                  <span className="text-[10px] font-mono text-csg-black/60">
                    Cóc 17Y
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

        {/* ================= SECTION 4.6: REGISTRATION CTA BANNER ================= */}
        <section className="py-20 px-4 sm:px-6 bg-csg-yellow border-t-2 border-b-2 border-csg-black">
          <div className="max-w-5xl mx-auto text-center space-y-6">
            <span className="inline-block px-3.5 py-1 rounded-full bg-csg-black text-csg-yellow text-xs font-mono font-bold uppercase tracking-widest shadow-sm">
              MÙA TIỆC KỶ NIỆM 17 NĂM
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-display font-black uppercase text-csg-black tracking-tight leading-none">
              BẠN LÀ MỘT PHẦN CỦA CÂU CHUYỆN NÀY. <br />
              GIỜ LÀ LÚC CÙNG NHAU VIẾT TIẾP MÙA 17.
            </h2>
            <p className="max-w-2xl mx-auto text-csg-black/90 font-sans text-sm sm:text-base leading-relaxed">
              Dù bạn thuộc Gen 1 hay Gen 16, dù đã rời trường nhiều năm hay đang ngày ngày tác nghiệp, chiếc áo vàng và những người bạn cũ vẫn luôn đợi bạn trở về.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={openRegister}
                className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-csg-black text-csg-yellow hover:bg-csg-black/90 font-display font-black text-lg sm:text-xl uppercase tracking-wider shadow-paper-lg transition-all flex items-center justify-center gap-3"
              >
                <span>ĐĂNG KÝ THAM GIA TIỆC NGAY ↗</span>
              </button>
              <button
                onClick={openLookup}
                className="w-full sm:w-auto px-7 py-5 rounded-2xl bg-csg-paper hover:bg-csg-surface text-csg-black font-bold text-sm sm:text-base border-2 border-csg-black transition-all flex items-center justify-center gap-2 shadow-paper-sm"
              >
                <Search className="w-4 h-4 text-csg-red" />
                <span>Tra cứu vé & số dư đã cọc</span>
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
              <span className="font-display font-black uppercase tracking-wider text-csg-black block text-sm">
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
              className="px-4 py-2 rounded-xl bg-csg-paper hover:bg-csg-muted text-csg-black text-xs font-bold border-2 border-csg-black transition-colors flex items-center gap-1.5 mx-auto md:mx-0 shadow-paper-sm"
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
