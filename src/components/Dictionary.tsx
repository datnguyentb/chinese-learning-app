import { useMemo, useState } from "react";
import { HSK_LEVELS, hskById, hskByLevel, hskTotal, searchHsk, vocabTotal, type HskEntry } from "../data/hsk";
import { Pinyin } from "../lib/pinyin";
import { useProgress } from "../lib/progress";
import { SpeakButton } from "./SpeakButton";

const PAGE = 40;

export function Dictionary({
  level: initialLevel = 0,
  query: initialQuery = "",
  id: initialId,
  onStudy,
  onQuiz,
  onOpenLesson,
}: {
  level?: number;
  query?: string;
  id?: string;
  onStudy: (level: number) => void;
  onQuiz: (level: number) => void;
  onOpenLesson: (topicId: string, wordId: string) => void;
}) {
  const { isKnown, mark } = useProgress();
  const [level, setLevel] = useState(initialLevel >= 1 && initialLevel <= 6 ? initialLevel : 0);
  const [query, setQuery] = useState(initialQuery);
  const [selectedId, setSelectedId] = useState(initialId);
  const [pageState, setPageState] = useState({ key: "", page: 0 });

  const filterKey = `${level}:${query.trim()}`;
  const page = pageState.key === filterKey ? pageState.page : 0;
  const matches = useMemo(() => searchHsk(query, level || undefined), [query, level]);
  const pages = Math.max(1, Math.ceil(matches.length / PAGE));
  const safePage = Math.min(page, pages - 1);
  const slice = matches.slice(safePage * PAGE, safePage * PAGE + PAGE);
  const selected: HskEntry | undefined = (selectedId ? hskById.get(selectedId) : undefined) ?? slice[0];

  function setPage(next: number) {
    setPageState({ key: filterKey, page: next });
  }

  function pickLevel(next: number) {
    setLevel(next);
    setSelectedId(undefined);
  }

  return (
    <div className="page">
      <header className="lesson-head">
        <p className="kicker">HSK 1 – HSK 6</p>
        <h1>Từ điển</h1>
        <p className="lede">
          {hskTotal.toLocaleString("vi-VN")} từ của đề HSK cũ, chia sáu cấp, cộng các cụm trong bài nhập môn.
          Gõ chữ Hán, pinyin không dấu hoặc tiếng Việt.
        </p>
      </header>
      <div className="filters" role="tablist" aria-label="Cấp HSK">
        <button type="button" className={level === 0 ? "chip on" : "chip"} onClick={() => pickLevel(0)}>
          Tất cả · {vocabTotal.toLocaleString("vi-VN")}
        </button>
        {HSK_LEVELS.map((item) => (
          <button
            key={item}
            type="button"
            className={level === item ? "chip on" : "chip"}
            onClick={() => pickLevel(item)}
          >
            HSK {item} · {hskByLevel[item].length}
          </button>
        ))}
      </div>
      <label className="search-label" htmlFor="dict-search">
        Tìm trong {level === 0 ? "mọi cấp" : `HSK ${level}`}
      </label>
      <input
        id="dict-search"
        className="search"
        value={query}
        placeholder="Ví dụ: nihao, ngân hàng, 爱"
        onChange={(event) => {
          setQuery(event.target.value);
          setSelectedId(undefined);
        }}
        autoComplete="off"
      />
      <p className="muted dict-count">
        {matches.length.toLocaleString("vi-VN")} từ
        {query.trim() ? ` khớp “${query.trim()}”` : ""}
      </p>
      <div className="dict-layout">
        <div>
          {slice.length === 0 ? (
            <p className="muted">
              Không thấy từ này trong {level === 0 ? "từ điển" : `HSK ${level}`}.{" "}
              {level !== 0 ? (
                <button type="button" className="text-btn inline" onClick={() => pickLevel(0)}>
                  Tìm trong mọi cấp
                </button>
              ) : (
                "Thử bỏ dấu."
              )}
            </p>
          ) : (
            <div className="dict-list">
              {slice.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className={selected?.id === entry.id ? "dict-row on" : "dict-row"}
                  onClick={() => setSelectedId(entry.id)}
                  aria-current={selected?.id === entry.id ? "true" : undefined}
                >
                  <span className="level-num">{entry.level === 0 ? "N" : entry.level}</span>
                  <span className="han" lang="zh-CN">
                    {entry.hanzi}
                    {isKnown(entry.id) ? <i className="known-dot" title="Đã thuộc" /> : null}
                  </span>
                  <Pinyin text={entry.pinyin} />
                  <span className="vi">{entry.vi}</span>
                </button>
              ))}
            </div>
          )}
          {pages > 1 ? (
            <div className="pager">
              <button type="button" className="btn tiny" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
                Trước
              </button>
              <span>
                Trang {safePage + 1}/{pages}
              </span>
              <button
                type="button"
                className="btn tiny"
                disabled={safePage + 1 >= pages}
                onClick={() => setPage(safePage + 1)}
              >
                Sau
              </button>
            </div>
          ) : null}
        </div>
        {selected ? (
          <article className="dict-detail">
            <span className="badge">{selected.level === 0 ? "Nhập môn" : `HSK ${selected.level}`}</span>
            <p className="hanzi-xl han" lang="zh-CN">
              {selected.hanzi}
            </p>
            <Pinyin text={selected.pinyin} />
            <p className="meaning">{selected.vi}</p>
            {selected.topicTitle ? <p className="muted">Trong bài {selected.topicTitle}</p> : null}
            <SpeakButton text={selected.hanzi} label="Nghe chữ" />
            <div className="actions">
              <button type="button" className="btn" onClick={() => mark(selected.id, !isKnown(selected.id))}>
                {isKnown(selected.id) ? "Bỏ đánh dấu thuộc" : "Đánh dấu đã thuộc"}
              </button>
              {selected.topicId ? (
                <button type="button" className="btn primary" onClick={() => onOpenLesson(selected.topicId!, selected.id)}>
                  Học trong bài
                </button>
              ) : null}
              <button type="button" className="btn primary" onClick={() => onStudy(selected.level)}>
                {selected.level === 0 ? "Ôn thẻ nhập môn" : `Ôn thẻ HSK ${selected.level}`}
              </button>
              <button type="button" className="btn ghost" onClick={() => onQuiz(selected.level)}>
                {selected.level === 0 ? "Kiểm tra nhập môn" : `Kiểm tra HSK ${selected.level}`}
              </button>
            </div>
          </article>
        ) : null}
      </div>
      <p className="credit">
        Bộ từ HSK 2.0, cấp 1 đến 6. Nghĩa tiếng Việt lấy từ{" "}
        <a href="https://github.com/ph0ngp/CVDICT" target="_blank" rel="noreferrer">
          CVDICT
        </a>{" "}
        của Phong Phan, chuyển từ{" "}
        <a href="https://cc-cedict.org/wiki/" target="_blank" rel="noreferrer">
          CC-CEDICT
        </a>
        , giấy phép CC BY-SA 4.0.
      </p>
    </div>
  );
}
