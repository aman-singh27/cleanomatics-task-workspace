import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/dm-sans/700.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "@fontsource/manrope/800.css";
import "./styles.css";
import "./fallback.css";
import App from "./App";
import { AppErrorBoundary, RouteBoundary } from "./components/RouteBoundary";
try {
  const savedTheme = localStorage.getItem("cleanomatics-theme");
  document.documentElement.dataset.theme =
    savedTheme === "dark" ||
    (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)
      ? "dark"
      : "light";
} catch {
  document.documentElement.dataset.theme = "light";
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <RouteBoundary>
        <App />
      </RouteBoundary>
    </AppErrorBoundary>
  </React.StrictMode>,
);
