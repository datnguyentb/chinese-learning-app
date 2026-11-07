import { useState } from "react";
import { speakChinese } from "../lib/speech";

export function SpeakButton({ text, label = "Nghe" }: { text: string; label?: string }) {
  const [error, setError] = useState("");

  return (
    <span className="speak-wrap">
      <button
        type="button"
        className="speak"
        onClick={() => setError(speakChinese(text) ? "" : "Trình duyệt này không đọc được tiếng Trung.")}
      >
        <span className="han" aria-hidden="true">
          听
        </span>
        {label}
      </button>
      {error ? <span className="speak-error">{error}</span> : null}
    </span>
  );
}
