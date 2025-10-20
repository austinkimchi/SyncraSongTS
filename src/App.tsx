import React, { useEffect, useMemo, useState } from "react";
import { Switch } from "@mui/material";

import DarkLogo from "./assets/logo/logo-dark.svg";
import PlaylistSection from "./components/PlaylistSection";
import PendingPlaylist from "./components/PendingPlaylist";
import Account from "./components/Account";
import Reauthorize from "./components/Reauthorize";

import type { Playlist } from "./types/playlist";
import Platform from "./types/platform";
import { state as plstatus } from "./types/status";

import { DEMO_PLAYLISTS_APPLE, DEMO_PLAYLISTS_SPOTIFY } from "./data/demoPlaylists";
import { getClient } from "./handler/getClient";

import { APP_FULL_URL } from "./config";
import "./css/App.css";

const providerKey = (p: Platform): Platform =>
  p === Platform.APPLE_MUSIC ? Platform.APPLE_MUSIC : Platform.SPOTIFY;

const App: React.FC = () => {
  const [pendingPlaylists, setPendingPlaylists] = useState<Playlist[]>([]);
  const [pendingDisplayedOn, setPendingDisplayedOn] = useState<Platform | null>(null);
  const [status, setStatus] = useState<{ apple: number; spotify: number }>({
    apple: 200,
    spotify: 200,
  });
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => !localStorage.getItem("token"));
  const [token, setToken] = useState<string>(() => localStorage.getItem("token") || "");

  const defaultTheme =
    (localStorage.getItem("theme") as "light" | "dark") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const [theme, setTheme] = useState<"light" | "dark">(defaultTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const spotifyClient = useMemo(
    () => (token && !isDemoMode ? getClient(Platform.SPOTIFY, token) : null),
    [isDemoMode, token]
  );
  const appleClient = useMemo(
    () => (token && !isDemoMode ? getClient(Platform.APPLE_MUSIC, token) : null),
    [isDemoMode, token]
  );

  const handleAddToPending = (pl: Playlist, destination: Platform) => {
    setPendingPlaylists((prev) =>
      prev.some((p) => p.id === pl.id) ? prev : [...prev, { ...pl, status: plstatus.PENDING }]
    );
    setPendingDisplayedOn(providerKey(destination));
  };

  const handleRemoveFromPending = (playlist: Playlist) => {
    setPendingPlaylists((prev) => {
      const next = prev.filter((p) => p.id !== playlist.id);
      if (next.length === 0) {
        setPendingDisplayedOn(null);
      }
      return next;
    });
  };

  const handleCommit = async () => {
    try {
      const authToken = localStorage.getItem("token") || "";
      const res = await fetch(`${APP_FULL_URL}/handler/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
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

  useEffect(() => {
    const handleAuthChange = () => {
      const storedToken = localStorage.getItem("token") || "";
      setToken(storedToken);
      setIsDemoMode(!storedToken);
    };
    window.addEventListener("auth-changed", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);
    return () => {
      window.removeEventListener("auth-changed", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, []);

  useEffect(() => {
    if (isDemoMode) {
      setPendingPlaylists([]);
      setPendingDisplayedOn(null);
      setStatus({ apple: 200, spotify: 200 });
    }
  }, [isDemoMode]);

  const setAppleStatus = (code: number) => setStatus((prev) => ({ ...prev, apple: code }));
  const setSpotifyStatus = (code: number) => setStatus((prev) => ({ ...prev, spotify: code }));

  return (
    <div>
      <nav className="navbar">
        <div className="flex-1" />
        <a href="#" className="flex-1 text-center m-0! place-items-center">
          <img src={DarkLogo} alt="logo" id="logo" className="w-32 h-i padding-0 align-center" />
        </a>
        <div className="flex flex-1 justify-end gap-[0.5rem]">
          <Switch
            className="btn btn-sm btn-ghost"
            onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
          />
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
          client={appleClient}
          demoPlaylists={DEMO_PLAYLISTS_APPLE}
          isDemoMode={isDemoMode}
          status={status.apple}
          onStatusChange={setAppleStatus}
          hidePlaylists={pendingDisplayedOn === Platform.APPLE_MUSIC}
          onAddToPending={handleAddToPending}
        >
          {(status.apple === 500 || status.apple === 401) && (
            <Reauthorize provider="apple" setStatus={setStatus} />
          )}
          {pendingDisplayedOn === Platform.APPLE_MUSIC && (
            <PendingPlaylist
              playlists={pendingPlaylists}
              onCommit={handleCommit}
              onRemoveAll={handleCancel}
              onRemove={handleRemoveFromPending}
            />
          )}
        </PlaylistSection>

        <PlaylistSection
          platform={Platform.SPOTIFY}
          client={spotifyClient}
          demoPlaylists={DEMO_PLAYLISTS_SPOTIFY}
          isDemoMode={isDemoMode}
          status={status.spotify}
          onStatusChange={setSpotifyStatus}
          hidePlaylists={pendingDisplayedOn === Platform.SPOTIFY}
          onAddToPending={handleAddToPending}
        >
          {(status.spotify === 500 || status.spotify === 401) && (
            <Reauthorize provider="spotify" setStatus={setStatus} />
          )}
          {pendingDisplayedOn === Platform.SPOTIFY && (
            <PendingPlaylist
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

