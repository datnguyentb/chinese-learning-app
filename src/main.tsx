import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { ProgressProvider } from "./lib/progress";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("Thiếu #root");

createRoot(root).render(
  <StrictMode>
    <ProgressProvider>
      <App />
    </ProgressProvider>
  </StrictMode>,
);
