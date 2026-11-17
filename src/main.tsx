import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "src/assets/css/tokens.css";
import "src/assets/css/index.css";
import App from "src/App/App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
