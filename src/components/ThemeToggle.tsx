import React from "react";
import { Switch } from "@mui/material";

interface ThemeToggleProps {
  theme: "light" | "dark";
  toggle: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, toggle }) => (
  <div data-testid="theme-toggle-button">
    <Switch checked={theme === "dark"} onChange={toggle} />
  </div>
);

export default ThemeToggle;
