import React, { useEffect, useState, useCallback } from "react";
import {
  DialogContentText,
  IconButton,
  Menu,
  MenuItem,
  ThemeProvider,
  createTheme,
  ListItemIcon,
  ListItemText,
  Divider
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";
import BrightnessMediumIcon from "@mui/icons-material/BrightnessMedium";
import LoginIcon from "@mui/icons-material/Login";
import Platform, { getPlatformDisplayName, getPlatformInfo, getPlatformLogo, getPlatformOAuthFunction } from "../types/platform";

import { API_FULL_URL, APP_FULL_URL } from "../config";

const buttonTheme = createTheme({
  typography: { fontFamily: "Fort" },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          fontFamily: "Fort",
          fontSize: "24px",
          color: "rgb(100, 108, 255)",
          textTransform: "none",
        },
      },
    },
  },
});

// Minimal fetch helper that always includes cookies
async function api(path: string, init: RequestInit = {}) {
  if (!path.startsWith("/"))
    path = `/${path}`;

  const token = localStorage.getItem("token");
  if (token) {
    init.headers = {
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
    };
  }

  const res = await fetch(`${API_FULL_URL}${path}`, {
    credentials: "omit",
    ...init,


  });
  return res;
}

interface AccountInfo {
  userID: string;
  displayName?: string;
  apple_status?: number;
  spotify_status?: number;
  soundcloud_status?: number;
  providers?: Platform[];
}

interface AccountProps {
}

const Account: React.FC<AccountProps> = ({ }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [error, setError] = useState<string>("");
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      document.documentElement.setAttribute("data-theme", savedTheme);
      return savedTheme;
    }
    // Default to browser preference
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const defaultTheme = prefersDark ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", defaultTheme);
    return defaultTheme;
  });

  const open = Boolean(anchorEl);
  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  // OAuth start: redirect to backend, which will redirect to provider
  const startOAuth = (provider: Platform) => {
    const redirect = getPlatformOAuthFunction(provider);
    if (redirect) {
      redirect()
        .catch((e) => {
          setError(`Failed to start ${getPlatformDisplayName(provider)} login: ${e.message}`);
        });
      return;
    }
  };

  const fetchSessionAndInfo = useCallback(async () => {
    try {
      // const sessRes = await api("/auth/session");
      // if (!sessRes.ok) {
      //   setAccount(null);
      //   return;
      // }

      const infoRes = await api("/auth/users/info");
      if (!infoRes.ok) {
        setAccount(null);
        return;
      }
      const data: AccountInfo = await infoRes.json().then(res => res.user);
      setAccount(data);
      console.log("Fetched account info:", data);
      setError("");
    } catch (e) {
      setError("Failed to load account. Servers may not be responding.");
      setAccount(null);
    }
  }, []);

  useEffect(() => {
    fetchSessionAndInfo();
    // Re-run when we return from an OAuth callback (URL changes) or custom event
    const onAuthChanged = () => fetchSessionAndInfo();
    window.addEventListener("auth-changed", onAuthChanged);
    return () => window.removeEventListener("auth-changed", onAuthChanged);
  }, [fetchSessionAndInfo]);

  const handleLogout = async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch { }
    setAccount(null);
    // Clear any old cached UI data you still keep around
    localStorage.removeItem("user_data");
    localStorage.removeItem("apple-playlists");
    localStorage.removeItem("spotify-playlists");
    localStorage.removeItem("token");
    localStorage.removeItem("spotify-profile");
    sessionStorage.clear();
    window.dispatchEvent(new Event("auth-changed"));
    // Soft refresh to reset any protected views
    setTimeout(() => window.location.reload(), 150);
  };

  // Menu content when NOT logged in: show Login with <providers>
  const UnauthedMenu = (
    <>
      <MenuItem>
        <ListItemIcon><LoginIcon fontSize="small" /></ListItemIcon>
        <ListItemText primary="Legacy Login" />
      </MenuItem>
      <Divider />
      {(Object.values(Platform) as Array<(typeof Platform)[keyof typeof Platform]>).map(p => (
        <MenuItem key={p} onClick={() => { handleMenuClose(); startOAuth(p); }}>
          <img src={getPlatformLogo(p)} alt={getPlatformDisplayName(p)} className="w-[20px] aspect-square mr-[16px]" />
          {getPlatformInfo(p).loginLabel}
        </MenuItem>
      ))}
      {error && (
        <>
          <Divider />
          <MenuItem disabled>
            <DialogContentText style={{ color: "red" }}>{error}</DialogContentText>
          </MenuItem>
        </>
      )}
    </>
  );

  const toggleTheme = () => {
    setTheme((prev) => {
      console.log("Toggling theme from", prev);
      const newTheme = prev === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);
      return newTheme;
    });
  };

  // Menu content when logged in: settings / theme / logout
  const AuthedMenu = (
    <>
      <MenuItem disabled>
        <ListItemIcon><AccountCircleIcon fontSize="small" /></ListItemIcon>
        <ListItemText
          primary={account?.displayName || account?.userID || "Account"}
          secondary={(account?.providers || []).join(", ")}
        />
      </MenuItem>
      <Divider />

      <MenuItem onClick={handleMenuClose}>
        <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
        <ListItemText primary="Settings" />
      </MenuItem>

      <MenuItem onClick={toggleTheme}>
        <ListItemIcon><BrightnessMediumIcon fontSize="small" /> </ListItemIcon>
        <ListItemText primary={theme == "dark" ? "Light Mode" : "Dark Mode"} />
      </MenuItem>
      <Divider />
      <MenuItem
        onClick={() => {
          handleMenuClose();
          handleLogout();
        }}
      >
        <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
        <ListItemText primary="Logout" />
      </MenuItem>
      {error && (
        <>
          <Divider />
          <MenuItem disabled>
            <DialogContentText style={{ color: "red" }}>{error}</DialogContentText>
          </MenuItem>
        </>
      )}
    </>
  );

  return (
    <ThemeProvider theme={buttonTheme}>
      <IconButton onClick={handleMenuOpen} color="inherit" aria-label="account">
        <div data-testid="account-avatar">
          <AccountCircleIcon />
        </div>
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={handleMenuClose}>
        {account ? AuthedMenu : UnauthedMenu}
      </Menu>
    </ThemeProvider>
  );
};

export default Account;
