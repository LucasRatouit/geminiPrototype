import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
// import CharacterSheet from "./components/character-sheet";
// import ElysiaChronicles from "./components/elysia-chronicles";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    {/* <CharacterSheet /> */}
    {/* <ElysiaChronicles /> */}
  </StrictMode>,
);
