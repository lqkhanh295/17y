import React, { useState, useEffect } from 'react';
import { Volume2Icon, VolumeXIcon, MusicIcon } from 'naive-icons';
import { audioService } from '../services/audioService';

export const AudioPlayerToggle: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(() => audioService.getIsPlaying());
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    const unsubscribe = audioService.subscribe((playing) => {
      setIsPlaying(playing);
      if (playing) {
        setHasInteracted(true);
      }
    });
    return unsubscribe;
  }, []);

  const handleToggle = () => {
    setHasInteracted(true);
    audioService.togglePlay();
  };

  return (
    <div className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-40 flex items-center gap-3 select-none pb-[env(safe-area-inset-bottom)]">
      {/* Interactive Helper Pill */}
      {!hasInteracted && !isPlaying && (
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-900 bg-amber-50/90 text-xs font-medium animate-bounce shadow-md">
          <MusicIcon size={14} className="text-amber-700 shrink-0" />
          <span>Bật nhạc tiệc 1214!</span>
        </div>
      )}

      {isPlaying && (
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border border-amber-400/40 text-amber-300 text-[11px] font-mono tracking-tight shadow-md animate-fadeIn">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>1214 • Cóc Sài Gòn</span>
        </div>
      )}

      <button
        onClick={handleToggle}
        title={isPlaying ? 'Tạm dừng nhạc (1214)' : 'Phát nhạc tiệc Cóc Sài Gòn (1214)'}
        aria-label={isPlaying ? 'Tắt nhạc tiệc' : 'Bật nhạc tiệc 17Y'}
        className={`group relative flex items-center justify-center w-12 h-12 min-w-[48px] min-h-[48px] rounded-full border transition-all duration-300 shadow-xl active:scale-90 ${
          isPlaying
            ? 'bg-amber-500 border-amber-300 text-black shadow-amber-500/30 scale-105'
            : 'bg-slate-900/90 hover:bg-slate-800 border-amber-500/40 text-amber-400 hover:border-amber-400'
        }`}
      >
        {isPlaying ? (
          <div className="relative flex items-center justify-center">
            {/* Spinning ring animation */}
            <span className="absolute -inset-1.5 rounded-full border-2 border-dashed border-amber-400/60 animate-spin" />
            <Volume2Icon size={20} className="text-black" color="currentColor" />
          </div>
        ) : (
          <VolumeXIcon size={20} className="transition-transform group-hover:scale-110" color="currentColor" />
        )}

        {/* Visualizer wave bars when playing */}
        {isPlaying && (
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
          </span>
        )}
      </button>
    </div>
  );
};
