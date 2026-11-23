import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  SparklesIcon, SearchIcon, Volume2Icon, VolumeXIcon, PartyIcon, 
  CloseIcon, BulbIcon, FrogIcon, GraduationCapIcon, BoltIcon, HeartIcon,
  BookOpenIcon, ArrowRightIcon
} from 'naive-icons';
import confetti from 'canvas-confetti';
import { MascotFrog, MemberRole, RegistrationRecord } from '../types';
import { audioService } from '../services/audioService';
import { apiClient } from '../services/apiClient';

export interface CelebrationStageProps {
  characters: MascotFrog[];
  onOpenRegister?: () => void;
  isModal?: boolean;
  onClose?: () => void;
  newRegistrant?: RegistrationRecord | null;
  onOpenPortal?: () => void;
  hideBanner?: boolean;
}

interface FrogMotionState {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  dir: number;
  speed: number;
  scale: number;
  isHopping: boolean;
  isCelebrating: boolean;
  celebrateTicks: number;
  idleTicks: number;
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
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [stageLightsOn, setStageLightsOn] = useState(true);

  // Tắt toàn bộ nhạc nền khi bước vào sân khấu
  useEffect(() => {
    audioService.stop();
  }, []);

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

  const [isWishDrawerOpen, setIsWishDrawerOpen] = useState(false);
  const [internalCharacters, setInternalCharacters] = useState<MascotFrog[]>(characters);

  // Mobile screen responsiveness & performance optimization
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 640;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Pause physics loop when browser tab is inactive to preserve mobile battery
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        canRoamRef.current = false;
      } else {
        canRoamRef.current = true;
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Keep internal list in sync when parent passes new characters
  useEffect(() => {
    if (characters && characters.length > 0) {
      setInternalCharacters(characters);
    }
  }, [characters]);

  // Proactively fetch live characters & wishes on mount to ensure all DB wishes appear
  useEffect(() => {
    let isMounted = true;
    const syncFreshCharacters = async () => {
      try {
        const fresh = await apiClient.getStageCharacters();
        if (isMounted && fresh && fresh.length > 0) {
          setInternalCharacters(fresh);
        }
      } catch (err) {
        console.warn('CelebrationStage sync error:', err);
      }
    };
    syncFreshCharacters();
    return () => {
      isMounted = false;
    };
  }, []);

  // Combine external characters with newRegistrant if provided
  const allCharacters = useMemo(() => {
    const baseList = internalCharacters.length > 0 ? internalCharacters : characters;
    if (!newRegistrant) return baseList;
    const existing = baseList.some(
      c => c.id === `frog-${newRegistrant.id}` || c.name.toLowerCase().includes(newRegistrant.fullName.toLowerCase())
    );
    if (existing) return baseList;

    const myFrog: MascotFrog = {
      id: `frog-${newRegistrant.id}`,
      name: newRegistrant.fullName,
      role: newRegistrant.role,
      wish: newRegistrant.wishes?.trim() || 'Mừng sinh nhật 17 năm Cóc Sài Gòn rực rỡ và bùng cháy!',
      x: 50,
      y: 72,
      scale: 1.2,
      direction: 1
    };
    return [myFrog, ...baseList];
  }, [internalCharacters, characters, newRegistrant]);

  // Positions and lively stage roaming state
  const [positions, setPositions] = useState<{ [id: string]: FrogMotionState }>({});
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);

  // Initial stillness: Frogs do NOT move immediately on entering stage
  const canRoamRef = useRef(false);

  useEffect(() => {
    // Keep frogs standing in place for initial 3.5s before active roaming begins
    canRoamRef.current = false;
    const timer = setTimeout(() => {
      canRoamRef.current = true;
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  // Daily Heart Quota System: 12 hearts per day per user ("1 ngày 12 thôi")
  // Realtime multi-tap claps with optimistic UI + persistent Supabase sync
  const MAX_DAILY_HEARTS = 12;

  const getTodayString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const getStoredDailyHeartsUsed = (): number => {
    try {
      const raw = localStorage.getItem('csg_daily_hearts');
      if (!raw) return 0;
      const parsed = JSON.parse(raw);
      if (parsed.date === getTodayString()) {
        return typeof parsed.used === 'number' ? parsed.used : 0;
      }
    } catch {}
    return 0;
  };

  const storeDailyHeartsUsed = (used: number) => {
    try {
      localStorage.setItem('csg_daily_hearts', JSON.stringify({
        date: getTodayString(),
        used
      }));
    } catch {}
  };

  const getInitialHearts = useCallback((id: string, name: string): number => {
    let hash = 0;
    const str = id + name;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return 10 + (Math.abs(hash) % 15);
  }, []);

  const [heartsCount, setHeartsCount] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('csg_wishes_hearts');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  const [dailyHeartsRemaining, setDailyHeartsRemaining] = useState<number>(() => {
    return Math.max(0, MAX_DAILY_HEARTS - getStoredDailyHeartsUsed());
  });

  const [userHeartedWishIds, setUserHeartedWishIds] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('csg_user_hearted_ids');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  const [quotaToast, setQuotaToast] = useState<string | null>(null);

  // Sync initial hearts from real Supabase DB data when allCharacters loads
  useEffect(() => {
    if (allCharacters.length > 0) {
      setHeartsCount(prev => {
        const next = { ...prev };
        let hasChanges = false;
        allCharacters.forEach(c => {
          if (typeof c.hearts === 'number' && c.hearts > 0 && next[c.id] === undefined) {
            next[c.id] = c.hearts;
            hasChanges = true;
          }
        });
        return hasChanges ? next : prev;
      });
    }
  }, [allCharacters]);

  const handleToggleHeart = useCallback((targetId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    if (dailyHeartsRemaining <= 0) {
      setQuotaToast('Hôm nay bạn đã dùng hết 12 lượt tim rồi! Hãy quay lại vào ngày mai nhé 🐸');
      setTimeout(() => setQuotaToast(null), 3500);
      return;
    }

    // 1. Deduct 1 from daily quota
    const newRemaining = dailyHeartsRemaining - 1;
    setDailyHeartsRemaining(newRemaining);
    storeDailyHeartsUsed(MAX_DAILY_HEARTS - newRemaining);

    // 2. Play tactile audio chime
    if (soundEnabled) {
      audioService.playCelebrationChime();
    }

    // 3. Optimistic heart count increment
    setUserHeartedWishIds(prev => {
      const next = { ...prev, [targetId]: true };
      try {
        localStorage.setItem('csg_user_hearted_ids', JSON.stringify(next));
      } catch {}
      return next;
    });

    setHeartsCount(prev => {
      const next = { ...prev };
      const current = next[targetId] !== undefined
        ? next[targetId]
        : (allCharacters.find(c => c.id === targetId)?.hearts || getInitialHearts(targetId, targetId));
      next[targetId] = current + 1;
      try {
        localStorage.setItem('csg_wishes_hearts', JSON.stringify(next));
      } catch {}
      return next;
    });

    // 4. Frog jumps with joy on stage
    setPositions(posPrev => {
      if (!posPrev[targetId]) return posPrev;
      return {
        ...posPrev,
        [targetId]: {
          ...posPrev[targetId],
          isCelebrating: true,
          celebrateTicks: 30
        }
      };
    });

    // 5. Confetti hearts burst
    const originX = e ? e.clientX / window.innerWidth : 0.5;
    const originY = e ? e.clientY / window.innerHeight : 0.65;
    confetti({
      particleCount: 22,
      spread: 45,
      origin: { x: originX, y: originY },
      colors: ['#F43F5E', '#FB7185', '#F4C542', '#FDA4AF']
    });

    // 6. Direct sync to Supabase database (realtime cloud persistence)
    apiClient.incrementWishHearts(targetId, 1).then((newServerCount: number | null) => {
      if (typeof newServerCount === 'number') {
        setHeartsCount(prev => ({
          ...prev,
          [targetId]: newServerCount
        }));
      }
    });
  }, [dailyHeartsRemaining, soundEnabled, allCharacters, getInitialHearts]);

  // Find the wish with the most hearts (Top 1)
  const topHeartedId = useMemo(() => {
    if (allCharacters.length === 0) return null;
    let topId = allCharacters[0]?.id || '';
    let maxCount = -1;

    allCharacters.forEach(c => {
      const count = heartsCount[c.id] !== undefined 
        ? heartsCount[c.id] 
        : (typeof c.hearts === 'number' && c.hearts > 0 ? c.hearts : getInitialHearts(c.id, c.name));
      if (count > maxCount) {
        maxCount = count;
        topId = c.id;
      }
    });

    return maxCount > 0 ? topId : null;
  }, [allCharacters, heartsCount, getInitialHearts]);

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

  // Strictly ONE speech bubble active at a time - starts with a RANDOM frog jumping for 7 seconds
  useEffect(() => {
    if (allCharacters.length === 0) return;

    const userFrog = newRegistrant 
      ? allCharacters.find(c => c.id === `frog-${newRegistrant.id}` || c.name.includes(newRegistrant.fullName)) 
      : null;

    // If newly registered, spotlight user's frog; otherwise pick a RANDOM frog mascot!
    let initialIndex = 0;
    if (userFrog) {
      initialIndex = allCharacters.indexOf(userFrog);
    } else {
      initialIndex = Math.floor(Math.random() * allCharacters.length);
    }
    const initialSpeaker = allCharacters[initialIndex] || allCharacters[0];
    const initialId = initialSpeaker?.id || null;

    setActiveSpeakerId(initialId);

    // Make this random frog jump up with its wish!
    if (initialId) {
      setPositions(prev => {
        if (!prev[initialId]) return prev;
        return {
          ...prev,
          [initialId]: {
            ...prev[initialId],
            isCelebrating: true,
            celebrateTicks: 45 // jump celebration
          }
        };
      });
    }

    let currentIndex = initialIndex;
    let intervalId: NodeJS.Timeout | null = null;

    // Show this random frog's wish for exactly 7 seconds (7000ms)
    const initialTimer = setTimeout(() => {
      // After 7 seconds, rotate through subsequent frogs every 5 seconds
      intervalId = setInterval(() => {
        currentIndex = (currentIndex + 1) % allCharacters.length;
        setActiveSpeakerId(allCharacters[currentIndex]?.id || null);
      }, 5000);
    }, 7000);

    return () => {
      clearTimeout(initialTimer);
      if (intervalId) clearInterval(intervalId);
    };
  }, [allCharacters, newRegistrant]);

  // Initialize and distribute frog positions along the stage floor
  useEffect(() => {
    if (allCharacters.length === 0) return;

    setPositions(prev => {
      const next: { [id: string]: FrogMotionState } = { ...prev };
      const count = allCharacters.length;

      allCharacters.forEach((c, idx) => {
        // If already tracking this frog, keep its current dynamic motion state
        if (next[c.id]) return;

        // Distribute nicely along stage floor (12% to 88% width, 66% to 78% depth)
        const stepX = count > 1 ? 76 / (count - 1) : 0;
        const initialX = count > 1 ? 12 + idx * stepX : 50;
        const initialY = 66 + (idx % 3) * 6; // 66%, 72%, 78%
        const initialDir = idx % 2 === 0 ? 1 : -1;
        const speed = 0.20 + (idx % 4) * 0.04;
        const scale = 0.88 + ((initialY - 64) / 18) * 0.26;

        next[c.id] = {
          x: initialX,
          y: initialY,
          targetX: initialX,
          targetY: initialY,
          dir: initialDir,
          speed: 0.36 + (idx % 4) * 0.05,
          scale,
          isHopping: false,
          isCelebrating: false,
          celebrateTicks: 0,
          idleTicks: 6 + Math.floor(Math.random() * 25) // staggered initial pause
        };
      });

      return next;
    });

    if (newRegistrant) {
      triggerConfettiBlast();
    }
  }, [allCharacters, newRegistrant]);

  // Lively roaming & hopping engine across the stage floor
  useEffect(() => {
    if (allCharacters.length === 0) return;

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;

      setPositions(prev => {
        const next: { [id: string]: FrogMotionState } = { ...prev };
        let hasChanges = false;

        // Limit concurrent hops to preserve battery and 60fps on mobile
        let currentHoppingCount = 0;
        Object.keys(next).forEach(k => {
          if (next[k]?.isHopping) currentHoppingCount++;
        });
        const maxConcurrentHops = isMobile ? 2 : 4;

        Object.keys(next).forEach(id => {
          const frog = next[id];
          if (!frog) return;

          let {
            x,
            y,
            targetX,
            targetY,
            dir,
            speed,
            scale,
            isHopping,
            isCelebrating,
            celebrateTicks,
            idleTicks
          } = frog;

          if (isCelebrating) {
            celebrateTicks -= 1;
            if (celebrateTicks <= 0) {
              isCelebrating = false;
            }
            hasChanges = true;
          }

          if (isHopping) {
            const distX = Math.abs(targetX - x);
            const distY = Math.abs(targetY - y);

            if (distX < 0.6 && distY < 0.6) {
              // Arrived at destination! Settle into IDLE
              x = targetX;
              y = targetY;
              isHopping = false;
              // Rest for 1.5s - 3.8s (25 to 65 ticks)
              idleTicks = 25 + Math.floor(Math.random() * 40);
              // 40% chance to flip direction to look around while resting
              if (Math.random() < 0.4) {
                dir = -dir;
              }
            } else {
              // Advance horizontally
              const stepX = Math.min(speed, distX);
              x += dir * stepX;

              // Advance vertically towards target lane
              const distToY = targetY - y;
              const stepY = Math.sign(distToY) * Math.min(0.22, Math.abs(distToY));
              y += stepY;

              // Dynamically adjust scale based on depth perspective
              scale = 0.88 + Math.max(0, Math.min(1, (y - 64) / 18)) * 0.28;
            }
            hasChanges = true;
          } else {
            // Idle state countdown: wait for canRoamRef to allow free roaming
            if (!canRoamRef.current) {
              return;
            }
            idleTicks -= 1;
            if (idleTicks <= 0) {
              // Throttle: don't start new hop if max frogs are already in motion
              if (currentHoppingCount >= maxConcurrentHops) {
                idleTicks = 12 + Math.floor(Math.random() * 20);
                return;
              }

              // Pick a new destination spot on stage to hop toward
              const travelDistance = 10 + Math.random() * 18;
              let newDir = dir;

              if (x < 18) {
                newDir = 1;
              } else if (x > 82) {
                newDir = -1;
              } else {
                newDir = Math.random() > 0.5 ? 1 : -1;
              }

              let nextX = x + newDir * travelDistance;
              nextX = Math.max(12, Math.min(88, nextX));

              // Collision avoidance: prevent clumping and overlapping name tags
              let candidateX = nextX;
              const isColliding = Object.entries(next).some(([otherId, otherFrog]) => {
                if (otherId === id) return false;
                return Math.abs(otherFrog.targetX - candidateX) < 8;
              });
              if (isColliding) {
                candidateX = candidateX > 50 ? Math.max(12, candidateX - 12) : Math.min(88, candidateX + 12);
              }

              // Snap to 3 clean depth tiers (66%, 72%, 78%) to maintain vertical hierarchy
              const nextY = 66 + (Math.floor(Math.random() * 3)) * 6;

              targetX = candidateX;
              targetY = nextY;
              dir = targetX >= x ? 1 : -1;
              speed = 0.36 + Math.random() * 0.18; // dynamic, energetic hop speed!
              isHopping = true;
              currentHoppingCount++;
              hasChanges = true;
            }
          }

          next[id] = {
            x,
            y,
            targetX,
            targetY,
            dir,
            speed,
            scale,
            isHopping,
            isCelebrating,
            celebrateTicks,
            idleTicks
          };
        });

        return hasChanges ? next : prev;
      });
    }, 60);

    return () => clearInterval(interval);
  }, [allCharacters]);

  // Filter characters for Stage Floor (Mobile-adaptive density)
  const filtered = useMemo(() => {
    const matched = allCharacters.filter(c => {
      const matchRole = selectedRole === 'ALL' || c.role === selectedRole;
      const matchSearch = 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.wish.toLowerCase().includes(searchTerm.toLowerCase());
      return matchRole && matchSearch;
    });

    // On mobile (< 640px) when not searching, show a comfortable group of 8 frogs
    // ensuring stage is spacious and 60fps fast, while guaranteeing Top 1, active speaker & user frog are included
    if (isMobile && matched.length > 8 && !searchTerm) {
      const stageSet: MascotFrog[] = [];
      const seen = new Set<string>();

      const addCandidate = (id?: string | null) => {
        if (!id || seen.has(id)) return;
        const candidate = matched.find(m => m.id === id);
        if (candidate) {
          stageSet.push(candidate);
          seen.add(id);
        }
      };

      if (newRegistrant) addCandidate(`frog-${newRegistrant.id}`);
      addCandidate(topHeartedId);
      addCandidate(activeSpeakerId);

      for (const item of matched) {
        if (stageSet.length >= 8) break;
        if (!seen.has(item.id)) {
          stageSet.push(item);
          seen.add(item.id);
        }
      }
      return stageSet;
    }

    return matched;
  }, [allCharacters, selectedRole, searchTerm, isMobile, topHeartedId, activeSpeakerId, newRegistrant]);

  const handleCharacterClick = (c: MascotFrog, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveCharacter(c);
    setActiveSpeakerId(c.id);

    // Trigger high celebration jump
    setPositions(prev => {
      if (!prev[c.id]) return prev;
      return {
        ...prev,
        [c.id]: {
          ...prev[c.id],
          isCelebrating: true,
          celebrateTicks: 14
        }
      };
    });

    triggerConfettiBlast(e);
  };

  // Main stage body
  const stageContent = (
    <div className="w-full h-full flex flex-col flex-1 overflow-hidden">
      {/* ========================================================================= */}
      {/* 1. DESKTOP & TABLET TOP BAR (Single sleek 3-column bar, sm:flex hidden)    */}
      {/* ========================================================================= */}
      <div className="hidden sm:flex w-full h-14 bg-[#14100C]/95 backdrop-blur-md border-b border-white/10 px-4 lg:px-6 items-center justify-between gap-3 shrink-0 z-40 select-none shadow-sm pt-[env(safe-area-inset-top)]">
        {/* Left: Brand Identity & Subdued Count */}
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="w-8 h-8 rounded-full bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
            <FrogIcon size={17} />
          </span>
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-display font-bold text-sm tracking-wide text-white uppercase whitespace-nowrap">
              SÂN KHẤU CÓC 17Y
            </span>
            <span className="text-[11px] font-mono text-white/45 hidden sm:inline">
              • {allCharacters.length} lời chúc
            </span>
          </div>
        </div>

        {/* Center: Clean Segmented Role Filter */}
        <div className="flex items-center bg-white/5 p-1 rounded-full border border-white/10 text-xs shrink-0 font-mono">
          <button
            type="button"
            onClick={() => setSelectedRole('ALL')}
            className={`px-3 py-1 rounded-full transition-all text-xs ${
              selectedRole === 'ALL'
                ? 'bg-amber-400 text-[#1C140D] font-bold shadow-xs'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Tất cả
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('ALUMNI')}
            className={`px-3 py-1 rounded-full transition-all text-xs ${
              selectedRole === 'ALUMNI'
                ? 'bg-amber-400 text-[#1C140D] font-bold shadow-xs'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Cựu TV
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('ACTIVE')}
            className={`px-3 py-1 rounded-full transition-all text-xs ${
              selectedRole === 'ACTIVE'
                ? 'bg-amber-400 text-[#1C140D] font-bold shadow-xs'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Thành viên
          </button>
        </div>

        {/* Right: Daily Hearts Quota + Sổ Lời Chúc + Utilities + Close */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Daily Hearts Quota Indicator Pill */}
          <div 
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-rose-950/70 border border-rose-500/40 text-rose-300 font-mono text-xs shadow-xs"
            title={`Hôm nay bạn còn ${dailyHeartsRemaining}/12 lượt thả tim • Mỗi ngày được thả tối đa 12 tim`}
          >
            <HeartIcon size={13} className="text-rose-400 fill-rose-400 animate-pulse shrink-0" />
            <span className="hidden lg:inline text-rose-200/80 font-sans text-[11px]">Hôm nay:</span>
            <span className="font-bold text-rose-300">{dailyHeartsRemaining}/12</span>
            <span className="hidden md:inline text-rose-300/80">tim</span>
          </div>

          {/* Sổ Lời Chúc Drawer Trigger */}
          <button
            type="button"
            onClick={() => setIsWishDrawerOpen(true)}
            className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white hover:text-amber-300 font-mono text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
            title="Mở toàn bộ sổ lời chúc"
          >
            <BookOpenIcon size={14} className="text-amber-400" />
            <span className="hidden sm:inline">Sổ lời chúc</span>
            <span className="text-[10px] text-amber-300 font-bold">({allCharacters.length})</span>
          </button>

          {/* Grouped Utilities */}
          <div className="flex items-center bg-white/5 rounded-full p-0.5 border border-white/10">
            <button
              type="button"
              onClick={() => triggerConfettiBlast()}
              className="p-1.5 rounded-full text-white/70 hover:text-amber-300 hover:bg-white/10 transition-colors"
              title="Bắn pháo hoa"
            >
              <PartyIcon size={14} />
            </button>
            <button
              type="button"
              onClick={() => setStageLightsOn(!stageLightsOn)}
              className={`p-1.5 rounded-full transition-colors ${
                stageLightsOn ? 'text-amber-400 hover:bg-white/10' : 'text-white/40 hover:bg-white/10'
              }`}
              title={stageLightsOn ? 'Tắt đèn sân khấu' : 'Bật đèn sân khấu'}
            >
              <BulbIcon size={14} />
            </button>
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-full text-white/70 hover:text-amber-300 hover:bg-white/10 transition-colors"
              title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
            >
              {soundEnabled ? <Volume2Icon size={14} className="text-amber-400" /> : <VolumeXIcon size={14} className="text-rose-400" />}
            </button>
          </div>

          {/* Exit Modal Button */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-rose-500 text-white/80 hover:text-white transition-colors flex items-center justify-center shrink-0 ml-1"
              title="Đóng sân khấu"
            >
              <CloseIcon size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MOBILE-OPTIMIZED TOP BAR (2-Tier, Zero Overflow at 375px, sm:hidden)    */}
      {/* ========================================================================= */}
      <div className="flex sm:hidden w-full bg-[#14100C]/95 backdrop-blur-md border-b border-white/10 px-3 py-1.5 flex-col gap-1.5 shrink-0 z-40 select-none shadow-sm pt-[env(safe-area-inset-top)]">
        {/* Tier 1: Brand + Daily Hearts + Sổ Lời Chúc + Close */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-7 h-7 rounded-full bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
              <FrogIcon size={15} />
            </span>
            <span className="font-display font-bold text-xs tracking-wide text-white uppercase whitespace-nowrap">
              SÂN KHẤU CÓC
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Daily Hearts Quota Pill */}
            <div 
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-950/70 border border-rose-500/40 text-rose-300 font-mono text-[10px] shadow-xs"
              title={`Hôm nay bạn còn ${dailyHeartsRemaining}/12 lượt thả tim`}
            >
              <HeartIcon size={11} className="text-rose-400 fill-rose-400 animate-pulse shrink-0" />
              <span className="font-bold text-rose-300">{dailyHeartsRemaining}/12</span>
            </div>

            {/* Sổ Lời Chúc Drawer Trigger */}
            <button
              type="button"
              onClick={() => setIsWishDrawerOpen(true)}
              className="px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white hover:text-amber-300 font-mono text-[10px] flex items-center gap-1 transition-all active:scale-95"
              title="Mở toàn bộ sổ lời chúc"
            >
              <BookOpenIcon size={12} className="text-amber-400 shrink-0" />
              <span className="text-amber-300 font-bold">({allCharacters.length})</span>
            </button>

            {/* Exit Modal Button */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-rose-500 text-white/80 hover:text-white transition-colors flex items-center justify-center shrink-0 ml-0.5 active:scale-90"
                title="Đóng sân khấu"
              >
                <CloseIcon size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Tier 2: Role Filters + Quick Stage Utilities */}
        <div className="flex items-center justify-between gap-1 pt-1 border-t border-white/5">
          <div className="flex items-center bg-white/5 p-0.5 rounded-full border border-white/10 font-mono">
            <button
              type="button"
              onClick={() => setSelectedRole('ALL')}
              className={`px-2.5 py-0.5 rounded-full transition-all text-[10px] ${
                selectedRole === 'ALL'
                  ? 'bg-amber-400 text-[#1C140D] font-bold shadow-xs'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('ALUMNI')}
              className={`px-2.5 py-0.5 rounded-full transition-all text-[10px] ${
                selectedRole === 'ALUMNI'
                  ? 'bg-amber-400 text-[#1C140D] font-bold shadow-xs'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Cựu TV
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('ACTIVE')}
              className={`px-2.5 py-0.5 rounded-full transition-all text-[10px] ${
                selectedRole === 'ACTIVE'
                  ? 'bg-amber-400 text-[#1C140D] font-bold shadow-xs'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Thành viên
            </button>
          </div>

          <div className="flex items-center bg-white/5 rounded-full p-0.5 border border-white/10">
            <button
              type="button"
              onClick={() => triggerConfettiBlast()}
              className="p-1 rounded-full text-white/70 hover:text-amber-300 hover:bg-white/10 transition-colors"
              title="Bắn pháo hoa"
            >
              <PartyIcon size={12} />
            </button>
            <button
              type="button"
              onClick={() => setStageLightsOn(!stageLightsOn)}
              className={`p-1 rounded-full transition-colors ${
                stageLightsOn ? 'text-amber-400 hover:bg-white/10' : 'text-white/40 hover:bg-white/10'
              }`}
              title={stageLightsOn ? 'Tắt đèn sân khấu' : 'Bật đèn sân khấu'}
            >
              <BulbIcon size={12} />
            </button>
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1 rounded-full text-white/70 hover:text-amber-300 hover:bg-white/10 transition-colors"
              title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
            >
              {soundEnabled ? <Volume2Icon size={12} className="text-amber-400" /> : <VolumeXIcon size={12} className="text-rose-400" />}
            </button>
          </div>
        </div>
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
        <div className="absolute top-[14%] sm:top-14 left-1/2 -translate-x-1/2 w-[72%] sm:w-[52%] md:w-[45%] max-w-[580px] aspect-[16/9] z-20 pointer-events-none">
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
        <div className="absolute -bottom-2 left-0 right-0 h-12 sm:h-20 pointer-events-none z-30 flex items-end justify-between px-1.5 sm:px-8">
          
          {/* Dãy ghế bên trái: đúng 5 ghế */}
          <div className="flex items-end gap-1 sm:gap-2.5 flex-1 justify-around">
            {[...Array(5)].map((_, i) => (
              <div key={`left-chair-${i}`} className="relative flex flex-col items-center flex-1 max-w-[32px] sm:max-w-[56px] h-11 sm:h-18 shadow-2xl">
                {/* Tay vịn bên hông ghế */}
                <div className="absolute -left-0.5 sm:-left-1 top-2 w-1 sm:w-1.5 h-7 sm:h-11 bg-[#1A1A1A] border-t-2 border-[#D97706] rounded-t-xs -z-10" />
                <div className="absolute -right-0.5 sm:-right-1 top-2 w-1 sm:w-1.5 h-7 sm:h-11 bg-[#1A1A1A] border-t-2 border-[#D97706] rounded-t-xs -z-10" />
                
                {/* Tựa lưng ghế màu xanh đặc trưng hội trường */}
                <div className="w-full h-full bg-[#1E3A8A] border sm:border-2 border-[#0F172A] rounded-t-lg sm:rounded-t-xl overflow-hidden flex flex-col justify-between shadow-md">
                  {/* Đệm tựa đầu màu đỏ nỉ - KHÔNG CÓ SỐ */}
                  <div className="w-full h-3 sm:h-5 bg-[#DC2626] border-b sm:border-b-2 border-[#991B1B] rounded-t-md sm:rounded-t-lg shadow-inner" />
                  {/* Vỏ ghế nhựa đen phía sau */}
                  <div className="w-full h-2 sm:h-3 bg-[#0F172A] opacity-60" />
                </div>
              </div>
            ))}
          </div>

          {/* Lối đi ở giữa hội trường (Center Aisle) */}
          <div className="w-5 sm:w-16 shrink-0 h-full flex items-center justify-center">
            <div className="w-full h-1 bg-[#8C6237]/35 rounded-full" />
          </div>

          {/* Dãy ghế bên phải: đúng 5 ghế */}
          <div className="flex items-end gap-1 sm:gap-2.5 flex-1 justify-around">
            {[...Array(5)].map((_, i) => (
              <div key={`right-chair-${i}`} className="relative flex flex-col items-center flex-1 max-w-[32px] sm:max-w-[56px] h-11 sm:h-18 shadow-2xl">
                {/* Tay vịn bên hông ghế */}
                <div className="absolute -left-0.5 sm:-left-1 top-2 w-1 sm:w-1.5 h-7 sm:h-11 bg-[#1A1A1A] border-t-2 border-[#D97706] rounded-t-xs -z-10" />
                <div className="absolute -right-0.5 sm:-right-1 top-2 w-1 sm:w-1.5 h-7 sm:h-11 bg-[#1A1A1A] border-t-2 border-[#D97706] rounded-t-xs -z-10" />
                
                {/* Tựa lưng ghế màu xanh đặc trưng hội trường */}
                <div className="w-full h-full bg-[#1E3A8A] border sm:border-2 border-[#0F172A] rounded-t-lg sm:rounded-t-xl overflow-hidden flex flex-col justify-between shadow-md">
                  {/* Đệm tựa đầu màu đỏ nỉ - KHÔNG CÓ SỐ */}
                  <div className="w-full h-3 sm:h-5 bg-[#DC2626] border-b sm:border-b-2 border-[#991B1B] rounded-t-md sm:rounded-t-lg shadow-inner" />
                  {/* Vỏ ghế nhựa đen phía sau */}
                  <div className="w-full h-2 sm:h-3 bg-[#0F172A] opacity-60" />
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Shared Mascot SVG Symbol Definition (Compiled once in GPU cache, reused by all frogs) */}
        <svg className="hidden pointer-events-none" aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0 }}>
          <defs>
            <g id="csg-frog-mascot-vector">
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
            </g>
          </defs>
        </svg>

        {/* Mascot Frogs On Stage */}
        {filtered.map((c) => {
          const pos = positions[c.id] || { x: c.x || 50, y: c.y || 75, dir: 1, scale: c.scale || 1 };
          const isUserFrog = newRegistrant && (c.id === `frog-${newRegistrant.id}` || c.name.includes(newRegistrant.fullName));
          const isHovered = hoveredId === c.id;

          // Strictly ONE speech bubble active at a time across the entire stage
          const currentSpeakerId = hoveredId || activeSpeakerId;
          const showBubble = c.id === currentSpeakerId;

          // Dynamic horizontal positioning to prevent bubble edge clipping
          const bubbleAlignClass = 
            pos.x < 35 
              ? 'left-[-20px] sm:left-[-30px]' 
              : pos.x > 65 
                ? 'right-[-20px] sm:right-[-30px]' 
                : 'left-1/2 -translate-x-1/2';

          const pointerAlignClass = 
            pos.x < 35 
              ? 'left-8 sm:left-10' 
              : pos.x > 65 
                ? 'right-8 sm:right-10' 
                : 'left-1/2 -translate-x-1/2';

          // Depth-based z-index: front row (larger y) rendered above back row, active speaker elevated
          const baseZ = Math.round(pos.y);
          const computedZ = (isUserFrog ? 60 : baseZ) + (isHovered ? 150 : (showBubble ? 120 : 0));

          const isTopHearted = c.id === topHeartedId;
          const charHearts = heartsCount[c.id] !== undefined 
            ? heartsCount[c.id] 
            : (typeof c.hearts === 'number' && c.hearts > 0 ? c.hearts : getInitialHearts(c.id, c.name));

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
                transform: 'translate3d(-50%, -50%, 0)',
                willChange: pos.isHopping ? 'left, top' : 'auto',
                zIndex: computedZ,
                transition: pos.isHopping ? 'left 70ms linear, top 70ms linear' : 'none'
              }}
              className="absolute cursor-pointer select-none flex flex-col items-center"
              title={`Nhấp để xem lời chúc của ${c.name}`}
            >
              {/* Subtle Floor Glow for Top 1 Frog */}
              {isTopHearted && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-6 bg-amber-400/25 rounded-full blur-md -z-10 pointer-events-none" />
              )}

              {/* Refined Name Tag (Visible when speech bubble is NOT shown) */}
              {!showBubble && (
                <div 
                  className={`absolute -top-6 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-sans font-medium whitespace-nowrap shadow-xs pointer-events-none flex items-center gap-1 transition-all ${
                    isTopHearted
                      ? 'bg-amber-400 text-amber-950 font-bold border border-amber-300/80 shadow-[0_0_8px_rgba(245,158,11,0.25)]'
                      : isUserFrog
                      ? 'bg-rose-500 text-white font-bold border border-rose-400/60 shadow-[0_0_8px_rgba(244,63,94,0.25)]'
                      : 'bg-black/60 backdrop-blur-xs text-white/90 border border-white/10'
                  }`}
                >
                  {isTopHearted && <SparklesIcon size={9} className="text-amber-950 shrink-0" />}
                  <span className="truncate max-w-[110px]">{c.name}</span>
                </div>
              )}

              {/* Speech Bubble (Art-Directed Warm Anniversary Card) */}
              {showBubble && (
                <div 
                  className={`absolute bottom-[110%] ${bubbleAlignClass} w-52 sm:w-60 max-w-[85vw] p-3 rounded-lg bg-[#FFFDF9] border border-stone-200/90 text-left shadow-xl transition-all duration-200 animate-fadeIn z-50`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Top 1 badge if applicable */}
                  {isTopHearted && (
                    <div className="flex items-center gap-1 text-[9px] font-mono font-bold text-amber-700 uppercase tracking-wider mb-1">
                      <SparklesIcon size={10} className="text-amber-600" />
                      <span>Top 1 Yêu Thích Nhất</span>
                    </div>
                  )}

                  {/* Author Name and Role */}
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold text-[#1C140D] font-display truncate">
                      {c.name}
                    </span>
                    <span className="text-[9px] font-mono text-stone-500 shrink-0">
                      {c.role === 'ALUMNI' ? 'Cựu TV' : 'Thành viên'}
                    </span>
                  </div>

                  {/* The Wish Quote */}
                  <p className="text-[11px] sm:text-xs text-stone-700 font-sans italic line-clamp-3 leading-relaxed break-words">
                    "{c.wish}"
                  </p>

                  {/* Heart Action Bar */}
                  <div className="mt-2 pt-1.5 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-stone-400">
                      Cóc Sài Gòn 17Y
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleHeart(c.id, e);
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[9px] font-bold border transition-all active:scale-90 bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200 shadow-xs cursor-pointer"
                      title={dailyHeartsRemaining > 0 ? `Thả tim (+1) • Còn ${dailyHeartsRemaining}/12 tim hôm nay` : 'Đã hết 12 lượt tim hôm nay'}
                    >
                      <HeartIcon 
                        size={10} 
                        className="text-rose-500 fill-current animate-pulse" 
                      />
                      <span>{charHearts} tim</span>
                      {dailyHeartsRemaining > 0 && (
                        <span className="text-[8px] px-1 bg-rose-200/60 text-rose-800 rounded-full font-semibold">+1</span>
                      )}
                    </button>
                  </div>

                  {/* Pointer */}
                  <div className={`absolute -bottom-1.5 ${pointerAlignClass} w-2.5 h-2.5 bg-[#FFFDF9] border-r border-b border-stone-200/90 rotate-45`} />
                </div>
              )}

              {/* The Iconic Yellow-Shirt Cóc Sài Gòn 2D Vector Mascot */}
              <div 
                style={{ transform: `scale(${pos.scale || 1}) scaleX(${pos.dir})` }}
                className="relative w-14 h-14 sm:w-16 sm:h-16 transition-transform duration-200"
              >
                <div
                  className={`w-full h-full relative ${
                    pos.isCelebrating 
                      ? 'animate-frog-celebrating' 
                      : pos.isHopping 
                        ? 'animate-frog-hopping' 
                        : 'animate-frog-idling'
                  }`}
                >
                  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
                    <use href="#csg-frog-mascot-vector" />
                  </svg>

                  {/* Soft Natural Ground Contact Shadow */}
                  <div 
                    className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-11 h-2 bg-black/25 rounded-full blur-[3px] -z-10 transition-all ${
                      pos.isHopping ? 'scale-75 opacity-30' : 'scale-100 opacity-70'
                    }`} 
                  />
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty Search State */}
        {filtered.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
            <SearchIcon size={36} className="text-[#20231F]/40 mb-2" />
            <p className="font-display font-bold text-[#20231F] text-sm">Không tìm thấy Cóc nào khớp với từ khóa</p>
            <p className="text-xs text-[#20231F]/60 font-mono mt-1">Hãy thử xóa bộ lọc hoặc tìm tên khác bạn nhé.</p>
          </div>
        )}

        {/* Ambient Floating Join CTA */}
        {!newRegistrant && onOpenRegister && (
          <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-30">
            <button
              type="button"
              onClick={() => {
                if (onClose) onClose();
                if (onOpenRegister) onOpenRegister();
              }}
              className="group px-4 py-2 rounded-full bg-[#1C140D]/85 hover:bg-[#1C140D] backdrop-blur-md text-amber-200 hover:text-amber-100 border border-amber-400/30 hover:border-amber-400/60 text-xs font-mono font-medium tracking-wide shadow-lg flex items-center gap-2 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <span>Gửi lời chúc lên sân khấu</span>
              <ArrowRightIcon size={13} className="text-amber-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // Dedicated Portal Modal for Clicked Frog Wish - Warm Keepsake Card
  const renderKeepsakeModal = () => {
    if (!activeCharacter) return null;
    if (typeof document === 'undefined') return null;

    const charHearts = heartsCount[activeCharacter.id] !== undefined 
      ? heartsCount[activeCharacter.id] 
      : (typeof activeCharacter.hearts === 'number' && activeCharacter.hearts > 0 ? activeCharacter.hearts : getInitialHearts(activeCharacter.id, activeCharacter.name));
    const isTop = activeCharacter.id === topHeartedId;
    const isHearted = !!userHeartedWishIds[activeCharacter.id];

    return createPortal(
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
        onClick={() => setActiveCharacter(null)}
      >
        <div 
          className="relative w-full max-w-md bg-[#FFFDF9] rounded-2xl border border-amber-200/80 p-6 sm:p-7 shadow-2xl text-[#20231F] animate-fadeIn z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Subtle Close Button */}
          <button
            type="button"
            onClick={() => setActiveCharacter(null)}
            className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors active:scale-95"
            title="Đóng lời chúc"
          >
            <CloseIcon size={18} />
          </button>

          {/* Eyebrow */}
          <div className="text-[10px] font-mono tracking-widest text-amber-800/80 uppercase font-semibold text-center mb-3">
            SỔ LƯU NIỆM CÓC SÀI GÒN 17Y
          </div>

          {/* Member Profile */}
          <div className="text-center mb-4">
            <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200/70 mx-auto flex items-center justify-center mb-2.5 shadow-xs">
              <FrogIcon size={28} className="text-amber-800" />
            </div>
            <h3 className="font-editorial font-bold text-2xl text-[#1C140D] leading-tight">
              {activeCharacter.name}
            </h3>
            <div className="flex items-center justify-center gap-1.5 text-xs font-mono text-stone-500 mt-1">
              <span>{activeCharacter.role === 'ALUMNI' ? 'Cựu thành viên' : 'Thành viên'}</span>
              {isTop && (
                <span className="inline-flex items-center gap-1 text-amber-700 font-bold ml-1">
                  • <SparklesIcon size={11} className="text-amber-600 inline" /> Top 1 Yêu Thích
                </span>
              )}
            </div>
          </div>

          {/* The Commemorative Wish */}
          <div className="relative py-4 px-3 sm:px-4 my-2 text-center border-y border-stone-100">
            <p className="font-editorial italic text-base sm:text-lg text-stone-800 leading-relaxed">
              "{activeCharacter.wish}"
            </p>
          </div>

          {/* Action Footer */}
          <div className="flex flex-col gap-2.5 pt-4">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={(e) => handleToggleHeart(activeCharacter.id, e)}
                className="px-4 py-2.5 rounded-full border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-mono font-bold transition-all flex items-center gap-2 active:scale-95 shadow-sm hover:scale-105 cursor-pointer"
                title={dailyHeartsRemaining > 0 ? `Bấm để thả tim (+1) • Còn ${dailyHeartsRemaining}/12 tim hôm nay` : 'Đã hết 12 lượt tim hôm nay'}
              >
                <HeartIcon size={15} className="text-rose-500 fill-current animate-pulse" />
                <span>{charHearts} lượt tim</span>
                {dailyHeartsRemaining > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 bg-rose-200/70 text-rose-800 rounded-full font-semibold">+1</span>
                )}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  triggerConfettiBlast(e);
                }}
                className="px-4 py-2.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-mono font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
              >
                <SparklesIcon size={14} />
                <span>Chúc mừng</span>
              </button>
            </div>

            {/* Daily Quota Indicator */}
            <div className="text-center text-[11px] font-mono text-stone-500 flex items-center justify-center gap-1">
              <span>Hôm nay bạn còn:</span>
              <strong className={dailyHeartsRemaining > 0 ? 'text-rose-600 font-bold' : 'text-stone-400 font-bold'}>
                {dailyHeartsRemaining}/12 lượt tim
              </strong>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  // Dedicated Slide-out Drawer for All Birthday Wishes in DB
  const renderWishDrawer = () => {
    if (!isWishDrawerOpen) return null;
    if (typeof document === 'undefined') return null;

    const drawerWishes = allCharacters.filter(c => {
      const matchRole = selectedRole === 'ALL' || c.role === selectedRole;
      const matchSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.wish.toLowerCase().includes(searchTerm.toLowerCase());
      return matchRole && matchSearch;
    });

    return createPortal(
      <div 
        className="fixed inset-0 z-[9990] flex justify-end bg-black/60 backdrop-blur-xs animate-fadeIn"
        onClick={() => setIsWishDrawerOpen(false)}
      >
        <div 
          className="relative w-full max-w-lg h-full bg-[#181614] border-l border-amber-400/20 shadow-2xl flex flex-col z-[9991] text-white animate-fadeIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drawer Header */}
          <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between gap-3 bg-[#201D1A]">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center font-bold">
                <BookOpenIcon size={16} />
              </span>
              <div>
                <h3 className="font-display font-black text-sm sm:text-base uppercase tracking-wider text-white">
                  SỔ LỜI CHÚC CÓC SÀI GÒN 17Y
                </h3>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-[11px] font-mono text-amber-300/80">
                    {allCharacters.length} lời chúc
                  </span>
                  <span className="text-white/30 text-[10px]">•</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-rose-300 bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-500/30">
                    <HeartIcon size={10} className="text-rose-400 fill-rose-400" />
                    <span>Còn {dailyHeartsRemaining}/12 tim hôm nay</span>
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsWishDrawerOpen(false)}
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors active:scale-95"
              title="Đóng sổ lời chúc"
            >
              <CloseIcon size={18} />
            </button>
          </div>

          {/* Search & Filter within Drawer */}
          <div className="p-4 border-b border-white/10 bg-[#1C1A18] space-y-3">
            <div className="relative">
              <SearchIcon size={14} className="text-white/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm lời chúc theo tên hoặc nội dung..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-[#262320] rounded-full border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-amber-400/60"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <button
                type="button"
                onClick={() => setSelectedRole('ALL')}
                className={`px-3 py-1 rounded-full font-bold transition-all text-xs ${
                  selectedRole === 'ALL'
                    ? 'bg-amber-400 text-[#1C140D]'
                    : 'bg-[#262320] text-white/70 hover:text-white'
                }`}
              >
                Tất cả ({allCharacters.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('ALUMNI')}
                className={`px-3 py-1 rounded-full font-bold transition-all text-xs ${
                  selectedRole === 'ALUMNI'
                    ? 'bg-amber-400 text-[#1C140D]'
                    : 'bg-[#262320] text-white/70 hover:text-white'
                }`}
              >
                Cựu TV ({allCharacters.filter(c => c.role === 'ALUMNI').length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('ACTIVE')}
                className={`px-3 py-1 rounded-full font-bold transition-all text-xs ${
                  selectedRole === 'ACTIVE'
                    ? 'bg-amber-400 text-[#1C140D]'
                    : 'bg-[#262320] text-white/70 hover:text-white'
                }`}
              >
                Thành viên ({allCharacters.filter(c => c.role === 'ACTIVE').length})
              </button>
            </div>
          </div>

          {/* Wishes List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {drawerWishes.map((c) => {
              const charHearts = heartsCount[c.id] !== undefined 
                ? heartsCount[c.id] 
                : (typeof c.hearts === 'number' && c.hearts > 0 ? c.hearts : getInitialHearts(c.id, c.name));
              const isTop = c.id === topHeartedId;
              const isHearted = !!userHeartedWishIds[c.id];

              return (
                <div 
                  key={c.id} 
                  className={`p-3.5 rounded-xl transition-all flex flex-col gap-2 group ${
                    isTop 
                      ? 'border border-amber-400/50 bg-[#25201A] ring-1 ring-amber-400/30 shadow-[0_0_12px_rgba(245,158,11,0.12)]' 
                      : 'border border-white/10 bg-[#201D1A] hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-amber-400/15 border border-amber-400/30 flex items-center justify-center shrink-0">
                        <FrogIcon size={14} className="text-amber-400" />
                      </span>
                      <span className="font-display font-bold text-sm text-white truncate">
                        {c.name}
                      </span>
                      {isTop && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 font-mono font-bold text-[9px] uppercase tracking-wider flex items-center gap-1 shadow-xs shrink-0">
                          <SparklesIcon size={10} className="text-amber-950" />
                          <span>TOP 1</span>
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border shrink-0 ${
                      c.role === 'ALUMNI'
                        ? 'bg-amber-950/60 text-amber-300 border-amber-700/40'
                        : 'bg-emerald-950/60 text-emerald-300 border-emerald-700/40'
                    }`}>
                      {c.role === 'ALUMNI' ? 'Cựu TV' : 'Thành viên'}
                    </span>
                  </div>
                  <p className="font-editorial italic text-xs sm:text-sm text-white/90 leading-relaxed bg-[#191715] p-2.5 rounded-lg border border-white/5">
                    "{c.wish}"
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    {/* Heart Button */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleHeart(c.id, e)}
                      className={`flex items-center gap-1.5 px-3 py-1 min-h-[30px] rounded-full border text-[11px] font-mono font-bold transition-all active:scale-95 cursor-pointer ${
                        dailyHeartsRemaining > 0
                          ? 'border-rose-500/40 bg-rose-950/50 hover:bg-rose-900/80 text-rose-300 shadow-xs'
                          : 'border-white/10 bg-black/30 text-white/40 cursor-not-allowed'
                      }`}
                      title={dailyHeartsRemaining > 0 ? `Bấm để thả tim (+1) • Còn ${dailyHeartsRemaining}/12 tim hôm nay` : 'Đã hết 12 lượt tim hôm nay'}
                    >
                      <HeartIcon size={13} className="text-rose-400 fill-rose-400" />
                      <span>{charHearts} tim</span>
                      {dailyHeartsRemaining > 0 && (
                        <span className="text-[9px] text-rose-300/90 font-mono font-semibold">+1</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsWishDrawerOpen(false);
                        setActiveSpeakerId(c.id);
                        setActiveCharacter(c);
                        setPositions(prev => {
                          if (!prev[c.id]) return prev;
                          return {
                            ...prev,
                            [c.id]: {
                              ...prev[c.id],
                              isCelebrating: true,
                              celebrateTicks: 30
                            }
                          };
                        });
                        triggerConfettiBlast();
                      }}
                      className="text-[11px] font-mono text-amber-300/80 hover:text-white flex items-center gap-1 transition-colors group-hover:translate-x-0.5"
                    >
                      <span>Xem trên sân khấu</span>
                      <ArrowRightIcon size={12} />
                    </button>
                  </div>
                </div>
              );
            })}

            {drawerWishes.length === 0 && (
              <div className="text-center py-12 text-white/50 font-mono text-xs">
                Không tìm thấy lời chúc nào khớp với tìm kiếm.
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          {onOpenRegister && (
            <div className="p-4 border-t border-white/10 bg-[#201D1A] flex items-center justify-between gap-3">
              <span className="text-[11px] font-mono text-white/60">
                Bạn chưa gửi lời chúc?
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsWishDrawerOpen(false);
                  if (onClose) onClose();
                  if (onOpenRegister) onOpenRegister();
                }}
                className="px-4 py-2 min-h-[40px] rounded-full bg-amber-400 hover:bg-amber-300 text-[#1C140D] font-mono font-bold text-xs uppercase flex items-center gap-1.5 transition-colors active:scale-95 shadow-sm cursor-pointer"
              >
                <span>Gửi lời chúc của bạn</span>
                <SparklesIcon size={14} />
              </button>
            </div>
          )}
        </div>
      </div>,
      document.body
    );
  };

  // Full-screen modal mode (fixed inset-0 w-full h-[100dvh] max-h-[100dvh])
  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 w-full h-[100dvh] max-h-[100dvh] bg-[#1C140D] flex flex-col overflow-hidden animate-fadeIn">
        {stageContent}
        {renderKeepsakeModal()}
        {renderWishDrawer()}
      </div>
    );
  }

  // Non-modal inline rendering (e.g. inside Screen 6 of RegistrationModal)
  return (
    <div className="w-full h-full flex flex-col flex-1 overflow-hidden">
      {stageContent}
      {renderKeepsakeModal()}
      {renderWishDrawer()}
    </div>
  );
};
