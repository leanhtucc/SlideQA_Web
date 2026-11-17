import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "src/assets/css/tokens.css";
import "src/assets/css/index.css";
import App from "src/App/App";
import { initTheme } from "src/helpers/theme";

initTheme(); // trước khi vẽ để không chớp giao diện sáng rồi mới sang tối

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
