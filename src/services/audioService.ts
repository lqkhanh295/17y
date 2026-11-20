// Web Audio Party Synthesizer & Sound Effects
class AudioService {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private gainNode: GainNode | null = null;
  private timer: number | null = null;
  private tempo = 112; // BPM
  private noteIndex = 0;

  // Festive party chord progressions (Cóc Sài Gòn celebration)
  // C - G - Am - F cheerful progression with lively rhythm
  private melodyNotes = [
    523.25, 659.25, 783.99, 1046.50, // C5, E5, G5, C6
    587.33, 739.99, 880.00, 1174.66, // D5, F#5, A5, D6
    440.00, 523.25, 659.25, 880.00,  // A4, C5, E5, A5
    349.23, 440.00, 523.25, 698.46,  // F4, A4, C5, F5
  ];

  private bassNotes = [130.81, 146.83, 110.00, 87.31]; // C3, D3, A2, F2

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(0.12, this.ctx.currentTime);
      this.gainNode.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public togglePlay(): boolean {
    this.init();
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

  public start() {
    if (this.isPlaying || !this.ctx) return;
    this.isPlaying = true;
    this.schedulePartyBeat();
  }

  public stop() {
    this.isPlaying = false;
    if (this.timer) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private schedulePartyBeat() {
    if (!this.isPlaying || !this.ctx || !this.gainNode) return;

    const now = this.ctx.currentTime;
    const bar = Math.floor(this.noteIndex / 4) % 4;
    const noteInBar = this.noteIndex % 4;

    // 1. Play warm acoustic melody note
    const osc = this.ctx.createOscillator();
    const noteGain = this.ctx.createGain();
    
    // Warm triangle/sine blend
    osc.type = noteInBar === 0 ? 'sine' : 'triangle';
    const noteFreq = this.melodyNotes[this.noteIndex % this.melodyNotes.length];
    osc.frequency.setValueAtTime(noteFreq, now);

    noteGain.gain.setValueAtTime(0.08, now);
    noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(noteGain);
    noteGain.connect(this.gainNode);
    osc.start(now);
    osc.stop(now + 0.35);

    // 2. Play subtle warm bass line on beat 1 & 3
    if (noteInBar === 0 || noteInBar === 2) {
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(this.bassNotes[bar], now);

      bassGain.gain.setValueAtTime(0.15, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      bassOsc.connect(bassGain);
      bassGain.connect(this.gainNode);
      bassOsc.start(now);
      bassOsc.stop(now + 0.45);
    }

    // 3. Shimmer hi-hat on beat 2 & 4
    if (noteInBar === 1 || noteInBar === 3) {
      this.playShimmerHit(now);
    }

    this.noteIndex++;
    const stepDuration = (60 / this.tempo) * 1000 * 0.5; // Eighth note
    this.timer = window.setTimeout(() => this.schedulePartyBeat(), stepDuration);
  }

  private playShimmerHit(time: number) {
    if (!this.ctx || !this.gainNode) return;
    const bufferSize = this.ctx.sampleRate * 0.05;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, time);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.03, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.gainNode);

    whiteNoise.start(time);
    whiteNoise.stop(time + 0.05);
  }

  // Celebratory Success sound effect when finishing registration
  public playCelebrationChime() {
    this.init();
    if (!this.ctx || !this.gainNode) return;
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
  }
}

export const audioService = new AudioService();
