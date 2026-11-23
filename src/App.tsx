import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { FrogIcon, ArrowUpRightIcon } from 'naive-icons';
import { AudioPlayerToggle } from './components/AudioPlayerToggle';
import { CinematicFilmOpening } from './components/CinematicFilmOpening';
import { PhotobookFlow } from './components/PhotobookFlow';
import { CelebrationStage } from './components/CelebrationStage';
import { RegistrationModal } from './components/RegistrationModal';
import { PaymentLookupModal } from './components/PaymentLookupModal';
import { AdminDashboard } from './components/AdminDashboard';
import { RegistrationRecord, MascotFrog } from './types';
import { apiClient } from './services/apiClient';
import { audioService } from './services/audioService';

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
  const [isStageOpen, setIsStageOpen] = useState(false);

  // Registrations state - strictly loaded from database
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([]);

  // Mascots crowd on Celebration Stage - strictly loaded from database
  const [stageCharacters, setStageCharacters] = useState<MascotFrog[]>([]);

  // Fetch live stage characters and registrations on initial load directly from real database
  useEffect(() => {
    let isMounted = true;
    const loadRealData = async () => {
      try {
        const [chars, adminData] = await Promise.allSettled([
          apiClient.getStageCharacters(),
          apiClient.getAdminRegistrations()
        ]);
        if (isMounted) {
          if (chars.status === 'fulfilled' && chars.value && chars.value.length > 0) {
            setStageCharacters(chars.value);
          }
          if (adminData.status === 'fulfilled' && adminData.value && adminData.value.data) {
            setRegistrations(adminData.value.data);
          }
        }
      } catch (err) {
        console.warn('Failed to load live database data:', err);
      }
    };

    loadRealData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Optional Wish state
  const [wishSubmitted, setWishSubmitted] = useState(false);

  // URL-based routing handlers
  const openStage = () => {
    audioService.stop();
    setIsStageOpen(true);
    setIsRegisterOpen(false);
    setIsLookupOpen(false);
    setIsAdminOpen(false);
  };

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
    setIsStageOpen(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  };

  // Disable browser scroll restoration so page always starts fresh from the beginning
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    // Continuous background music autoplay throughout website
    audioService.initAutoPlay();
  }, []);

  // Sync initial URL on mount, handle Back/Forward navigation, Hash and Admin shortcuts
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();

      const isAdmin = path.startsWith('/admin') || hash === '#admin' || search.includes('admin');

      if (path.startsWith('/register') || hash === '#register') {
        setIsRegisterOpen(true);
        setIsLookupOpen(false);
        setIsAdminOpen(false);
        setIsStageOpen(false);
      } else if (path.startsWith('/portal') || hash === '#portal') {
        setIsLookupOpen(true);
        setIsRegisterOpen(false);
        setIsAdminOpen(false);
        setIsStageOpen(false);
      } else if (isAdmin) {
        setIsAdminOpen(true);
        setIsRegisterOpen(false);
        setIsLookupOpen(false);
        setIsStageOpen(false);
      } else if (path.startsWith('/stage') || hash === '#stage') {
        audioService.stop();
        setIsStageOpen(true);
        setIsRegisterOpen(false);
        setIsLookupOpen(false);
        setIsAdminOpen(false);
      } else {
        setIsRegisterOpen(false);
        setIsLookupOpen(false);
        setIsAdminOpen(false);
        setIsStageOpen(false);
      }
    };

    // Secret Admin keyboard shortcut: Ctrl+Shift+A (or Cmd+Shift+A)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        openAdmin();
      }
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Handle new registration completed
  const handleRegistrationComplete = (newRecord: RegistrationRecord) => {
    setRegistrations(prev => [newRecord, ...prev]);

    // Add newly registered frog to the stage characters
    const newFrog: MascotFrog = {
      id: `frog-${newRecord.id || Date.now()}`,
      name: newRecord.fullName,
      role: newRecord.role,
      wish: newRecord.wishes?.trim() || 'Mừng sinh nhật 17 năm Cóc Sài Gòn rực rỡ!',
      x: 50,
      y: 74,
      scale: 1.25,
      direction: 1
    };
    setStageCharacters(prev => [newFrog, ...prev.filter(c => c.id !== newFrog.id)]);

    // Trigger celebration chime & confetti
    audioService.playCelebrationChime();
    confetti({
      particleCount: 100,
      spread: 90,
      origin: { y: 0.5 },
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
      // Immediately refresh stage characters so the new wish appears on stage
      const refreshed = await apiClient.getStageCharacters();
      if (refreshed && refreshed.length > 0) {
        setStageCharacters(refreshed);
      }
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
        <CinematicFilmOpening 
          onComplete={() => {
            setShowCinematicIntro(false);
            if (typeof window !== 'undefined') {
              window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            }
          }} 
        />
      )}

      {/* Floating Audio Controller */}
      <AudioPlayerToggle />

      {/* ================= EDITORIAL ART-BOOK MASTHEAD ================= */}
      <header className="sticky top-0 z-40 bg-csg-paper/95 backdrop-blur-md border-b border-csg-black/20 pt-[env(safe-area-inset-top)]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-8 h-14 sm:h-16 flex items-center justify-between">
          {/* Identity */}
          <a href="/" onClick={(e) => { e.preventDefault(); closeModals(); }} className="flex items-baseline gap-2 group min-h-[44px] items-center shrink-0">
            <span className="font-display font-extrabold text-base tracking-tight text-csg-black uppercase whitespace-nowrap">
              CÓC SÀI GÒN <span className="font-editorial italic font-normal text-csg-red lowercase text-lg">17 năm</span>
            </span>
            <span className="hidden md:inline font-mono text-[10px] text-csg-black/40 uppercase tracking-widest pl-2">
              Photobook // 2009 — 2026
            </span>
          </a>

          {/* Minimal Quick Actions */}
          <nav className="flex items-center gap-1.5 sm:gap-6 font-mono text-xs uppercase tracking-wider text-csg-black/80 font-medium shrink-0">
            <button
              onClick={openStage}
              className="hover:text-csg-red transition-colors font-bold px-2 py-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center gap-1.5 active:scale-95 text-xs rounded-sm"
              title="Xem sân khấu kỷ niệm 17Y"
            >
              <FrogIcon size={16} className="shrink-0 text-[#B94D35]" />
              <span className="hidden sm:inline">SÂN KHẤU CÓC</span>
              <span className="px-1.5 py-0.2 rounded-full bg-csg-yellow text-csg-black font-mono text-[10px] font-bold shadow-xs">
                {stageCharacters.length}
              </span>
            </button>
            <button
              onClick={() => setShowCinematicIntro(true)}
              className="hover:text-csg-red transition-colors hidden md:inline min-h-[44px] flex items-center"
              title="Xem lại thước phim cuộn 35mm"
            >
              THƯỚC PHIM 17Y
            </button>
            <button
              onClick={openRegister}
              className="btn-editorial-primary px-3 sm:px-3.5 py-2 sm:py-1.5 font-display font-bold text-xs uppercase flex items-center gap-1 shadow-sm min-h-[44px] active:scale-95 whitespace-nowrap"
            >
              <span>ĐĂNG KÝ <span className="hidden sm:inline">THAM GIA</span></span>
              <ArrowUpRightIcon size={14} className="shrink-0" />
            </button>
          </nav>
        </div>
      </header>

      {/* ================= CONTINUOUS PHOTOBOOK JOURNEY (ẢNH & FORM) ================= */}
      <main className="relative z-10 flex-1 max-w-[1360px] mx-auto px-4 sm:px-8 w-full py-6 sm:py-10">
        <PhotobookFlow
          onOpenRegister={openRegister}
          onOpenLookup={openLookup}
          onOpenStage={() => setIsStageOpen(true)}
          totalWishesCount={stageCharacters.length}
          onWishSubmit={handleWishSubmit}
          wishSubmitted={wishSubmitted}
        />
      </main>

      {/* ================= QUIET COLOPHON FOOTER ================= */}
      <footer className="relative z-10 bg-csg-surface border-t border-csg-black/25 pt-6 pb-24 sm:pb-8 px-4 sm:px-8 mt-12">
        <div className="max-w-[1360px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs text-csg-black/65 text-center sm:text-left leading-relaxed">
          <span>CLB TRUYỀN THÔNG CÓC SÀI GÒN • 2009 — 2026 • ĐẠI TIỆC GALA 17Y TẠI ĐỒI SỨ VILLA</span>
        </div>
      </footer>

      {/* ================= MOBILE STICKY CTA PILL ================= */}
      {!isRegisterOpen && !isStageOpen && !isLookupOpen && !isAdminOpen && !showCinematicIntro && (
        <div className="sm:hidden fixed bottom-4 right-4 z-40 animate-fadeIn pb-[env(safe-area-inset-bottom)]">
          <button
            onClick={openRegister}
            className="btn-editorial-primary px-4 py-3 font-display font-extrabold text-xs uppercase shadow-poster flex items-center gap-1.5 min-h-[48px] active:scale-95"
            aria-label="Đăng ký tham gia 17Y"
          >
            <span>ĐĂNG KÝ 17Y</span>
            <ArrowUpRightIcon size={14} className="shrink-0" />
          </button>
        </div>
      )}

      {/* ================= FUNCTIONAL MODALS ================= */}
      {isRegisterOpen && (
        <RegistrationModal
          isOpen={isRegisterOpen}
          onClose={closeModals}
          onRegistrationComplete={handleRegistrationComplete}
          onOpenPortal={openLookup}
          stageCharacters={stageCharacters}
        />
      )}

      {isStageOpen && (
        <CelebrationStage
          isModal={true}
          characters={stageCharacters}
          onClose={() => setIsStageOpen(false)}
          onOpenRegister={openRegister}
          onOpenPortal={openLookup}
        />
      )}

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
