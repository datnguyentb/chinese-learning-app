import { useEffect, useRef, useState } from "react";
import { topics, words } from "../data/curriculum";
import { HSK_LEVELS, hskByLevel, quizSense, type HskLevel } from "../data/hsk";
import { shuffle } from "../lib/quiz";
import { Pinyin } from "../lib/pinyin";
import { useProgress } from "../lib/progress";
import { SpeakButton } from "./SpeakButton";

type CardWord = {
  id: string;
  hanzi: string;
  pinyin: string;
  vi: string;
  exampleVi?: string;
};

function collectLesson(topicId: string, onlyUnknown: boolean, known: Record<string, true>): CardWord[] {
  return shuffle(
    words.filter((word) => {
      const topicOk = topicId === "all" || word.topicId === topicId;
      const knownOk = !onlyUnknown || !known[word.id];
      return topicOk && knownOk;
    }),
  );
}

function collectHsk(level: number, onlyUnknown: boolean, known: Record<string, true>): CardWord[] {
  const pool = hskByLevel[level as HskLevel] ?? [];
  return shuffle(pool.filter((word) => !onlyUnknown || !known[word.id]));
}

export function Flashcards({ hsk, onQuiz }: { hsk?: number; onQuiz: (level?: number) => void }) {
  const startHsk = hsk && hsk >= 1 && hsk <= 6 ? hsk : undefined;
  const { progress, mark } = useProgress();
  const knownRef = useRef(progress.known);
  knownRef.current = progress.known;
  const [board, setBoard] = useState<number | "lesson">(startHsk ?? "lesson");
  const [topicId, setTopicId] = useState("all");
  const [onlyUnknown, setOnlyUnknown] = useState(false);
  const [front, setFront] = useState<"hanzi" | "vi">("hanzi");
  const [deck, setDeck] = useState<CardWord[]>(() =>
    startHsk ? collectHsk(startHsk, false, {}) : collectLesson("all", false, {}),
  );
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);

  function resetDeck(next: CardWord[]) {
    setDeck(next);
    setIndex(0);
    setFlipped(false);
    setDone(false);
  }

  function loadLesson(nextTopic: string, nextUnknown: boolean) {
    setBoard("lesson");
    setTopicId(nextTopic);
    setOnlyUnknown(nextUnknown);
    resetDeck(collectLesson(nextTopic, nextUnknown, knownRef.current));
  }

  function loadHsk(level: number, nextUnknown: boolean) {
    setBoard(level);
    setOnlyUnknown(nextUnknown);
    resetDeck(collectHsk(level, nextUnknown, knownRef.current));
  }

  function reload(nextUnknown: boolean) {
    if (board === "lesson") loadLesson(topicId, nextUnknown);
    else loadHsk(board, nextUnknown);
  }

  const rateRef = useRef<(known: boolean) => void>(() => {});
  rateRef.current = (known: boolean) => {
    if (done || deck.length === 0) return;
    mark(deck[index].id, known);
    setFlipped(false);
    if (index + 1 >= deck.length) setDone(true);
    else setIndex((value) => value + 1);
  };

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "BUTTON")) {
        return;
      }
      if (target?.getAttribute("data-card") === "flip") return;
      if (event.key === " ") {
        event.preventDefault();
        setFlipped((value) => !value);
      } else if (event.key === "1") rateRef.current(false);
      else if (event.key === "2") rateRef.current(true);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const word = deck[index];

  return (
    <div className="page">
      <header className="lesson-head">
        <p className="kicker">Ôn lại</p>
        <h1>Thẻ nhớ</h1>
        <p className="lede">Nhìn một mặt, nhớ mặt kia, rồi tự chấm. Phím cách để lật, phím 1 là chưa thuộc, phím 2 là đã thuộc.</p>
      </header>
      <div className="filters">
        <span className="filter-label">Bài học</span>
        <button
          type="button"
          className={board === "lesson" && topicId === "all" ? "chip on" : "chip"}
          onClick={() => loadLesson("all", onlyUnknown)}
        >
          Tất cả
        </button>
        {topics.map((topic) => (
          <button
            key={topic.id}
            type="button"
            className={board === "lesson" && topicId === topic.id ? "chip on" : "chip"}
            onClick={() => loadLesson(topic.id, onlyUnknown)}
          >
            {topic.title}
          </button>
        ))}
        <span className="filter-label">HSK</span>
        {HSK_LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            className={board === level ? "chip on" : "chip"}
            onClick={() => loadHsk(level, onlyUnknown)}
          >
            HSK {level}
          </button>
        ))}
        <button type="button" className={onlyUnknown ? "chip on" : "chip"} onClick={() => reload(!onlyUnknown)}>
          Chỉ từ chưa thuộc
        </button>
        <button
          type="button"
          className={front === "vi" ? "chip on" : "chip"}
          onClick={() => setFront((value) => (value === "hanzi" ? "vi" : "hanzi"))}
        >
          {front === "hanzi" ? "Mặt trước: chữ" : "Mặt trước: nghĩa"}
        </button>
      </div>

      {deck.length === 0 ? (
        <div className="done-panel">
          <p className="hanzi-xl han" lang="zh-CN">
            好
          </p>
          <h2>{onlyUnknown ? "Bạn đã thuộc hết nhóm này." : "Nhóm này chưa có từ."}</h2>
          <button type="button" className="btn primary" onClick={() => reload(false)}>
            Xem mọi từ
          </button>
        </div>
      ) : done ? (
        <div className="done-panel">
          <p className="hanzi-xl han" lang="zh-CN">
            完
          </p>
          <h2>Hết bộ {deck.length} thẻ</h2>
          <div className="actions">
            <button type="button" className="btn primary" onClick={() => reload(onlyUnknown)}>
              Trộn lại
            </button>
            <button type="button" className="btn ghost" onClick={() => onQuiz(typeof board === "number" ? board : undefined)}>
              Sang kiểm tra
            </button>
          </div>
        </div>
      ) : (
        <div className="deck">
          <p className="muted">
            Thẻ {index + 1}/{deck.length}
          </p>
          <div
            className={flipped ? "card is-flipped" : "card"}
            data-card="flip"
            role="button"
            tabIndex={0}
            aria-label="Lật thẻ"
            onClick={() => setFlipped((value) => !value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setFlipped((value) => !value);
              }
            }}
          >
            <div className="card-inner">
              <div className="face front">
                {front === "hanzi" ? (
                  <p className="hanzi-xl han" lang="zh-CN">
                    {word.hanzi}
                  </p>
                ) : (
                  <p className="prompt-vi">{quizSense(word.vi)}</p>
                )}
                <small>Nhấn để lật</small>
              </div>
              <div className="face back">
                <p className="hanzi-xl han" lang="zh-CN">
                  {word.hanzi}
                </p>
                <Pinyin text={word.pinyin} />
                <p className="meaning">{word.vi}</p>
                {word.exampleVi ? <p className="gloss">{word.exampleVi}</p> : null}
              </div>
            </div>
          </div>
          <SpeakButton text={word.hanzi} label="Nghe chữ" />
          <div className="actions">
            <button type="button" className="btn" onClick={() => rateRef.current(false)}>
              Chưa thuộc
            </button>
            <button type="button" className="btn primary" onClick={() => rateRef.current(true)}>
              Đã thuộc
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
