import { writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";

const levels = [1, 2, 3, 4, 5, 6];
const cvdictPath = process.env.CVDICT ?? `${process.env.TEMP}\\CVDICT.u8`;

function normPinyin(input) {
  return input
    .toLowerCase()
    .replace(/u:/g, "v")
    .replace(/ü/g, "v")
    .split(/\s+/)
    .map((syllable) => syllable.replace(/[^a-z0-9]/g, "").replace(/5$/, ""))
    .filter(Boolean)
    .join("");
}

function cleanSense(sense) {
  let text = sense
    .replace(/LT:[^;/)]*/g, "")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/[\u4e00-\u9fff]{0,6}\|[A-Za-z\u4e00-\u9fff]{0,8}/g, "")
    .replace(/\(\s*\)/g, "")
    .replace(/\s+/g, " ")
    .replace(/^[\s,;:.-]+|[\s,;:.-]+$/g, "")
    .trim();
  if (!text || /^(biến thể|dùng trong)(\s|[,.;]|$)/i.test(text)) return "";
  const wrapped = /^\(([^)]*)\)\s*(.*)$/.exec(text);
  if (wrapped) text = wrapped[2].split(";")[0].trim() || wrapped[1].trim();
  else if (text.length > 36) text = text.split(";")[0].trim();
  if (!text) return "";
  return text.length > 48 ? `${text.slice(0, 45).trim()}…` : text;
}

const TONE_MARKS = {
  a: "āáǎà",
  e: "ēéěè",
  i: "īíǐì",
  o: "ōóǒò",
  u: "ūúǔù",
  v: "ǖǘǚǜ",
};

function toneMark(syllable) {
  const cleaned = syllable.toLowerCase().replace("u:", "v");
  const matched = /^([a-z]+)([1-5])$/.exec(cleaned);
  if (!matched) return syllable.toLowerCase().replace(/v/g, "ü");
  let body = matched[1];
  const tone = Number(matched[2]);
  if (tone === 5) return body.replace(/v/g, "ü");
  const vowels = [...body].map((char, index) => ({ char, index })).filter((item) => "aeiouv".includes(item.char));
  let target = vowels.at(-1);
  const primary = vowels.find((item) => item.char === "a" || item.char === "e");
  if (primary) target = primary;
  else if (body.includes("ou")) target = vowels.find((item) => item.char === "o");
  if (target) {
    const marked = TONE_MARKS[target.char][tone - 1];
    body = `${body.slice(0, target.index)}${marked}${body.slice(target.index + 1)}`;
  }
  return body.replace(/v/g, "ü");
}

function splitMarked(input) {
  if (input.includes(" ") || input.includes("'")) return input;
  const tones = input.match(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]/g);
  if (!tones || tones.length < 2) return input;
  const vowels = "aāáǎàeēéěèiīíǐìoōóǒòuūúǔùüǖǘǚǜv";
  const out = [];
  let rest = input;
  while (rest) {
    let index = 0;
    let seenVowel = false;
    while (index < rest.length) {
      const char = rest[index];
      if (vowels.includes(char)) {
        seenVowel = true;
        index += 1;
        continue;
      }
      if (!seenVowel) {
        index += 1;
        continue;
      }
      if (char === "r" && (index + 1 >= rest.length || !vowels.includes(rest[index + 1]))) {
        index += 1;
      } else if (char === "n") {
        const next = rest[index + 1];
        const after = rest[index + 2];
        if (next === "g" && (after === undefined || !vowels.includes(after))) index += 2;
        else index += 1;
      }
      break;
    }
    if (index === 0) index = 1;
    out.push(rest.slice(0, index));
    rest = rest.slice(index);
  }
  return out.join(" ");
}

function prettyPinyin(numeric) {
  const pieces = numeric
    .trim()
    .split(/\s+/)
    .flatMap((piece) => {
      const tones = piece.match(/[1-5]/g);
      if (tones && tones.length > 1) return piece.toLowerCase().split(/(?<=[1-5])/).filter(Boolean);
      return [piece];
    });
  const syllables = pieces.map(toneMark);
  for (let index = 1; index < syllables.length; index += 1) {
    if (syllables[index] === "r" && syllables[index - 1]) {
      syllables[index - 1] += "r";
      syllables.splice(index, 1);
      index -= 1;
    }
  }
  return splitMarked(syllables.join(" "));
}

function chooseForm(forms) {
  const bad = /^(surname|old variant|variant of|used in|see )\b/i;
  let best = forms[0];
  let bestScore = -Infinity;
  for (const form of forms) {
    const meanings = (form.m ?? []).map((item) => item.trim()).filter(Boolean);
    const useful = meanings.filter((item) => !bad.test(item));
    let score = useful.length;
    if (!useful.length) score -= 100;
    if (/^[A-Z]/.test((form.i?.n ?? "").trim())) score -= 50;
    if (/\(coll\.\)/i.test(useful.join(" "))) score -= 3;
    if (score > bestScore) {
      best = form;
      bestScore = score;
    }
  }
  return best;
}

const PREFERRED = {
  没: "mei2",
  吗: "ma5",
  都: "dou1",
  还: "hai2",
  看: "kan4",
  行: "xing2",
  长: "zhang3",
  得: "de5",
  教: "jiao1",
};

const MANUAL = {
  打篮球: "chơi bóng rổ",
  系领带: "thắt cà vạt",
  纽扣儿: "cúc áo",
  致力于: "dốc sức vào",
  干活儿: "làm việc",
  纪录: "ghi chép; kỷ lục",
  使劲儿: "dốc sức",
  大伙儿: "mọi người",
  啰唆: "lằng nhằng; dài dòng",
  墨水儿: "mực",
  纳闷儿: "thắc mắc",
  摊儿: "sạp; quầy",
  玩意儿: "đồ vật; thứ",
  贤惠: "đảm đang",
  馅儿: "nhân bánh",
};

function glossOf(raw) {
  const senses = raw
    .split("/")
    .map(cleanSense)
    .filter((sense) => sense && !/^[\d\s.]+$/.test(sense));
  return senses.slice(0, 2).join("; ");
}

const byWord = new Map();
const text = readFileSync(cvdictPath, "utf8");
for (const line of text.split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const matched = /^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+\/(.+)\/\s*$/.exec(line);
  if (!matched) continue;
  const simplified = matched[2];
  const gloss = glossOf(matched[4]);
  if (!gloss) continue;
  const key = normPinyin(matched[3]);
  const list = byWord.get(simplified) ?? [];
  list.push({ key, gloss });
  byWord.set(simplified, list);
}

function lookup(hanzi, numeric) {
  const list = byWord.get(hanzi);
  if (!list?.length) return "";
  const wanted = normPinyin(numeric);
  const exact = list.filter((item) => item.key === wanted);
  const candidates = (exact.length ? exact : list).map((item) => item.gloss).filter(Boolean);
  const weak = (gloss) => /^(biến thể|họ)(\s|[,.;]|$)/i.test(gloss);
  return candidates.find((gloss) => !weak(gloss)) ?? candidates[0] ?? "";
}

const rows = [];
const missed = [];

for (const level of levels) {
  const url = `https://raw.githubusercontent.com/drkameleon/complete-hsk-vocabulary/main/wordlists/exclusive/old/${level}.min.json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HSK ${level}: ${response.status}`);
  const words = await response.json();
  words.forEach((word, index) => {
    let form = chooseForm(word.f ?? []);
    const preferred = PREFERRED[word.s];
    if (preferred) {
      const wanted = preferred.toLowerCase().replace(/\s+/g, "");
      const found = (word.f ?? []).find((item) => (item.i?.n ?? "").toLowerCase().replace(/\s+/g, "") === wanted);
      if (found) form = found;
    }
    const numeric = form?.i?.n ?? "";
    const pinyin = prettyPinyin(numeric);
    const hanzi = word.s;
    const vi = MANUAL[hanzi] || lookup(hanzi, numeric);
    if (!vi) missed.push(`${level}\t${hanzi}\t${pinyin}`);
    rows.push([hanzi, pinyin, vi || "Chưa có nghĩa tiếng Việt", level, index]);
  });
}

const seen = new Map();
const entries = rows.map(([hanzi, pinyin, vi, level, index]) => {
  const base = `hsk${level}-${hanzi}`;
  const count = seen.get(base) ?? 0;
  seen.set(base, count + 1);
  const id = count === 0 ? base : `${base}-${index}`;
  return { id, hanzi, pinyin, vi, level };
});

await writeFile(new URL("../src/data/hsk.json", import.meta.url), JSON.stringify(entries));
const counts = Object.fromEntries(levels.map((level) => [level, entries.filter((item) => item.level === level).length]));
console.log(JSON.stringify({ total: entries.length, counts, missed: missed.length, sampleMissed: missed.slice(0, 25) }, null, 2));
const checks = ["爱", "都", "和", "看", "还", "行", "长", "得", "教", "银行", "致力于", "谢谢", "打篮球", "没", "吗", "的", "了", "里", "个", "二", "汉语"];
console.log(entries.filter((item) => checks.includes(item.hanzi)).map((item) => `${item.level} ${item.hanzi} ${item.pinyin} — ${item.vi}`).join("\n"));
const dirty = entries.filter((item) => /LT:|\[[a-z]+[1-5]\]/.test(item.vi));
console.log("dirty", dirty.length);
