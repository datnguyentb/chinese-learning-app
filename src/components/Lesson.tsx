import { useState } from "react";
import { findTopic, topicNumber } from "../data/curriculum";
import { Pinyin, ToneLegend } from "../lib/pinyin";
import { useProgress } from "../lib/progress";
import { SpeakButton } from "./SpeakButton";

export function Lesson({
  topicId,
  wordId,
  onBack,
  onQuiz,
}: {
  topicId: string;
  wordId?: string;
  onBack: () => void;
  onQuiz: () => void;
}) {
  const topic = findTopic(topicId);
  const { isKnown, mark } = useProgress();
  const start = topic && wordId ? topic.words.findIndex((word) => word.id === wordId) : 0;
  const [index, setIndex] = useState(start >= 0 ? start : 0);

  if (!topic) {
    return (
      <div className="page">
        <button type="button" className="back" onClick={onBack}>
          ← Bàn học
        </button>
        <p>Không thấy bài học này.</p>
      </div>
    );
  }

  const word = topic.words[index];
  const known = isKnown(word.id);
  const number = String(topicNumber(topic.id)).padStart(2, "0");

  return (
    <div className="page">
      <button type="button" className="back" onClick={onBack}>
        ← Bàn học
      </button>
      <header className="lesson-head">
        <p className="kicker">
          Bài {number} · {topic.words.length} từ
        </p>
        <h1>{topic.title}</h1>
        <p className="lede">{topic.blurb}</p>
      </header>
      <p className="tip">{topic.tip}</p>
      <ToneLegend />
      <div
        className="bar"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={topic.words.length}
        aria-valuenow={index + 1}
        aria-label="Vị trí trong bài"
      >
        <span style={{ width: `${((index + 1) / topic.words.length) * 100}%` }} />
      </div>
      <div className="lesson-grid">
        <div className="word-list">
          {topic.words.map((item, itemIndex) => (
            <button
              key={item.id}
              type="button"
              className={itemIndex === index ? "word-btn active" : "word-btn"}
              onClick={() => setIndex(itemIndex)}
            >
              <span className={isKnown(item.id) ? "dot on" : "dot"} />
              <span className="han" lang="zh-CN">
                {item.hanzi}
              </span>
              <small>{item.vi}</small>
            </button>
          ))}
        </div>
        <article className={known ? "study is-known" : "study"}>
          <p className="kicker">
            Từ {index + 1}/{topic.words.length}
          </p>
          <div className="study-main">
            <p className="hanzi-xl han" lang="zh-CN">
              {word.hanzi}
            </p>
            <Pinyin text={word.pinyin} />
            <p className="meaning">{word.vi}</p>
            <SpeakButton text={word.hanzi} label="Nghe từ" />
          </div>
          {word.note ? <p className="note">{word.note}</p> : null}
          <div className="example">
            <p className="han" lang="zh-CN">
              {word.example}
            </p>
            <Pinyin text={word.examplePinyin} />
            <p className="gloss">{word.exampleVi}</p>
            <SpeakButton text={word.example} label="Nghe câu" />
          </div>
          <div className="actions">
            <button type="button" className={known ? "btn" : "btn primary"} onClick={() => mark(word.id, !known)}>
              {known ? "Bỏ đánh dấu" : "Đã thuộc"}
            </button>
            <div className="actions-right">
              <button type="button" className="btn ghost" disabled={index === 0} onClick={() => setIndex(index - 1)}>
                Trước
              </button>
              {index < topic.words.length - 1 ? (
                <button type="button" className="btn primary" onClick={() => setIndex(index + 1)}>
                  Tiếp
                </button>
              ) : (
                <button type="button" className="btn primary" onClick={onQuiz}>
                  Kiểm tra bài này
                </button>
              )}
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
