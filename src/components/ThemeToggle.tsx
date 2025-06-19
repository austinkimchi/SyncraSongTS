import React from "react";
import { Switch } from "@mui/material";

interface ThemeToggleProps {
  theme: "light" | "dark";
  toggle: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, toggle }) => (
  <Switch checked={theme === "dark"} onChange={toggle} />
);

export default ThemeToggle;
