import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import "./index.css";
import { registerServiceWorker } from "./lib/pwaUtils";
import { runMigrationIfNeeded } from "./lib/dataMigration";

runMigrationIfNeeded();

const container = document.getElementById("root");
if (!container) {
  throw new Error('Fursan could not start: #root is missing from index.html');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// The service worker owns the shell; the relay queue owns offline writes.
void registerServiceWorker();