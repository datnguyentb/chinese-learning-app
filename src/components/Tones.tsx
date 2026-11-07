import { useState } from "react";
import { toneSamples, toneSets, type ToneNumber, type ToneSample } from "../data/tones";
import { shuffle } from "../lib/quiz";
import { Pinyin } from "../lib/pinyin";
import { useProgress } from "../lib/progress";
import { playCorrect } from "../lib/sound";
import { speakChinese } from "../lib/speech";
import { SpeakButton } from "./SpeakButton";

const TONE_KEYS: { tone: ToneNumber; label: string; hint: string }[] = [
  { tone: 1, label: "Thanh 1", hint: "cao, bằng" },
  { tone: 2, label: "Thanh 2", hint: "đi lên" },
  { tone: 3, label: "Thanh 3", hint: "hạ rồi lên" },
  { tone: 4, label: "Thanh 4", hint: "tụt mạnh" },
  { tone: 5, label: "Nhẹ", hint: "ngắn, không nhấn" },
];

const RULES = [
  {
    title: "Hai thanh 3",
    text: "Thanh đứng trước đổi thành thanh 2.",
    hanzi: "你好",
    book: "nǐ hǎo",
    said: "ní hǎo",
  },
  {
    title: "不 trước thanh 4",
    text: "bù đổi thành bú.",
    hanzi: "不客气",
    book: "bù kè qi",
    said: "bú kè qi",
  },
  {
    title: "一 trước thanh 4",
    text: "yī đổi thành yí. Trước thanh 1, 2 hoặc 3 thì đọc yì.",
    hanzi: "一个",
    book: "yī gè",
    said: "yí gè",
  },
];

function Contour({ tone }: { tone: ToneNumber }) {
  const path = {
    1: "M8 24 H112",
    2: "M10 62 C42 62 72 18 112 14",
    3: "M8 24 C28 24 40 64 60 64 C82 64 92 30 112 22",
    4: "M10 14 C42 18 74 42 112 68",
    5: "M48 40 H72",
  }[tone];
  return (
    <svg className={`contour tone-stroke-${tone}`} viewBox="0 0 120 80" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

function newRound() {
  return shuffle(toneSamples).slice(0, 5);
}

export function Tones() {
  const { review } = useProgress();
  const [round, setRound] = useState<ToneSample[]>(newRound);
  const [step, setStep] = useState(0);
  const [chosen, setChosen] = useState<ToneNumber | null>(null);
  const [hits, setHits] = useState(0);
  const [finished, setFinished] = useState(false);
  const [saved, setSaved] = useState(false);
  const [speechError, setSpeechError] = useState("");
  const current = round[step];

  function play(text: string) {
    setSpeechError(speakChinese(text) ? "" : "Trình duyệt này không đọc được tiếng Trung.");
  }

  function choose(tone: ToneNumber) {
    if (chosen !== null || finished) return;
    setChosen(tone);
    if (tone === current.tone) {
      playCorrect();
      setHits((value) => value + 1);
    }
  }

  function next() {
    if (step + 1 >= round.length) {
      setFinished(true);
      if (!saved) {
        setSaved(true);
        review("tone-practice");
      }
      return;
    }
    setStep((value) => value + 1);
    setChosen(null);
  }

  function restart() {
    setRound(newRound());
    setStep(0);
    setChosen(null);
    setHits(0);
    setFinished(false);
    setSaved(false);
  }

  return (
    <div className="page">
      <header className="lesson-head">
        <p className="kicker">Bốn thanh và thanh nhẹ</p>
        <h1>Thanh điệu</h1>
        <p className="lede">
          Cùng một âm, khác thanh là khác nghĩa. Bấm để nghe, rồi làm bài nghe-chọn bên dưới.
        </p>
      </header>

      {toneSets.map((set) => (
        <section key={set.id} className="panel tone-block">
          <h2>{set.title}</h2>
          <div className={set.id === "ma" ? "tone-grid" : "tone-row"}>
            {set.samples.map((sample) => (
              <button
                key={sample.id}
                type="button"
                className="tone-card"
                onClick={() => play(sample.hanzi)}
              >
                {set.id === "ma" ? <Contour tone={sample.tone} /> : null}
                <span className="han" lang="zh-CN">
                  {sample.hanzi}
                </span>
                <Pinyin text={sample.pinyin} />
                <small>{sample.vi}</small>
              </button>
            ))}
          </div>
        </section>
      ))}

      <section className="panel">
        <h2>Đổi thanh hay gặp</h2>
        <div className="rules">
          {RULES.map((rule) => (
            <article key={rule.hanzi} className="rule">
              <p className="kicker">{rule.title}</p>
              <p className="han rule-han" lang="zh-CN">
                {rule.hanzi}
              </p>
              <p>{rule.text}</p>
              <p>
                Từ điển <Pinyin text={rule.book} />
              </p>
              <p>
                Khi nói <Pinyin text={rule.said} />
              </p>
              <SpeakButton text={rule.hanzi} label="Nghe cách nói" />
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <h2>Nghe và chọn thanh</h2>
          {!finished ? (
            <span className="muted">
              Câu {step + 1}/{round.length}
            </span>
          ) : null}
        </div>
        {finished ? (
          <div className="done-panel">
            <p className="hanzi-xl han" lang="zh-CN">
              {hits === round.length ? "对" : "再"}
            </p>
            <h2>
              {hits}/{round.length} thanh đúng
            </h2>
            <button type="button" className="btn primary" onClick={restart}>
              Làm bộ khác
            </button>
          </div>
        ) : (
          <div className="drill">
            <button type="button" className="btn primary listen" onClick={() => play(current.hanzi)}>
              <span className="han" aria-hidden="true">
                听
              </span>
              Nghe âm
            </button>
            <p className="muted">Chưa hiện chữ. Hãy nghe trước, rồi chọn thanh.</p>
            {speechError ? <p className="speak-error">{speechError}</p> : null}
            <div className="tone-keys">
              {TONE_KEYS.map((item) => {
                const revealed = chosen !== null;
                const right = revealed && item.tone === current.tone;
                const wrong = revealed && chosen === item.tone && item.tone !== current.tone;
                return (
                  <button
                    key={item.tone}
                    type="button"
                    className={right ? "choice is-right" : wrong ? "choice is-wrong" : "choice"}
                    onClick={() => choose(item.tone)}
                    disabled={revealed}
                  >
                    <b>{item.label}</b>
                    <small>{item.hint}</small>
                  </button>
                );
              })}
            </div>
            {chosen !== null ? (
              <div className="reveal">
                <p className="hanzi-xl han" lang="zh-CN">
                  {current.hanzi}
                </p>
                <Pinyin text={current.pinyin} />
                <p className="meaning">{current.vi}</p>
                <p className="feedback">{chosen === current.tone ? "Đúng thanh." : "Chưa đúng. Nghe lại chữ vừa hiện."}</p>
                <div className="actions">
                  <SpeakButton text={current.hanzi} label="Nghe lại" />
                  <button type="button" className="btn primary" onClick={next}>
                    {step + 1 === round.length ? "Xem kết quả" : "Câu tiếp"}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
