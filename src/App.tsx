import { useEffect, useState } from "react";
import { Dictionary } from "./components/Dictionary";
import { Flashcards } from "./components/Flashcards";
import { Home } from "./components/Home";
import { Lesson } from "./components/Lesson";
import { Quiz } from "./components/Quiz";
import { Shell } from "./components/Shell";
import { Tones } from "./components/Tones";
import { useProgress } from "./lib/progress";
import type { View } from "./types";

const TITLES: Record<View["name"], string> = {
  home: "Bàn học",
  lesson: "Bài học",
  dict: "Từ điển",
  cards: "Thẻ nhớ",
  tones: "Thanh điệu",
  quiz: "Kiểm tra",
};

export function App() {
  const [view, setView] = useState<View>({ name: "home" });
  const { streak, knownCount } = useProgress();

  useEffect(() => {
    document.title = `${TITLES[view.name]} · Học tiếng Trung`;
  }, [view]);

  return (
    <Shell view={view} streak={streak} knownCount={knownCount} onNavigate={setView}>
      {view.name === "home" && <Home open={setView} />}
      {view.name === "lesson" && (
        <Lesson
          key={`${view.topicId}:${view.wordId ?? ""}`}
          topicId={view.topicId}
          wordId={view.wordId}
          onBack={() => setView({ name: "home" })}
          onQuiz={() => setView({ name: "quiz", topicId: view.topicId })}
        />
      )}
      {view.name === "dict" && (
        <Dictionary
          key={`${view.level ?? 0}:${view.query ?? ""}:${view.id ?? ""}`}
          level={view.level}
          query={view.query}
          id={view.id}
          onStudy={(level) => setView(level >= 1 ? { name: "cards", hsk: level } : { name: "cards" })}
          onQuiz={(level) => setView(level >= 1 ? { name: "quiz", hsk: level } : { name: "quiz" })}
          onOpenLesson={(topicId, wordId) => setView({ name: "lesson", topicId, wordId })}
        />
      )}
      {view.name === "cards" && (
        <Flashcards
          key={view.hsk ?? "lesson"}
          hsk={view.hsk}
          onQuiz={(level) => setView(level ? { name: "quiz", hsk: level } : { name: "quiz" })}
        />
      )}
      {view.name === "tones" && <Tones />}
      {view.name === "quiz" && (
        <Quiz
          key={`${view.hsk ?? ""}:${view.topicId ?? "lesson"}`}
          topicId={view.topicId}
          hsk={view.hsk}
          onPool={(next) => setView({ name: "quiz", ...next })}
          onOpenWord={(word) => {
            if (word.id.startsWith("hsk")) {
              setView({ name: "dict", id: word.id, level: view.hsk });
              return;
            }
            if (word.topicId) setView({ name: "lesson", topicId: word.topicId, wordId: word.id });
          }}
        />
      )}
    </Shell>
  );
}
