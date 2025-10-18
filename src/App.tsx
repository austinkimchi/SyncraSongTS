import React, { useState, useEffect, useCallback } from "react";
import DarkLogo from "./assets/logo/logo-dark.svg";
import PlaylistSection from "./components/PlaylistSection";
import PendingSection from "./components/PendingSection";
import Account from "./components/Account";
import Reauthorize from "./components/Reauthorize";
import { Switch } from "@mui/material";

import type { Playlist } from "./types/playlist";
import Platform from "./types/platform";
import { state } from "./types/status";
import { } from "./handler/callback"; // just run on import

import { DEMO_PLAYLISTS_APPLE, DEMO_PLAYLISTS_SPOTIFY } from "./data/demoPlaylists";
import { getClient } from "./handler/getClient";

import { APP_FULL_URL } from "./config";
import "./css/App.css";



const providerKey = (p: Platform): Platform =>
  p === Platform.APPLE_MUSIC ? Platform.APPLE_MUSIC : Platform.SPOTIFY;

// App component
const App: React.FC = () => {
  const [playlists, setPlaylists] = useState<{ apple: Playlist[]; spotify: Playlist[] }>({
    apple: [],
    spotify: [],
  });

  const [pendingPlaylists, setPendingPlaylists] = useState<Playlist[]>([]);
  const [pendingDisplayedOn, setPendingDisplayedOn] = useState<Platform | null>(null);

  const [lastUpdated, setLastUpdated] = useState<{ apple: Date | null; spotify: Date | null }>({
    apple: null,
    spotify: null,
  });

  const [status, setStatus] = useState<{ apple: number; spotify: number }>({
    apple: 200,
    spotify: 200,
  });

  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => !localStorage.getItem("token"));

  const defaultTheme =
    (localStorage.getItem("theme") as "light" | "dark") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const [theme, setTheme] = useState<"light" | "dark">(defaultTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // ------ fetch playlists via IPlatformClient (no hardcoding) ------
  const fetchPlaylists = useCallback(
    async (platform: Platform) => {
      const key = providerKey(platform);
      try {
        const token = localStorage.getItem("token") || "";
        if (!token) throw new Error("No token");

        const client = getClient(platform, token);
        const { items } = await client.getUserPlaylists({ limit: 50 });

        setPlaylists((prev) => ({ ...prev, [key]: items }));
        setLastUpdated((prev) => ({ ...prev, [key]: new Date() }));
        localStorage.setItem(
          `${key}-playlists`,
          JSON.stringify({ items, lastUpdated: new Date().toISOString() })
        );
        setStatus((prev) => ({ ...prev, [key]: 200 }));
      } catch (err: any) {
        console.error(`Failed to fetch playlists for ${key}:`, err);
        // heuristic: treat missing token/401/any network issue as 401/500 bucket
        const code = String(err?.message || "").includes("401") ? 401 : 500;
        setStatus((prev) => ({ ...prev, [key]: code }));
      }
    },
    []
  );

  // fetch on mount/when demo toggles or status changes
  useEffect(() => {
    if (isDemoMode) return;
    if (status.apple === 200) fetchPlaylists(Platform.APPLE_MUSIC);
    if (status.spotify === 200) fetchPlaylists(Platform.SPOTIFY);
  }, [status.apple, status.spotify, isDemoMode, fetchPlaylists]);

  // add/remove/commit pending
  const handleAddToPending = (pl: Playlist, destination: Platform) => {
    setPendingPlaylists((prev) =>
      prev.some((p) => p.id === pl.id) ? prev : [...prev, { ...pl, status: state.PENDING }]
    );
    setPendingDisplayedOn(providerKey(destination));
  };

  const handleRemoveFromPending = (playlist: Playlist) => {
    setPendingPlaylists((prev) => prev.filter((p) => p.id !== playlist.id));
    if (pendingPlaylists.length == 1) {
      setPendingDisplayedOn(null);
    }
  };

  const handleCommit = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${APP_FULL_URL}/handler/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          pendingPlaylists: pendingPlaylists.map((e) => ({
            id: e.id,
            name: e.name,
            source: e.platform,
            trackLength: e.trackCount,
            image: (e as any).image,
            description: (e as any).description,
          })),
          destination: pendingDisplayedOn,
        }),
      });
      if (res.status !== 202) throw new Error(`transfer failed (${res.status})`);
      // clear after success
      setPendingPlaylists([]);
      setPendingDisplayedOn(null);
    } catch (err) {
      console.error("Error committing playlists:", err);
    }
  };

  const handleCancel = () => {
    setPendingPlaylists([]);
    setPendingDisplayedOn(null);
  };

  // token/demo mode watchers
  useEffect(() => {
    const handleAuthChange = () => {
      const hasToken = !!localStorage.getItem("token");
      setIsDemoMode(!hasToken);
    };
    window.addEventListener("auth-changed", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);
    return () => {
      window.removeEventListener("auth-changed", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, []);

  // demo vs real data bootstrap
  useEffect(() => {
    if (isDemoMode) {
      setPlaylists({
        apple: DEMO_PLAYLISTS_APPLE.map((p) => ({ ...p })),
        spotify: DEMO_PLAYLISTS_SPOTIFY.map((p) => ({ ...p })),
      });
      setLastUpdated({ apple: null, spotify: null });
      setPendingPlaylists([]);
      setPendingDisplayedOn(null);
      return;
    }

    // real mode: load cache, else fetch
    const token = localStorage.getItem("token");
    if (!token) return;

    const userData = JSON.parse(localStorage.getItem("user_data") || "{}");

    ([
      { platform: Platform.APPLE_MUSIC, key: "apple" as const },
      { platform: Platform.SPOTIFY, key: "spotify" as const },
    ] as const).forEach(({ platform, key }) => {
      const cache = localStorage.getItem(`${key}-playlists`);
      if (cache && !userData[key]) {
        try {
          const { items, lastUpdated } = JSON.parse(cache);
          if (new Date(lastUpdated) > new Date(Date.now() - 1000 * 60 * 60)) {
            setPlaylists((prev) => ({ ...prev, [key]: items }));
            setLastUpdated((prev) => ({ ...prev, [key]: new Date(lastUpdated) }));
            return;
          }
        } catch {
          /* ignore parse issues and fetch fresh */
        }
      }
      fetchPlaylists(platform);
    });
  }, [fetchPlaylists, isDemoMode]);

  return (
    <div>
      <nav className="navbar">
        <div className="flex-1" />
        <a href="#" className="flex-1 text-center m-0! place-items-center">
          <img src={DarkLogo} alt="logo" id="logo" className="w-32 h-i padding-0 align-center" />
        </a>
        <div className="flex flex-1 justify-end gap-[0.5rem]">
          <Switch className="btn btn-sm btn-ghost" onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))} />
          <Account
            setStatus={setStatus}
            theme={theme}
            toggleTheme={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
          />
        </div>
      </nav>

      <div className="flex flex-row">
        <PlaylistSection
          platform={Platform.APPLE_MUSIC}
          playlists={pendingDisplayedOn === "apple" ? [] : playlists.apple}
          onAddToPending={handleAddToPending}
          onRefresh={() => fetchPlaylists(Platform.APPLE_MUSIC)}
          lastUpdated={lastUpdated.apple}
        >
          {(status.apple === 500 || status.apple === 401) && (
            <Reauthorize provider="apple" setStatus={setStatus} />
          )}
          {pendingDisplayedOn === "apple" && (
            <PendingSection
              playlists={pendingPlaylists}
              onCommit={handleCommit}
              onRemoveAll={handleCancel}
              onRemove={handleRemoveFromPending}
            />
          )}
        </PlaylistSection>

        <PlaylistSection
          platform={Platform.SPOTIFY}
          playlists={pendingDisplayedOn === Platform.SPOTIFY ? [] : playlists.spotify}
          onAddToPending={handleAddToPending}
          onRefresh={() => fetchPlaylists(Platform.SPOTIFY)}
          lastUpdated={lastUpdated.spotify}
        >
          {(status.spotify === 500 || status.spotify === 401) && (
            <Reauthorize provider="spotify" setStatus={setStatus} />
          )}
          {pendingDisplayedOn === Platform.SPOTIFY && (
            <PendingSection
              playlists={pendingPlaylists}
              onCommit={handleCommit}
              onRemoveAll={handleCancel}
              onRemove={handleRemoveFromPending}
            />
          )}
        </PlaylistSection>
      </div>
    </div>
  );
};

export default App;
