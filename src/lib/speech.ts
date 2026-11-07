let lastAuto = { text: "", at: 0 };

export function speakOnce(text: string) {
  const now = Date.now();
  if (lastAuto.text === text && now - lastAuto.at < 500) return true;
  lastAuto = { text, at: now };
  return speakChinese(text);
}

export function speakChinese(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "zh-CN";
    utter.rate = 0.82;
    const voice = synth
      .getVoices()
      .find((item) => item.lang.toLowerCase().replace("_", "-").startsWith("zh"));
    if (voice) utter.voice = voice;
    synth.speak(utter);
    return true;
  } catch {
    return false;
  }
}
