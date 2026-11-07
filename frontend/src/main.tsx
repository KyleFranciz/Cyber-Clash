import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { App } from "./App";
import { startGameLoop } from "./game/loop";

import "./styles/tokens.css";
import "./styles/stage.css";
import "./styles/office.css";
import "./styles/email.css";
import "./styles/results.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const container = document.getElementById("root");
if (!container) throw new Error("No #root element in index.html");

createRoot(container).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);

// The one game loop, started once, outside React (AGENTS.md rule 6). It is
// deliberately not in a component effect: StrictMode would double-invoke it,
// and the loop must outlive any single screen.
startGameLoop();
