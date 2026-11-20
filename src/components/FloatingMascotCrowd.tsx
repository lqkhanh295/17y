import React, { useState, useEffect } from 'react';
import { MascotFrog } from '../types';
import confetti from 'canvas-confetti';
import { audioService } from '../services/audioService';

interface FloatingMascotCrowdProps {
  mascots: MascotFrog[];
}

export const FloatingMascotCrowd: React.FC<FloatingMascotCrowdProps> = ({ mascots }) => {
  const [positions, setPositions] = useState<{ [id: string]: { x: number; y: number; dir: number } }>({});

  // Initialize and animate frogs walking/floating
  useEffect(() => {
    // Initial random positions along the lower third of the screen
    const initialPos: { [id: string]: { x: number; y: number; dir: number } } = {};
    mascots.forEach((m, idx) => {
      initialPos[m.id] = {
        x: m.x || (15 + (idx * 25) % 70),
        y: m.y || (70 + (idx * 6) % 20),
        dir: m.direction || (idx % 2 === 0 ? 1 : -1)
      };
    });
    setPositions(initialPos);

    // Continuous walking animation interval
    const interval = setInterval(() => {
      setPositions(prev => {
        const next = { ...prev };
        mascots.forEach(m => {
          if (!next[m.id]) return;
          let { x, y, dir } = next[m.id];
          x += dir * 0.18; // Speed

          // Bounce back from walls
          if (x > 88) {
            x = 88;
            dir = -1;
          } else if (x < 6) {
            x = 6;
            dir = 1;
          }

          next[m.id] = { x, y, dir };
        });
        return next;
      });
    }, 60);

    return () => clearInterval(interval);
  }, [mascots]);

  const handleFrogClick = (m: MascotFrog, e: React.MouseEvent) => {
    e.stopPropagation();
    audioService.playCelebrationChime();
    confetti({
      particleCount: 40,
      spread: 50,
      origin: {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight
      },
      colors: ['#F59E0B', '#FBBF24', '#10B981']
    });
  };

  if (mascots.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden">
      {mascots.map((m) => {
        const pos = positions[m.id] || { x: m.x, y: m.y, dir: 1 };
        return (
          <div
            key={m.id}
            onClick={(e) => handleFrogClick(m, e)}
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: `translate(-50%, -50%) scaleX(${pos.dir})`,
            }}
            className="absolute pointer-events-auto cursor-pointer transition-transform duration-75 group select-none"
            title="Bấm vào chú Cóc để nhận pháo hoa!"
          >
            {/* Speech bubble with Name and Wish (Fixed rotation so text is never backwards) */}
            <div 
              style={{ transform: `scaleX(${pos.dir})` }}
              className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 sm:w-56 p-2 rounded-xl bg-slate-900/95 border border-amber-400 text-left shadow-xl shadow-black/80 transition-all duration-200 group-hover:scale-105 z-20"
            >
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="text-[11px] font-bold text-amber-400 font-display truncate">
                  {m.name}
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                  {m.role === 'ALUMNI' ? 'Cựu TV' : 'Thành viên'}
                </span>
              </div>
              <p className="text-[11px] text-slate-200 line-clamp-2 leading-tight italic">
                "{m.wish}"
              </p>
              {/* Pointer triangle */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-8 border-t-amber-400" />
            </div>

            {/* Custom SVG Yellow-Shirt Toad Mascot */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 animate-bounce duration-700">
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
                {/* Frog Body Green */}
                <ellipse cx="50" cy="58" rx="30" ry="26" fill="#10B981" />
                <ellipse cx="50" cy="62" rx="20" ry="16" fill="#34D399" opacity="0.4" />

                {/* Big Eyes */}
                <circle cx="34" cy="32" r="14" fill="#10B981" />
                <circle cx="66" cy="32" r="14" fill="#10B981" />
                <circle cx="34" cy="32" r="10" fill="#FFFFFF" />
                <circle cx="66" cy="32" r="10" fill="#FFFFFF" />
                {/* Pupils */}
                <circle cx="36" cy="32" r="5" fill="#0F172A" />
                <circle cx="68" cy="32" r="5" fill="#0F172A" />
                <circle cx="38" cy="30" r="2" fill="#FFFFFF" />
                <circle cx="70" cy="30" r="2" fill="#FFFFFF" />

                {/* Cute Smiling Mouth */}
                <path d="M 38 46 Q 50 56 62 46" fill="none" stroke="#064E3B" strokeWidth="3" strokeLinecap="round" />
                {/* Rosy cheeks */}
                <ellipse cx="30" cy="46" rx="5" ry="3" fill="#F43F5E" opacity="0.5" />
                <ellipse cx="70" cy="46" rx="5" ry="3" fill="#F43F5E" opacity="0.5" />

                {/* Signature Yellow Shirt (Áo Vàng Cóc Sài Gòn) */}
                <path d="M 28 58 Q 50 52 72 58 L 74 78 Q 50 82 26 78 Z" fill="#F59E0B" />
                {/* Collar */}
                <path d="M 42 56 L 50 63 L 58 56 Z" fill="#B45309" />
                {/* CSG 17Y Logo print on shirt */}
                <text x="50" y="73" textAnchor="middle" fontSize="9" fontWeight="900" fontFamily="sans-serif" fill="#78350F">
                  CSG 17Y
                </text>

                {/* Tiny Feet */}
                <ellipse cx="32" cy="84" rx="8" ry="4" fill="#059669" />
                <ellipse cx="68" cy="84" rx="8" ry="4" fill="#059669" />
              </svg>

              {/* Tiny yellow sparkle glow */}
              <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-md -z-10 group-hover:bg-amber-400/40 transition-colors" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
