import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export const DAILY_GOAL = 8;
const STORAGE_KEY = "hoc-tieng-trung-v1";

export type QuizRecord = {
  at: string;
  correct: number;
  total: number;
  label: string;
  topicId?: string;
  hsk?: number;
};

export type Progress = {
  known: Record<string, true>;
  xp: number;
  streak: number;
  lastStudyDate: string | null;
  dailyDate: string;
  dailyWords: string[];
  quizzes: QuizRecord[];
};

export function todayKey(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function yesterdayKey() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return todayKey(date);
}

export function freshProgress(): Progress {
  return {
    known: {},
    xp: 0,
    streak: 0,
    lastStudyDate: null,
    dailyDate: todayKey(),
    dailyWords: [],
    quizzes: [],
  };
}

function rollover(progress: Progress): Progress {
  if (progress.dailyDate === todayKey()) return progress;
  return { ...progress, dailyDate: todayKey(), dailyWords: [] };
}

function stampStreak(progress: Progress): Progress {
  const today = todayKey();
  if (progress.lastStudyDate === today) return progress;
  const streak = progress.lastStudyDate === yesterdayKey() ? progress.streak + 1 : 1;
  return { ...progress, lastStudyDate: today, streak };
}

export function effectiveStreak(progress: Progress) {
  if (!progress.lastStudyDate) return 0;
  if (progress.lastStudyDate === todayKey() || progress.lastStudyDate === yesterdayKey()) {
    return progress.streak;
  }
  return 0;
}

function cleanQuiz(item: unknown): QuizRecord | null {
  if (!item || typeof item !== "object") return null;
  const record = item as Partial<QuizRecord>;
  if (
    typeof record.at !== "string" ||
    typeof record.correct !== "number" ||
    typeof record.total !== "number" ||
    typeof record.label !== "string"
  ) {
    return null;
  }
  return {
    at: record.at,
    correct: record.correct,
    total: record.total,
    label: record.label,
    topicId: typeof record.topicId === "string" ? record.topicId : undefined,
    hsk: typeof record.hsk === "number" && record.hsk >= 1 && record.hsk <= 6 ? record.hsk : undefined,
  };
}

function sanitize(value: unknown): Progress {
  if (!value || typeof value !== "object") return freshProgress();
  const raw = value as Partial<Progress>;
  const known: Record<string, true> = {};
  if (raw.known && typeof raw.known === "object") {
    for (const [id, flag] of Object.entries(raw.known)) {
      if (flag) known[id] = true;
    }
  }
  const base = freshProgress();
  return rollover({
    known,
    xp: typeof raw.xp === "number" && raw.xp > 0 ? Math.floor(raw.xp) : 0,
    streak: typeof raw.streak === "number" && raw.streak > 0 ? Math.floor(raw.streak) : 0,
    lastStudyDate: typeof raw.lastStudyDate === "string" ? raw.lastStudyDate : null,
    dailyDate: typeof raw.dailyDate === "string" ? raw.dailyDate : base.dailyDate,
    dailyWords: Array.isArray(raw.dailyWords)
      ? raw.dailyWords.filter((id): id is string => typeof id === "string")
      : [],
    quizzes: Array.isArray(raw.quizzes)
      ? raw.quizzes.map(cleanQuiz).filter((item): item is QuizRecord => item !== null).slice(0, 12)
      : [],
  });
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshProgress();
    return sanitize(JSON.parse(raw) as unknown);
  } catch {
    return freshProgress();
  }
}

export function touchProgress(progress: Progress, wordId: string, xp = 0): Progress {
  const studied = stampStreak(rollover(progress));
  const dailyWords = studied.dailyWords.includes(wordId)
    ? studied.dailyWords
    : [...studied.dailyWords, wordId];
  return { ...studied, dailyWords, xp: studied.xp + xp };
}

type ProgressApi = {
  progress: Progress;
  knownCount: number;
  dailyCount: number;
  streak: number;
  isKnown: (id: string) => boolean;
  mark: (id: string, known: boolean) => void;
  review: (id: string, xp?: number) => void;
  addQuiz: (record: Omit<QuizRecord, "at">) => void;
  reset: () => void;
};

const ProgressContext = createContext<ProgressApi | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(loadProgress);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const api = useMemo<ProgressApi>(() => {
    return {
      progress,
      knownCount: Object.keys(progress.known).length,
      dailyCount: progress.dailyWords.length,
      streak: effectiveStreak(progress),
      isKnown: (id) => Boolean(progress.known[id]),
      mark: (id, known) => {
        setProgress((current) => {
          const next = touchProgress(current, id, 0);
          const has = Boolean(next.known[id]);
          if (known && !has) {
            return { ...next, known: { ...next.known, [id]: true }, xp: next.xp + 10 };
          }
          if (!known && has) {
            const knownMap = { ...next.known };
            delete knownMap[id];
            return { ...next, known: knownMap, xp: Math.max(0, next.xp - 10) };
          }
          return next;
        });
      },
      review: (id, xp = 0) => {
        setProgress((current) => touchProgress(current, id, xp));
      },
      addQuiz: (record) => {
        setProgress((current) => {
          const studied = stampStreak(rollover(current));
          return {
            ...studied,
            xp: studied.xp + record.correct * 5,
            quizzes: [{ ...record, at: new Date().toISOString() }, ...studied.quizzes].slice(0, 12),
          };
        });
      },
      reset: () => setProgress(freshProgress()),
    };
  }, [progress]);

  return <ProgressContext.Provider value={api}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const value = useContext(ProgressContext);
  if (!value) throw new Error("useProgress phải nằm trong ProgressProvider");
  return value;
}
