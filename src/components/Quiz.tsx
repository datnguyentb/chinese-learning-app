import { useEffect, useRef, useState } from "react";
import { findTopic, words } from "../data/curriculum";
import { HSK_LEVELS, hskByLevel, quizSense, type HskLevel } from "../data/hsk";
import { buildQuiz, type QuizQuestion, type QuizWord } from "../lib/quiz";
import { Pinyin } from "../lib/pinyin";
import { useProgress } from "../lib/progress";
import { playCorrect } from "../lib/sound";
import { speakOnce } from "../lib/speech";
import { SpeakButton } from "./SpeakButton";

function poolFor(topicId?: string, hsk?: number): { pool: QuizWord[]; label: string; missing: boolean } {
  if (hsk && hsk >= 1 && hsk <= 6) {
    return { pool: hskByLevel[hsk as HskLevel], label: `HSK ${hsk}`, missing: false };
  }
  if (topicId) {
    const topic = findTopic(topicId);
    if (!topic) return { pool: [], label: "", missing: true };
    return {
      pool: words.filter((word) => word.topicId === topic.id),
      label: topic.title,
      missing: false,
    };
  }
  return { pool: words, label: "Mọi bài học", missing: false };
}

export function Quiz({
  topicId,
  hsk,
  onOpenWord,
  onPool,
}: {
  topicId?: string;
  hsk?: number;
  onOpenWord: (word: QuizWord) => void;
  onPool: (next: { topicId?: string; hsk?: number }) => void;
}) {
  const { pool, label, missing } = poolFor(topicId, hsk);
  const { review, addQuiz } = useProgress();
  const [questions, setQuestions] = useState<QuizQuestion[]>(() => buildQuiz(pool, 8));
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [log, setLog] = useState<{ word: QuizWord; ok: boolean }[]>([]);
  const [phase, setPhase] = useState<"ask" | "result">("ask");
  const [showPinyin, setShowPinyin] = useState(true);
  const savedRef = useRef(false);
  const question = missing ? undefined : questions[step];

  useEffect(() => {
    if (phase !== "ask" || !question || question.mode !== "hanzi-to-vi") return;
    speakOnce(question.word.hanzi);
  }, [phase, step, question]);

  if (missing) {
    return (
      <div className="page">
        <h1>Không thấy bài này</h1>
      </div>
    );
  }

  const correctCount = log.filter((item) => item.ok).length;

  function choose(choice: string) {
    if (!question || picked) return;
    const ok = choice === question.answer;
    if (ok) playCorrect();
    setPicked(choice);
    setLog((items) => [...items, { word: question.word, ok }]);
    review(question.word.id);
  }

  function next() {
    if (step + 1 >= questions.length) {
      if (!savedRef.current) {
        savedRef.current = true;
        addQuiz({
          correct: log.filter((item) => item.ok).length,
          total: questions.length,
          label,
          topicId: hsk ? undefined : topicId,
          hsk,
        });
      }
      setPhase("result");
      return;
    }
    setStep((value) => value + 1);
    setPicked(null);
  }

  function restart() {
    savedRef.current = false;
    setQuestions(buildQuiz(pool, 8));
    setStep(0);
    setPicked(null);
    setLog([]);
    setPhase("ask");
  }

  const chips = (
    <div className="filters">
      <button type="button" className={!hsk && !topicId ? "chip on" : "chip"} onClick={() => onPool({})}>
        Mọi bài học
      </button>
      {HSK_LEVELS.map((level) => (
        <button
          key={level}
          type="button"
          className={hsk === level ? "chip on" : "chip"}
          onClick={() => onPool({ hsk: level })}
        >
          HSK {level}
        </button>
      ))}
    </div>
  );

  if (phase === "result") {
    const perfect = correctCount === questions.length;
    const misses = log.filter((item) => !item.ok);
    return (
      <div className="page">
        <header className="lesson-head">
          <p className="kicker">{label}</p>
          <h1>Kết quả</h1>
        </header>
        {chips}
        <div className="done-panel">
          <p className="score-seal han" lang="zh-CN">
            {perfect ? "满分" : correctCount >= questions.length * 0.6 ? "好" : "再来"}
          </p>
          <h2>
            {correctCount}/{questions.length} câu đúng
          </h2>
          <p className="muted">{perfect ? "Bài này đã nằm trong tay bạn." : "Ôn lại các từ bên dưới rồi làm lại."}</p>
          <div className="actions">
            <button type="button" className="btn primary" onClick={restart}>
              Làm bài mới
            </button>
          </div>
        </div>
        {misses.length > 0 ? (
          <section className="panel">
            <h2>Từ cần xem lại</h2>
            <div className="results">
              {misses.map((item) => (
                <button key={item.word.id} type="button" className="result" onClick={() => onOpenWord(item.word)}>
                  <span className="han" lang="zh-CN">
                    {item.word.hanzi}
                  </span>
                  <Pinyin text={item.word.pinyin} />
                  <span>{item.word.vi}</span>
                </button>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    );
  }

  return (
    <div className="page">
      <header className="lesson-head">
        <p className="kicker">{label}</p>
        <h1>Kiểm tra</h1>
        <p className="lede">
          Câu {step + 1}/{questions.length}. Một nửa nhìn chữ chọn nghĩa, một nửa nhìn nghĩa chọn chữ.
        </p>
      </header>
      {chips}
      <div className="filters">
        <button type="button" className={showPinyin ? "chip on" : "chip"} onClick={() => setShowPinyin((value) => !value)}>
          {showPinyin ? "Đang hiện pinyin" : "Đang ẩn pinyin"}
        </button>
      </div>
      {question ? (
        <article className="study quiz-card">
          <div
            className="bar"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={questions.length}
            aria-valuenow={step + 1}
          >
            <span style={{ width: `${((step + 1) / questions.length) * 100}%` }} />
          </div>
          {question.mode === "hanzi-to-vi" ? (
            <div className="study-main">
              <p className="hanzi-xl han" lang="zh-CN">
                {question.word.hanzi}
              </p>
              {showPinyin ? <Pinyin text={question.word.pinyin} /> : null}
              <p>Nghĩa tiếng Việt là gì?</p>
              <SpeakButton text={question.word.hanzi} label="Nghe chữ" />
            </div>
          ) : (
            <div className="study-main">
              <p className="prompt-vi">{quizSense(question.word.vi)}</p>
              <p>Chữ Hán nào đúng?</p>
            </div>
          )}
          <div className="choices">
            {question.choices.map((choice) => {
              const right = picked !== null && choice === question.answer;
              const wrong = picked === choice && choice !== question.answer;
              return (
                <button
                  key={choice}
                  type="button"
                  className={
                    right
                      ? "choice is-right"
                      : wrong
                        ? "choice is-wrong"
                        : question.mode === "vi-to-hanzi"
                          ? "choice choice-han han"
                          : "choice"
                  }
                  onClick={() => choose(choice)}
                  disabled={picked !== null}
                >
                  {choice}
                </button>
              );
            })}
          </div>
          {picked ? (
            <div className="reveal">
              <p className="feedback" aria-live="polite">
                {picked === question.answer ? "Đúng." : `Đáp án là ${question.answer}.`}
              </p>
              <p className="gloss">
                <span className="han" lang="zh-CN">
                  {question.word.hanzi}
                </span>{" "}
                <Pinyin text={question.word.pinyin} /> · {question.word.vi}
              </p>
              <button type="button" className="btn primary" onClick={next}>
                {step + 1 === questions.length ? "Xem kết quả" : "Câu tiếp"}
              </button>
            </div>
          ) : null}
        </article>
      ) : null}
    </div>
  );
}
