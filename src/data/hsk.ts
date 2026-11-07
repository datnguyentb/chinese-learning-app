import raw from "./hsk.json";
import { words } from "./curriculum";

export type HskLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type HskEntry = {
  id: string;
  hanzi: string;
  pinyin: string;
  vi: string;
  level: HskLevel | 0;
  fold: string;
  topicId?: string;
  topicTitle?: string;
};

type RawEntry = Omit<HskEntry, "fold">;

export const HSK_LEVELS: HskLevel[] = [1, 2, 3, 4, 5, 6];

export function foldQuery(input: string) {
  return input
    .replace(/đ/gi, "d")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]/g, "");
}

export const hskEntries: HskEntry[] = (raw as RawEntry[]).map((item) => ({
  ...item,
  fold: foldQuery(`${item.pinyin} ${item.vi}`),
}));

export const hskById = new Map(hskEntries.map((entry) => [entry.id, entry]));

export const hskByLevel: Record<HskLevel, HskEntry[]> = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
for (const entry of hskEntries) {
  const level = entry.level;
  if (level === 0) continue;
  hskByLevel[level].push(entry);
}

export const hskTotal = hskEntries.length;

const hskHanzi = new Set(hskEntries.map((entry) => entry.hanzi));

export const lessonOnly: HskEntry[] = words
  .filter((word) => !hskHanzi.has(word.hanzi))
  .map((word) => ({
    id: word.id,
    hanzi: word.hanzi,
    pinyin: word.pinyin,
    vi: word.vi,
    level: 0,
    fold: foldQuery(`${word.pinyin} ${word.vi}`),
    topicId: word.topicId,
    topicTitle: word.topicTitle,
  }));

for (const entry of lessonOnly) hskById.set(entry.id, entry);

export const vocabTotal = hskTotal + lessonOnly.length;

export function searchHsk(query: string, level?: number) {
  const needle = query.trim();
  const pool = level && level >= 1 && level <= 6 ? hskByLevel[level as HskLevel] : [...lessonOnly, ...hskEntries];
  if (!needle) return pool;
  const folded = foldQuery(needle);
  return pool.filter(
    (entry) => entry.hanzi.includes(needle) || (folded.length > 0 && entry.fold.includes(folded)),
  );
}

export function quizSense(vi: string) {
  const first = vi.split(/[;；]/)[0]?.trim() || vi;
  return first.length > 42 ? `${first.slice(0, 40).trim()}…` : first;
}
