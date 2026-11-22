// Emberfall Duel — tiny synthesized sounds. No audio files, no network:
// a few oscillator blips through WebAudio, created on the first gesture.

let ctx = null;

function audio() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      return null;
    }
  }
  if (ctx && ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq, when, dur, type = 'sine', gain = 0.08) {
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  amp.gain.setValueAtTime(gain, ac.currentTime + when);
  amp.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + when + dur);
  osc.connect(amp).connect(ac.destination);
  osc.start(ac.currentTime + when);
  osc.stop(ac.currentTime + when + dur + 0.05);
}

export const sfx = {
  play() { tone(520, 0, 0.12, 'triangle'); tone(780, 0.07, 0.14, 'triangle'); },
  hit() { tone(160, 0, 0.18, 'sawtooth', 0.06); tone(90, 0.05, 0.2, 'square', 0.05); },
  draw() { tone(660, 0, 0.06, 'sine', 0.05); },
  win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.25, 'triangle', 0.09)); },
  lose() { [392, 330, 262, 196].forEach((f, i) => tone(f, i * 0.14, 0.28, 'sine', 0.08)); },
};
