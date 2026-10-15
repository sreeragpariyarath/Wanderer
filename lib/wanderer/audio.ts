export class SceneAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private enabled = false;
  private disposed = false;
  private voices = new Set<OscillatorNode>();
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (this.master && this.context)
      this.master.gain.setValueAtTime(
        enabled ? 1 : 0,
        this.context.currentTime,
      );
  }
  /** Only explicit user gestures unlock audio, never restored preferences. */
  unlock(): void {
    if (!this.enabled || this.disposed) return;
    try {
      const Constructor = window.AudioContext || window.webkitAudioContext;
      if (!Constructor) return;
      if (!this.context || this.context.state === 'closed') {
        this.context = new Constructor();
        this.master = this.context.createGain();
        this.master.connect(this.context.destination);
        this.master.gain.value = this.enabled ? 1 : 0;
      }
      if (this.context.state === 'suspended')
        void this.context.resume().catch(() => {});
    } catch {
      /* Sound is optional. */
    }
  }
  play(frequency = 180, length = 0.12): void {
    const context = this.context;
    if (
      !this.enabled ||
      this.disposed ||
      !context ||
      context.state !== 'running' ||
      !this.master
    )
      return;
    try {
      const oscillator = context.createOscillator(),
        gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.04, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        context.currentTime + length,
      );
      oscillator.connect(gain);
      gain.connect(this.master);
      this.voices.add(oscillator);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
        this.voices.delete(oscillator);
      };
      oscillator.start();
      oscillator.stop(context.currentTime + length + 0.01);
    } catch {
      /* The context can close while a frame is in flight. */
    }
  }
  dispose(): void {
    this.disposed = true;
    for (const voice of this.voices) {
      try {
        voice.stop();
        voice.disconnect();
      } catch {}
    }
    this.voices.clear();
    this.master?.disconnect();
    this.master = null;
    const context = this.context;
    this.context = null;
    if (context && context.state !== 'closed')
      void context.close().catch(() => {});
  }
}
