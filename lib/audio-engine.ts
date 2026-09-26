/**
 * Hardware-Grade Synthesized Audio Engine for Staff Workspaces.
 * Uses HTML5 Web Audio API to produce zero-latency chimes without external audio file requests.
 */

class KitchenAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private buzzerInterval: ReturnType<typeof setInterval> | null = null;
  private buzzerSources: Set<string> = new Set();
  private onBuzzerStateChangeCallbacks: Set<(active: boolean) => void> = new Set();

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public subscribeBuzzerState(cb: (active: boolean) => void) {
    this.onBuzzerStateChangeCallbacks.add(cb);
    cb(this.isBuzzerActive());
    return () => {
      this.onBuzzerStateChangeCallbacks.delete(cb);
    };
  }

  private notifyBuzzerState() {
    const active = this.isBuzzerActive();
    this.onBuzzerStateChangeCallbacks.forEach((cb) => {
      try {
        cb(active);
      } catch {}
    });
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopAllBuzzers();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Sharp Piercing Buzzer: High-attention dual-frequency rapid burst (960Hz square + 1440Hz sawtooth)
   * Emulates rugged commercial kitchen / housekeeping call buzzer.
   */
  public playSharpBuzzerPulse() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Burst 1 (0 to 0.14s)
      const osc1a = ctx.createOscillator();
      const osc1b = ctx.createOscillator();
      const gain1 = ctx.createGain();

      osc1a.type = "square";
      osc1a.frequency.setValueAtTime(960, now);
      osc1b.type = "sawtooth";
      osc1b.frequency.setValueAtTime(1440, now);

      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.linearRampToValueAtTime(0.24, now + 0.015);
      gain1.gain.setValueAtTime(0.24, now + 0.11);
      gain1.gain.linearRampToValueAtTime(0.001, now + 0.14);

      osc1a.connect(gain1);
      osc1b.connect(gain1);
      gain1.connect(ctx.destination);

      osc1a.start(now);
      osc1b.start(now);
      osc1a.stop(now + 0.14);
      osc1b.stop(now + 0.14);

      // Burst 2 (0.20s to 0.34s) - Sharp double-chirp
      const t2 = now + 0.20;
      const osc2a = ctx.createOscillator();
      const osc2b = ctx.createOscillator();
      const gain2 = ctx.createGain();

      osc2a.type = "square";
      osc2a.frequency.setValueAtTime(960, t2);
      osc2b.type = "sawtooth";
      osc2b.frequency.setValueAtTime(1440, t2);

      gain2.gain.setValueAtTime(0.001, t2);
      gain2.gain.linearRampToValueAtTime(0.26, t2 + 0.015);
      gain2.gain.setValueAtTime(0.26, t2 + 0.11);
      gain2.gain.linearRampToValueAtTime(0.001, t2 + 0.14);

      osc2a.connect(gain2);
      osc2b.connect(gain2);
      gain2.connect(ctx.destination);

      osc2a.start(t2);
      osc2b.start(t2);
      osc2a.stop(t2 + 0.14);
      osc2b.stop(t2 + 0.14);
    } catch {
      // Audio autoplay policy catch
    }
  }

  /**
   * Continuous Sharp Buzzer Loop: triggers periodically until all sources are accepted / stopped
   */
  public startBuzzer(sourceId: string) {
    this.buzzerSources.add(sourceId);
    this.notifyBuzzerState();

    if (this.isMuted) return;

    if (!this.buzzerInterval) {
      // Play first pulse immediately
      this.playSharpBuzzerPulse();

      this.buzzerInterval = setInterval(() => {
        if (this.buzzerSources.size > 0 && !this.isMuted) {
          this.playSharpBuzzerPulse();
        } else {
          if (this.buzzerInterval) {
            clearInterval(this.buzzerInterval);
            this.buzzerInterval = null;
          }
          this.notifyBuzzerState();
        }
      }, 1600); // Sharp pulse repeats every 1.6s
    }
  }

  /**
   * Stop buzzer for a specific accepted ticket/request
   */
  public stopBuzzer(sourceId: string) {
    this.buzzerSources.delete(sourceId);
    if (this.buzzerSources.size === 0 && this.buzzerInterval) {
      clearInterval(this.buzzerInterval);
      this.buzzerInterval = null;
    }
    this.notifyBuzzerState();
  }

  /**
   * Staff manual temporary silence
   */
  public silenceBuzzer() {
    if (this.buzzerInterval) {
      clearInterval(this.buzzerInterval);
      this.buzzerInterval = null;
    }
    this.notifyBuzzerState();
  }

  /**
   * Clear all active buzzer requests
   */
  public stopAllBuzzers() {
    this.buzzerSources.clear();
    if (this.buzzerInterval) {
      clearInterval(this.buzzerInterval);
      this.buzzerInterval = null;
    }
    this.notifyBuzzerState();
  }

  public isBuzzerActive(): boolean {
    return this.buzzerSources.size > 0 && !this.isMuted;
  }

  /**
   * Pleasant two-tone chime for incoming orders: D5 (587Hz) -> A5 (880Hz)
   */
  public playOrderChime() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Note 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, now); // D5
      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.exponentialRampToValueAtTime(0.3, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Note 2 (Ascending fifth)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880.0, now + 0.15); // A5
      gain2.gain.setValueAtTime(0.001, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.35, now + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.65);
    } catch {
      // Audio autoplay policy catch
    }
  }

  /**
   * Urgent pulse chime for SLA escalation / critical warnings
   */
  public playEscalationAlert() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      [0, 0.18, 0.36].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(740, now + offset); // F#5
        gain.gain.setValueAtTime(0.25, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.14);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.15);
      });
    } catch {
      // Silently catch
    }
  }

  /**
   * Conflict collision alert tone (when another chef accepts order first)
   */
  public playConflictAlert() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.25);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // Silently catch
    }
  }
}

export const kitchenAudioEngine = new KitchenAudioEngine();
