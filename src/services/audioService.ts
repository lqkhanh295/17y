// Continuous Background Music & Audio Service
class AudioService {
  private audio: HTMLAudioElement | null = null;
  private isPlaying = false;
  private listeners: Set<(playing: boolean) => void> = new Set();
  private userMuted = false;
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private audioSrc = '/music/1214.mp3';
  private gestureCleanup: (() => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initAudio();
    }
  }

  private initAudio() {
    if (this.audio) return;
    this.audio = new Audio(this.audioSrc);
    this.audio.loop = true;
    this.audio.preload = 'auto';
    this.audio.volume = 0.5;

    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      this.notifyListeners();
    });

    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      this.notifyListeners();
    });

    this.audio.addEventListener('ended', () => {
      if (!this.userMuted && this.audio) {
        this.audio.currentTime = 0;
        this.audio.play().catch(() => {});
      }
    });
  }

  public subscribe(callback: (playing: boolean) => void): () => void {
    this.listeners.add(callback);
    callback(this.isPlaying);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(cb => {
      try {
        cb(this.isPlaying);
      } catch (err) {
        console.error('Audio listener error:', err);
      }
    });
  }

  public async start(): Promise<boolean> {
    this.userMuted = false;
    this.initAudio();
    if (!this.audio) return false;
    try {
      await this.audio.play();
      this.isPlaying = true;
      this.notifyListeners();
      return true;
    } catch (err) {
      console.warn('Autoplay waiting for user gesture:', err);
      this.isPlaying = false;
      this.notifyListeners();
      return false;
    }
  }

  public stop() {
    this.userMuted = true;
    if (this.gestureCleanup) {
      this.gestureCleanup();
      this.gestureCleanup = null;
    }
    if (this.audio) {
      this.audio.pause();
    }
    this.isPlaying = false;
    this.notifyListeners();
  }

  // Tạm dừng nhạc nền khi bước vào Sân Khấu Cóc (không đánh dấu userMuted)
  public pauseForStage() {
    if (this.audio && this.isPlaying) {
      this.audio.pause();
      this.isPlaying = false;
      this.notifyListeners();
    }
  }

  // Tiếp tục phát nhạc nền khi rời khỏi Sân Khấu Cóc (nếu user không bấm tắt chủ động)
  public resumeFromStage() {
    if (!this.userMuted) {
      this.start().catch(() => {});
    }
  }

  public togglePlay(): boolean {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public setVolume(volume: number) {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, volume));
    }
  }

  // Automatic playback on website entrance (with autoplay policy compliance)
  public initAutoPlay() {
    if (typeof window === 'undefined') return;
    this.initAudio();

    // 1. Attempt immediate playback
    this.start().then(success => {
      if (!success) {
        // 2. Browser blocked autoplay without user gesture -> bind one-time interaction listeners
        const events = ['pointerdown', 'touchstart', 'click', 'keydown', 'scroll'];
        const startOnFirstGesture = () => {
          if (!this.userMuted && !this.isPlaying) {
            this.start().catch(() => {});
          }
          events.forEach(evt => {
            window.removeEventListener(evt, startOnFirstGesture);
          });
          this.gestureCleanup = null;
        };

        this.gestureCleanup = () => {
          events.forEach(evt => {
            window.removeEventListener(evt, startOnFirstGesture);
          });
        };

        events.forEach(evt => {
          window.addEventListener(evt, startOnFirstGesture, { once: true, passive: true });
        });
      }
    });
  }

  // Celebratory Chime Sound Effect using Web Audio API for registration completion
  public playCelebrationChime() {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.ctx) {
        this.ctx = new AudioCtx();
        this.gainNode = this.ctx.createGain();
        this.gainNode.gain.setValueAtTime(0.2, this.ctx.currentTime);
        this.gainNode.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5 - E5 - G5 - C6 - E6

      notes.forEach((freq, i) => {
        if (!this.ctx || !this.gainNode) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        gain.gain.setValueAtTime(0.2, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.6);

        osc.connect(gain);
        gain.connect(this.gainNode);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.6);
      });
    } catch {
      // AudioContext unavailable or blocked
    }
  }
}

export const audioService = new AudioService();
