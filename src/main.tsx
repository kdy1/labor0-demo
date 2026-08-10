import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ReleaseStatusCard } from "./ReleaseStatusCard";
import { releaseStatus } from "./releaseStatus";
import "./styles.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Expected a root element.");
}

createRoot(root).render(
  <StrictMode>
    <main className="app-shell">
      <ReleaseStatusCard status={releaseStatus} />
    </main>
  </StrictMode>,
);

