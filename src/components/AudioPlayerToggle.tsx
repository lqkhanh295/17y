import React, { useState, useEffect } from 'react';
import { Volume2Icon, VolumeXIcon } from 'naive-icons';
import { audioService } from '../services/audioService';

export const AudioPlayerToggle: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(() => audioService.getIsPlaying());

  useEffect(() => {
    const unsubscribe = audioService.subscribe((playing) => {
      setIsPlaying(playing);
    });
    return unsubscribe;
  }, []);

  const handleToggle = () => {
    audioService.togglePlay();
  };

  return (
    <div className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-40 flex items-center gap-3 select-none pb-[env(safe-area-inset-bottom)]">
      <button
        onClick={handleToggle}
        title={isPlaying ? 'Tạm dừng nhạc nền' : 'Bật nhạc nền'}
        aria-label={isPlaying ? 'Tạm dừng nhạc nền' : 'Bật nhạc nền'}
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
