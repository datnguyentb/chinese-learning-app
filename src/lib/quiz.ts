import { quizSense } from "../data/hsk";

export type QuizMode = "hanzi-to-vi" | "vi-to-hanzi";

export type QuizWord = {
  id: string;
  hanzi: string;
  pinyin: string;
  vi: string;
  topicId?: string;
};

export type QuizQuestion = {
  word: QuizWord;
  mode: QuizMode;
  choices: string[];
  answer: string;
};

export function shuffle<T>(list: T[]) {
  const next = [...list];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [next[index], next[swap]] = [next[swap], next[index]];
  }
  return next;
}

export function buildQuiz(pool: QuizWord[], count = 8): QuizQuestion[] {
  return shuffle(pool)
    .slice(0, Math.min(count, pool.length))
    .map((word, index) => {
      const mode: QuizMode = index % 2 === 0 ? "hanzi-to-vi" : "vi-to-hanzi";
      const answer = mode === "hanzi-to-vi" ? quizSense(word.vi) : word.hanzi;
      const wrong = [
        ...new Set(
          shuffle(pool.filter((item) => item.id !== word.id))
            .map((item) => (mode === "hanzi-to-vi" ? quizSense(item.vi) : item.hanzi))
            .filter((choice) => choice !== answer),
        ),
      ].slice(0, 3);
      return { word, mode, choices: shuffle([answer, ...wrong]), answer };
    });
}
