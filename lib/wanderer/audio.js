export function playTick(f, len) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  try { if (!this.ac || this.ac.state === 'closed') this.ac = new AudioContext(); } catch { this.ac = null; return; }
  const ac = this.ac, o = ac.createOscillator(), g = ac.createGain(), l = len || .12;
  o.type = 'sine'; o.frequency.value = (f || 180) + Math.random() * 60;
  g.gain.setValueAtTime(0.04, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + l);
  o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + l + .01);
}

export function toggleAudio() {
  const sound = !this.state.sound;
  if (sound) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      try {
        if (!this.ac || this.ac.state === 'closed') this.ac = new AudioContext();
        if (this.ac.state === 'suspended') this.ac.resume().catch(() => {});
      } catch { this.ac = null; }
    }
  }
  this.setState({ sound });
}
