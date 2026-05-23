class SoundEngine {
  private ctx: AudioContext | null = null;
  private _muted: boolean;

  constructor() {
    const stored = typeof localStorage !== "undefined" ? localStorage.getItem("vibegotchi_muted") : null;
    this._muted = stored === "true";
  }

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  }

  get muted() { return this._muted; }

  toggle(): boolean {
    this._muted = !this._muted;
    localStorage.setItem("vibegotchi_muted", String(this._muted));
    return this._muted;
  }

  private tone(
    freq: number,
    type: OscillatorType,
    duration: number,
    peak = 0.3,
    delay = 0,
    freqEnd?: number,
  ): void {
    if (this._muted) return;
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      const t = ctx.currentTime + delay;
      osc.frequency.setValueAtTime(freq, t);
      if (freqEnd !== undefined) osc.frequency.linearRampToValueAtTime(freqEnd, t + duration);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(peak, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
      osc.start(t);
      osc.stop(t + duration + 0.01);
    } catch (_) {}
  }

  pop(): void {
    this.tone(520, "sine", 0.1, 0.18);
    this.tone(860, "sine", 0.07, 0.1, 0.05);
  }

  click(): void {
    this.tone(700, "square", 0.04, 0.08);
  }

  levelUp(): void {
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, "triangle", 0.28, 0.22, i * 0.11));
  }

  sadTone(): void {
    this.tone(320, "sine", 0.9, 0.2, 0, 160);
    this.tone(260, "sine", 0.6, 0.1, 0.3, 130);
  }

  battle(): void {
    this.tone(200, "sawtooth", 0.06, 0.15);
    this.tone(400, "sawtooth", 0.06, 0.15, 0.06);
    this.tone(600, "sawtooth", 0.08, 0.2, 0.12);
  }

  victory(): void {
    [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, "triangle", 0.22, 0.28, i * 0.09));
  }
}

export const sounds = new SoundEngine();
