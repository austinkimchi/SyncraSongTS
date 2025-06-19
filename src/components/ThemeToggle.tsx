import React, { useEffect, useState } from "react";
import Button from "@mui/material/Button";

const ThemeToggle: React.FC = () => {
  const getPreferredTheme = (): "light" | "dark" => {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") return stored as "light" | "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  };

  const [theme, setTheme] = useState<"light" | "dark">(getPreferredTheme());

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggle = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <Button variant="outlined" size="small" onClick={toggle} style={{ marginLeft: "1em" }}>
      {theme === "light" ? "Dark" : "Light"} Mode
    </Button>
  );
};

export default ThemeToggle;
