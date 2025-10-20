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
  Divider,
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";
import BrightnessMediumIcon from "@mui/icons-material/BrightnessMedium";
import LoginIcon from "@mui/icons-material/Login";
import ThemeToggle from "./ThemeToggle";
import Platform, { getPlatformDisplayName, getPlatformInfo, getPlatformLogo, getPlatformOAuthFunction } from "../types/platform";

import { APP_FULL_URL } from "../config";

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
  const res = await fetch(`${APP_FULL_URL}${path}`, {
    credentials: "include",
    ...init,
  });
  return res;
}

interface AccountInfo {
  userId: string;
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
      // 1) Optional: ping session to see if we’re logged in
      const sessRes = await api("/auth/session");
      if (!sessRes.ok) {
        setAccount(null);
        return;
      }

      // 2) Get richer account info (provider statuses)
      const infoRes = await api("/auth/users/info");
      if (!infoRes.ok) {
        setAccount(null);
        return;
      }
      const data: AccountInfo = await infoRes.json();
      setAccount(data);

      // Keep your existing downstream expectations:
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

  // Menu content when logged in: settings / theme / logout
  const AuthedMenu = (
    <>
      <MenuItem disabled>
        <ListItemIcon><AccountCircleIcon fontSize="small" /></ListItemIcon>
        <ListItemText
          primary={account?.displayName || account?.userId || "Account"}
          secondary={(account?.providers || []).join(", ")}
        />
      </MenuItem>
      <Divider />
      <MenuItem onClick={handleMenuClose}>
        <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
        <ListItemText primary="Settings" />
      </MenuItem>
      <MenuItem onClick={handleMenuClose}>
        <ListItemIcon><BrightnessMediumIcon fontSize="small" /></ListItemIcon>
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
        <AccountCircleIcon />
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={handleMenuClose}>
        {account ? AuthedMenu : UnauthedMenu}
      </Menu>
    </ThemeProvider>
  );
};

export default Account;
