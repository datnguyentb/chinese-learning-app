let audio: AudioContext | null = null;

function context() {
  const Context = window.AudioContext;
  if (!Context) return null;
  if (!audio) audio = new Context();
  if (audio.state === "suspended") void audio.resume();
  return audio;
}

export function playCorrect() {
  if (typeof window === "undefined") return;
  const ctx = context();
  if (!ctx) return;
  const now = ctx.currentTime;
  for (const [index, frequency] of [523.25, 659.25, 783.99].entries()) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency;
    const start = now + index * 0.08;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.09, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.3);
  }
}
