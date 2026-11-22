import React, { useState } from 'react';
import { Volume2, VolumeX, Music } from 'lucide-react';
import { audioService } from '../services/audioService';

export const AudioPlayerToggle: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const handleToggle = () => {
    setHasInteracted(true);
    const active = audioService.togglePlay();
    setIsPlaying(active);
  };

  return (
    <div className="fixed bottom-4 left-4 sm:bottom-6 sm:right-6 sm:left-auto z-40 flex items-center gap-3 select-none pb-[env(safe-area-inset-bottom)]">
      {!hasInteracted && !isPlaying && (
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium animate-bounce shadow-lg shadow-black/50">
          <Music className="w-3.5 h-3.5 text-amber-400" />
          <span>Bật nhạc tiệc sinh nhật!</span>
        </div>
      )}

      <button
        onClick={handleToggle}
        title={isPlaying ? 'Tắt nhạc tiệc' : 'Bật nhạc tiệc sinh nhật Cóc'}
        aria-label="Toggle party sound"
        className={`group relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full border transition-all duration-300 shadow-xl ${
          isPlaying
            ? 'bg-amber-500 border-amber-300 text-black shadow-amber-500/30 scale-105'
            : 'bg-slate-900/90 hover:bg-slate-800 border-amber-500/40 text-amber-400 hover:border-amber-400'
        }`}
      >
        {isPlaying ? (
          <div className="relative flex items-center justify-center">
            {/* Spinning ring animation */}
            <span className="absolute -inset-1.5 rounded-full border-2 border-dashed border-amber-400/60 animate-spin" />
            <Volume2 className="w-5 h-5 text-black" />
          </div>
        ) : (
          <VolumeX className="w-5 h-5 transition-transform group-hover:scale-110" />
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
