import React, { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AudioPlayerToggle } from './components/AudioPlayerToggle';
import { CinematicFilmOpening } from './components/CinematicFilmOpening';
import { PhotobookFlow } from './components/PhotobookFlow';
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
  // Cinematic Film Opening intro state
  const [showCinematicIntro, setShowCinematicIntro] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return false;
    }
    const path = window.location.pathname;
    if (path === '/register' || path === '/portal' || path === '/admin' || window.location.hash) {
      return false;
    }
    return true;
  });

  // Modal states
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isLookupOpen, setIsLookupOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Registrations state
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>(INITIAL_REGISTRATIONS);

  // Optional Wish state
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
  const handleWishSubmit = async (author: string, content: string) => {
    try {
      await apiClient.submitWish({
        authorName: author || 'Người bạn Cóc Sài Gòn',
        role: 'ACTIVE',
        content,
        isPublic: true
      });
      setWishSubmitted(true);
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
      
      {/* Cinematic 35mm Analog Film Opening */}
      {showCinematicIntro && (
        <CinematicFilmOpening onComplete={() => setShowCinematicIntro(false)} />
      )}

      {/* Floating Audio Controller */}
      <AudioPlayerToggle />

      {/* ================= EDITORIAL ART-BOOK MASTHEAD ================= */}
      <header className="sticky top-0 z-40 bg-csg-paper/95 backdrop-blur-md border-b border-csg-black/20">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-8 h-14 flex items-center justify-between">
          {/* Identity */}
          <a href="/" onClick={(e) => { e.preventDefault(); closeModals(); }} className="flex items-baseline gap-2 group">
            <span className="font-display font-extrabold text-base tracking-tight text-csg-black uppercase">
              CÓC SÀI GÒN <span className="font-editorial italic font-normal text-csg-red lowercase text-lg">17 năm</span>
            </span>
            <span className="hidden sm:inline font-mono text-[10px] text-csg-black/40 uppercase tracking-widest pl-2">
              Photobook // 2009 — 2026
            </span>
          </a>

          {/* Minimal Quick Actions */}
          <nav className="flex items-center gap-5 sm:gap-7 font-mono text-xs uppercase tracking-wider text-csg-black/80 font-medium">
            <button
              onClick={() => setShowCinematicIntro(true)}
              className="hover:text-csg-red transition-colors hidden sm:inline"
              title="Xem lại thước phim cuộn 35mm"
            >
              THƯỚC PHIM 17Y
            </button>
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
              <span>ĐĂNG KÝ VÉ ↗</span>
            </button>
          </nav>
        </div>
      </header>

      {/* ================= CONTINUOUS PHOTOBOOK JOURNEY ================= */}
      <main className="relative z-10 flex-1 max-w-[1360px] mx-auto px-4 sm:px-8 w-full py-6 sm:py-10">
        <PhotobookFlow
          onOpenRegister={openRegister}
          onOpenLookup={openLookup}
          onWishSubmit={handleWishSubmit}
          wishSubmitted={wishSubmitted}
        />
      </main>

      {/* ================= QUIET COLOPHON FOOTER ================= */}
      <footer className="relative z-10 bg-csg-surface border-t border-csg-black/25 py-6 px-4 sm:px-8 mt-12">
        <div className="max-w-[1360px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs text-csg-black/65 text-center sm:text-left">
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
