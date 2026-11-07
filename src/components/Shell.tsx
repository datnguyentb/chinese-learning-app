import type { ReactNode } from "react";
import type { View } from "../types";

const NAV = [
  { name: "home", label: "Bàn học", short: "Học", icon: "学" },
  { name: "dict", label: "Từ điển", short: "Từ", icon: "典" },
  { name: "cards", label: "Thẻ nhớ", short: "Thẻ", icon: "卡" },
  { name: "tones", label: "Thanh điệu", short: "Thanh", icon: "声" },
  { name: "quiz", label: "Kiểm tra", short: "Thi", icon: "试" },
] as const;

function activeName(view: View) {
  if (view.name === "lesson") return "home";
  return view.name;
}

export function Shell({
  view,
  streak,
  knownCount,
  onNavigate,
  children,
}: {
  view: View;
  streak: number;
  knownCount: number;
  onNavigate: (view: View) => void;
  children: ReactNode;
}) {
  const active = activeName(view);
  const current = NAV.find((item) => item.name === active) ?? NAV[0];

  function open(name: (typeof NAV)[number]["name"]) {
    if (name === "quiz") onNavigate({ name: "quiz" });
    else if (name === "dict") onNavigate({ name: "dict", level: 1 });
    else onNavigate({ name });
  }

  return (
    <div className="app">
      <aside className="rail">
        <div className="brand">
          <div className="seal han">学</div>
          <div className="brand-text">
            <strong className="han" lang="zh-CN">
              学中文
            </strong>
            <span>Học tiếng Trung</span>
          </div>
        </div>
        <nav className="nav" aria-label="Mục chính">
          {NAV.map((item) => (
            <button
              key={item.name}
              type="button"
              className={item.name === active ? "nav-btn active" : "nav-btn"}
              aria-current={item.name === active ? "page" : undefined}
              onClick={() => open(item.name)}
            >
              <span className="han" lang="zh-CN">
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="rail-foot">
          <p>
            <b>{streak}</b> ngày liên tiếp
          </p>
          <p>
            <b>{knownCount}</b> từ đã thuộc
          </p>
        </div>
      </aside>
      <header className="mobile-bar">
        <span className="seal han">学</span>
        <span>{current.label}</span>
      </header>
      <main className="stage">{children}</main>
      <nav className="bottom-nav" aria-label="Mục chính">
        {NAV.map((item) => (
          <button
            key={item.name}
            type="button"
            className={item.name === active ? "active" : undefined}
            aria-current={item.name === active ? "page" : undefined}
            onClick={() => open(item.name)}
          >
            <span className="han" lang="zh-CN">
              {item.icon}
            </span>
            {item.short}
          </button>
        ))}
      </nav>
    </div>
  );
}
