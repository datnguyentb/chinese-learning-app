import { useState, type CSSProperties } from "react";
import { introCount, topics, wordOfDay, words } from "../data/curriculum";
import { HSK_LEVELS, hskTotal, searchHsk } from "../data/hsk";
import { Pinyin, ToneLegend } from "../lib/pinyin";
import { DAILY_GOAL, useProgress } from "../lib/progress";
import type { Topic, View } from "../types";
import { SpeakButton } from "./SpeakButton";

function greeting(now = new Date()) {
  const hour = now.getHours();
  if (hour < 11) return { zh: "早上好", vi: "Chào buổi sáng" };
  if (hour < 18) return { zh: "你好", vi: "Chào buổi học" };
  return { zh: "晚上好", vi: "Chào buổi tối" };
}

export function Home({ open }: { open: (view: View) => void }) {
  const { progress, knownCount, dailyCount, streak, isKnown, reset } = useProgress();
  const [query, setQuery] = useState("");
  const day = wordOfDay(words);
  const hello = greeting();
  const shownToday = Math.min(dailyCount, DAILY_GOAL);
  const percent = Math.round((shownToday / DAILY_GOAL) * 100);
  const needle = query.trim();
  const matches = needle.length === 0 ? [] : searchHsk(query);
  const results = matches.slice(0, 8);
  const nextTopic = topics.find((topic) => topic.words.some((word) => !isKnown(word.id))) ?? topics[0];

  return (
    <div className="page">
      <section className="hero">
        <p className="vertical han" lang="zh-CN">
          从零开始
        </p>
        <div>
          <p className="kicker">
            <span className="han" lang="zh-CN">
              {hello.zh}
            </span>
            {" · "}
            {hello.vi}
          </p>
          <h1>Học tiếng Trung</h1>
          <p className="lede">
            {topics.length} bài có câu ví dụ, {words.length} từ, cộng bộ HSK 1–6 với {hskTotal.toLocaleString("vi-VN")} từ.
            Phiên âm tô màu theo thanh, thẻ nhớ và bài kiểm tra. Tiến độ nằm trên máy này, không cần tài khoản.
          </p>
          <div className="stat-row">
            <p className="stat">
              <b>{knownCount}</b>
              <span>từ đã thuộc</span>
            </p>
            <p className="stat">
              <b>{streak}</b>
              <span>ngày liên tiếp</span>
            </p>
            <p className="stat">
              <b>{progress.xp}</b>
              <span>điểm kinh nghiệm</span>
            </p>
          </div>
          <div className="goal">
            <div className="ring" style={{ "--p": `${percent}%` } as CSSProperties}>
              <i>
                {shownToday}/{DAILY_GOAL}
              </i>
            </div>
            <div>
              <strong>Mục tiêu hôm nay</strong>
              <p>
                {dailyCount >= DAILY_GOAL
                  ? "Đủ bài rồi. Ngày mai học tiếp cũng được."
                  : `Còn ${DAILY_GOAL - dailyCount} từ để hoàn thành hôm nay.`}
              </p>
            </div>
          </div>
          <div className="actions hero-actions">
            <button
              type="button"
              className="btn primary"
              onClick={() => open({ name: "lesson", topicId: nextTopic.id })}
            >
              {knownCount === 0 ? "Bắt đầu bài 1" : `Học tiếp: ${nextTopic.title}`}
            </button>
            <button type="button" className="btn ghost" onClick={() => open({ name: "cards" })}>
              Ôn thẻ nhớ
            </button>
          </div>
          <ToneLegend />
        </div>
        <article className="day-card">
          <p className="kicker">Chữ hôm nay</p>
          <p className="hanzi-xl han" lang="zh-CN">
            {day.hanzi}
          </p>
          <Pinyin text={day.pinyin} />
          <p className="meaning">{day.vi}</p>
          <p className="muted">{day.topicTitle}</p>
          <SpeakButton text={day.hanzi} label="Nghe chữ" />
          <button
            type="button"
            className="btn"
            onClick={() => open({ name: "lesson", topicId: day.topicId, wordId: day.id })}
          >
            Học chữ này
          </button>
        </article>
      </section>

      <section className="panel">
        <div className="section-head">
          <h2>Tra từ vựng</h2>
          <button type="button" className="btn tiny" onClick={() => open({ name: "dict", level: 1 })}>
            Mở từ điển
          </button>
        </div>
        <div className="filters">
          {HSK_LEVELS.map((level) => (
            <button key={level} type="button" className="chip" onClick={() => open({ name: "dict", level })}>
              HSK {level}
            </button>
          ))}
        </div>
        <label className="search-label" htmlFor="word-search">
          Chữ Hán, pinyin không dấu hoặc tiếng Việt, trong cả bộ HSK
        </label>
        <input
          id="word-search"
          className="search"
          value={query}
          placeholder="Ví dụ: nihao, xin chào, 谢谢"
          onChange={(event) => setQuery(event.target.value)}
          autoComplete="off"
        />
        {needle.length > 0 ? (
          <div className="results">
            {results.length === 0 ? (
              <p className="muted">Không thấy từ này trong bộ HSK.</p>
            ) : (
              results.map((word) => (
                <button
                  key={word.id}
                  type="button"
                  className="result"
                  onClick={() => open({ name: "dict", id: word.id, query, level: 0 })}
                >
                  <span className="han" lang="zh-CN">
                    {word.hanzi}
                  </span>
                  <Pinyin text={word.pinyin} />
                  <span>
                    {word.level === 0 ? "Nhập môn" : `HSK ${word.level}`} · {word.vi}
                  </span>
                </button>
              ))
            )}
            {matches.length > results.length ? (
              <button
                type="button"
                className="text-btn"
                onClick={() => open({ name: "dict", query, level: 0 })}
              >
                Xem cả {matches.length.toLocaleString("vi-VN")} từ trong từ điển
              </button>
            ) : null}
          </div>
        ) : null}
      </section>

      <TopicSection
        title="Bảy bài nhập môn"
        list={topics.slice(0, introCount)}
        offset={0}
        open={open}
        isKnown={isKnown}
      />
      <TopicSection
        title="Chủ đề tiếp theo"
        list={topics.slice(introCount)}
        offset={introCount}
        open={open}
        isKnown={isKnown}
      />

      <section className="panel">
        <div className="section-head">
          <h2>Kiểm tra gần đây</h2>
          <button type="button" className="btn tiny" onClick={() => open({ name: "quiz" })}>
            Làm bài
          </button>
        </div>
        {progress.quizzes.length === 0 ? (
          <p className="muted">Làm một bài 8 câu khi bạn muốn nhớ lâu hơn.</p>
        ) : (
          <ul className="history">
            {progress.quizzes.slice(0, 4).map((quiz) => (
              <li key={quiz.at}>
                <span>
                  <b>
                    {quiz.correct}/{quiz.total}
                  </b>{" "}
                  {quiz.label}
                  <small>
                    {new Date(quiz.at).toLocaleString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </small>
                </span>
                <button
                  type="button"
                  className="btn tiny ghost"
                  onClick={() =>
                    open(quiz.hsk ? { name: "quiz", hsk: quiz.hsk } : { name: "quiz", topicId: quiz.topicId })
                  }
                >
                  Làm lại
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="footnote">
          Nút Nghe dùng giọng tiếng Trung có sẵn trên máy. Nếu máy im, hãy cài gói giọng Trung giản thể trong
          Windows.
        </p>
        <button
          type="button"
          className="text-btn"
          onClick={() => {
            if (window.confirm("Xóa toàn bộ tiến độ trên máy này?")) reset();
          }}
        >
          Xóa tiến độ trên máy
        </button>
      </section>
    </div>
  );
}

function TopicSection({
  title,
  list,
  offset,
  open,
  isKnown,
}: {
  title: string;
  list: Topic[];
  offset: number;
  open: (view: View) => void;
  isKnown: (id: string) => boolean;
}) {
  const count = list.reduce((sum, topic) => sum + topic.words.length, 0);
  return (
    <section>
      <div className="section-head">
        <h2>{title}</h2>
        <span className="muted">
          {list.length} bài · {count} từ
        </span>
      </div>
      <div className="topics">
        {list.map((topic, index) => {
          const known = topic.words.filter((word) => isKnown(word.id)).length;
          return (
            <button
              key={topic.id}
              type="button"
              className="topic"
              onClick={() => open({ name: "lesson", topicId: topic.id })}
            >
              <span className="ghost han" aria-hidden="true" lang="zh-CN">
                {topic.hanzi}
              </span>
              <small>Bài {String(offset + index + 1).padStart(2, "0")}</small>
              <strong>{topic.title}</strong>
              <em>{topic.blurb}</em>
              <span className="meta">
                {known}/{topic.words.length} từ thuộc
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
