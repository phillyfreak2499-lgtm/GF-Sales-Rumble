let ctx: AudioContext | null = null;

function audio() {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function sfxMuted() {
  try {
    return localStorage.getItem("arena-sfx") === "off";
  } catch {
    return false;
  }
}

export function setSfxMuted(off: boolean) {
  try {
    if (off) localStorage.setItem("arena-sfx", "off");
    else localStorage.removeItem("arena-sfx");
  } catch {
    /* ignore */
  }
}

function env(c: AudioContext, g: GainNode, t: number, peak: number, a: number, hold: number, r: number) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.setValueAtTime(peak, t + a + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + hold + r);
}

function ding(c: AudioContext, t: number, freq: number, gain = 0.28) {
  const o = c.createOscillator();
  const g = c.createGain();
  const f = c.createBiquadFilter();
  o.type = "triangle";
  o.frequency.setValueAtTime(freq, t);
  o.frequency.exponentialRampToValueAtTime(freq * 0.55, t + 0.9);
  f.type = "highpass";
  f.frequency.value = 420;
  env(c, g, t, gain, 0.01, 0.04, 0.85);
  o.connect(f);
  f.connect(g);
  g.connect(c.destination);
  o.start(t);
  o.stop(t + 1.1);
}

function brass(c: AudioContext, t: number, freq: number, dur = 0.28, gain = 0.12) {
  const o = c.createOscillator();
  const o2 = c.createOscillator();
  const g = c.createGain();
  o.type = "sawtooth";
  o2.type = "triangle";
  o.frequency.setValueAtTime(freq, t);
  o2.frequency.setValueAtTime(freq * 2.01, t);
  env(c, g, t, gain, 0.02, dur * 0.45, dur * 0.5);
  o.connect(g);
  o2.connect(g);
  g.connect(c.destination);
  o.start(t);
  o2.start(t);
  o.stop(t + dur + 0.15);
  o2.stop(t + dur + 0.15);
}

function roar(c: AudioContext, t: number, dur = 2.2) {
  const n = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
  const data = n.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = c.createBufferSource();
  src.buffer = n;
  const f = c.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.setValueAtTime(900, t);
  f.frequency.exponentialRampToValueAtTime(380, t + dur);
  f.Q.value = 0.7;
  const g = c.createGain();
  env(c, g, t, 0.18, 0.08, dur * 0.4, dur * 0.5);
  src.connect(f);
  f.connect(g);
  g.connect(c.destination);
  src.start(t);
}

export function playWinFanfare() {
  if (sfxMuted()) return;
  const c = audio();
  if (!c) return;
  const t = c.currentTime + 0.02;
  ding(c, t, 980, 0.32);
  ding(c, t + 0.16, 1318, 0.26);
  ding(c, t + 0.32, 1568, 0.22);
  roar(c, t + 0.12, 2.6);
  const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
  notes.forEach((f, i) => brass(c, t + 0.42 + i * 0.14, f, 0.32, 0.11));
  brass(c, t + 1.2, 1568, 0.55, 0.13);
}

export function playChampFanfare() {
  if (sfxMuted()) return;
  playWinFanfare();
  const c = audio();
  if (!c) return;
  const t = c.currentTime + 1.4;
  [1046.5, 1318.5, 1568, 2093].forEach((f, i) => brass(c, t + i * 0.12, f, 0.4, 0.12));
}

export function playDing() {
  if (sfxMuted()) return;
  const c = audio();
  if (!c) return;
  ding(c, c.currentTime, 880, 0.22);
}

export function playUnlock() {
  if (sfxMuted()) return;
  const c = audio();
  if (!c) return;
  const t = c.currentTime;
  ding(c, t, 740, 0.2);
  brass(c, t + 0.08, 880, 0.35, 0.1);
  brass(c, t + 0.22, 1174, 0.4, 0.1);
}
