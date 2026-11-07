const TONE_MARKS: Record<string, number> = {};

for (const [chars, tone] of [
  ["āēīōūǖĀĒĪŌŪǕ", 1],
  ["áéíóúǘÁÉÍÓÚǗ", 2],
  ["ǎěǐǒǔǚǍĚǏǑǓǙ", 3],
  ["àèìòùǜÀÈÌÒÙǛ", 4],
] as const) {
  for (const char of chars) TONE_MARKS[char] = tone;
}

const FOLD: Record<string, string> = {
  ā: "a", á: "a", ǎ: "a", à: "a",
  ē: "e", é: "e", ě: "e", è: "e",
  ī: "i", í: "i", ǐ: "i", ì: "i",
  ō: "o", ó: "o", ǒ: "o", ò: "o",
  ū: "u", ú: "u", ǔ: "u", ù: "u",
  ǖ: "u", ǘ: "u", ǚ: "u", ǜ: "u", ü: "u",
};

export const TONE_LABEL = [
  "",
  "Thanh 1 · cao bằng",
  "Thanh 2 · đi lên",
  "Thanh 3 · hạ rồi lên",
  "Thanh 4 · tụt xuống",
  "Thanh nhẹ",
];

export function toneOf(syllable: string) {
  for (const char of syllable) {
    const tone = TONE_MARKS[char];
    if (tone) return tone;
  }
  return 5;
}

export function foldPinyin(input: string) {
  return [...input.toLowerCase()]
    .map((char) => FOLD[char] ?? char)
    .join("")
    .replace(/v/g, "u")
    .replace(/[^a-z0-9\u4e00-\u9fff]/g, "");
}

export function Pinyin({ text }: { text: string }) {
  const parts = text.split(/(\s+)/);
  return (
    <span className="pinyin">
      {parts.map((part, index) => {
        if (/^\s+$/.test(part)) return <span key={index}>{part}</span>;
        const matched = /^(\P{L}*)(.*?)(\P{L}*)$/u.exec(part);
        const pre = matched?.[1] ?? "";
        const core = matched?.[2] ?? part;
        const post = matched?.[3] ?? "";
        const tone = toneOf(core);
        return (
          <span key={index}>
            {pre}
            <span className={`tone-${tone}`} title={TONE_LABEL[tone]}>
              {core}
            </span>
            {post}
          </span>
        );
      })}
    </span>
  );
}

export function ToneLegend() {
  return (
    <p className="legend" aria-label="Chú giải màu thanh điệu">
      <span className="tone-1">Thanh 1</span>
      <span className="tone-2">Thanh 2</span>
      <span className="tone-3">Thanh 3</span>
      <span className="tone-4">Thanh 4</span>
      <span className="tone-5">Thanh nhẹ</span>
    </p>
  );
}
