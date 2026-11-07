export type Word = {
  id: string;
  hanzi: string;
  pinyin: string;
  vi: string;
  example: string;
  examplePinyin: string;
  exampleVi: string;
  note?: string;
};

export type Topic = {
  id: string;
  title: string;
  hanzi: string;
  blurb: string;
  tip: string;
  words: Word[];
};

export type WordRef = Word & {
  topicId: string;
  topicTitle: string;
};

export type View =
  | { name: "home" }
  | { name: "lesson"; topicId: string; wordId?: string }
  | { name: "dict"; level?: number; query?: string; id?: string }
  | { name: "cards"; hsk?: number }
  | { name: "tones" }
  | { name: "quiz"; topicId?: string; hsk?: number };
