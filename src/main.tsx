import React from "react";
import App from "./App";
import { createRoot } from "react-dom/client";

// CSS
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error(
    "Root element not found. Ensure there is a valid DOM element with id 'root'."
  );
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
