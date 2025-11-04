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
import Platform, { getPlatformDisplayName, getPlatformInfo, getPlatformLogo, getPlatformOAuthFunction } from "../types/platform";

import { API_FULL_URL } from "../config";
import { spotifyAuthService } from "../handler/spotifyAPI";

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
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }

  const token = localStorage.getItem("token");
  const headers = new Headers(init.headers ?? undefined);
  if (token) headers.set("Authorization", `Bearer ${token}`);


  const res = await fetch(`${API_FULL_URL}${path}`, {
    credentials: "omit",
    ...init,
    headers,
  });
  return res;
}

interface AccountInfo {
  userID: string;
  displayName?: string;
  providers?: Platform[];
}

interface AccountProps {
}

const mapProviderToPlatform = (provider: string): Platform | null => {
  switch (provider) {
    case "spotify":
      return Platform.SPOTIFY;
    case "apple_music":
    case "apple":
      return Platform.APPLE_MUSIC;
    case "soundcloud":
      return Platform.SOUNDCLOUD;
    default:
      return null;
  }
};

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
  interface InfoPayload {
    jwt: { expiresAt: EpochTimeStamp; expiresIn: number };
    userId: string;
    oauth: Array<{ provider: Platform; providerId: string }>;
  }

  const fetchSessionAndInfo = useCallback(async () => {
    try {
      const infoRes = await api("/auth/info");
      if (infoRes.status === 401 || !infoRes.ok) {
        setAccount(null);
        spotifyAuthService.setStoredProfile(null);
        return;
      }

      const payload = await infoRes.json() as InfoPayload;
      if (!payload || !payload.userId || payload.userId.length === 0 || !payload.oauth) {
        setAccount(null);
        spotifyAuthService.setStoredProfile(null);
        return;
      }

      const { oauth, userId, jwt } = payload

      const providers: Platform[] = [];
      for (const entry of oauth) {
        const plat = mapProviderToPlatform(entry.provider);
        if (plat) providers.push(plat);
      }

      localStorage.setItem("providers", JSON.stringify(providers));

      const accountInfo: AccountInfo = {
        userID: userId,
        providers,
        displayName: userId
      };

      setAccount(accountInfo);

      const spotifyOauth = Array.isArray(oauth)
        ? oauth.find((entry: { provider: string }) => entry.provider === "spotify")
        : oauth['spotify']
          ? oauth
          : undefined;

      if (spotifyOauth && spotifyOauth.providerId) {
        spotifyAuthService.setStoredProfile({
          id: spotifyOauth.providerId,
          display_name: accountInfo.displayName ?? accountInfo.userID,
        });
      } else {
        spotifyAuthService.setStoredProfile(null);
      }
      setError("");
    } catch (e) {
      setError("Failed to load account. Servers may not be responding.");
      setAccount(null);
      spotifyAuthService.setStoredProfile(null);
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
    spotifyAuthService.setStoredProfile(null);
    sessionStorage.clear();
    window.dispatchEvent(new Event("auth-changed"));
    // Soft refresh to reset any protected views
    setTimeout(() => window.location.reload(), 150);
  };

  // Menu content when NOT logged in: show Login with <providers>
  const UnauthedMenu = (
    <>
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
          secondary={(account?.providers || []).map((provider) => getPlatformDisplayName(provider)).join(", ")}
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
