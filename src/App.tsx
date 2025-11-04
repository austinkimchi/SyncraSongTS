import React, { useState, useEffect, useCallback, useMemo } from "react";
import DarkLogo from "./assets/logo/logo-dark.svg";

// Components
import PlaylistSection from "./components/PlaylistSection";
import PendingSection from "./components/PendingSection";
import Account from "./components/Account";
import CreateAccountModal from "./components/CreateAccountModal";

// Types & helpers
import type { Playlist } from "./types/playlist";
import Platform from "./types/platform";
import { state } from "./types/status";
import { } from "./handler/callback"; // runs on import

import { DEMO_PLAYLISTS_APPLE, DEMO_PLAYLISTS_SPOTIFY, DEMO_PLAYLISTS_SOUNDCLOUD } from "./data/demoPlaylists";
import { getClient } from "./handler/getClient";
import { SpotifyClient } from "./data/clients/SpotifyClient";
import { AppleMusicClient } from "./data/clients/AppleMusicClient";
import {
  PendingAccountInfo,
  getPendingAccount,
  subscribeToPendingAccount,
} from "./handler/pendingAccount";

import "./css/App.css";

const App: React.FC = () => {
  // Platform left/right panels
  const [leftPanelPlatform, setLeftPanelPlatform] = useState<Platform>(Platform.APPLE_MUSIC);
  const [rightPanelPlatform, setRightPanelPlatform] = useState<Platform>(Platform.SPOTIFY);

  // Playlists keyed by platform
  const [playlists, setPlaylists] = useState<Partial<Record<Platform, Playlist[]>>>({});
  const [lastUpdated, setLastUpdated] = useState<Partial<Record<Platform, Date>>>({});

  // Pending playlists
  const [pendingDisplayedOn, setPendingDisplayedOn] = useState<Platform | null>(null);
  const [pendingPlaylists, setPendingPlaylists] = useState<Playlist[]>([]);

  // Account creation modal state
  const [pendingAccount, setPendingAccount] = useState<PendingAccountInfo | null>(() => getPendingAccount());
  const [showCreateAccount, setShowCreateAccount] = useState<boolean>(() => getPendingAccount() !== null);

  // Derived auth state
  const isDemoMode = useMemo(() => !localStorage.getItem("token"), [localStorage.getItem("token")]);

  // --- Auth + pending account events ---
  useEffect(() => {
    const handlePendingAccountChange = () => {
      const info = getPendingAccount();
      setPendingAccount(info);
      setShowCreateAccount(!!info);
    };

    const unsubscribe = subscribeToPendingAccount(handlePendingAccountChange);
    window.addEventListener("auth-changed", handlePendingAccountChange);
    handlePendingAccountChange();

    return () => {
      unsubscribe();
      window.removeEventListener("auth-changed", handlePendingAccountChange);
    };
  }, []);

  // Fetch playlists
  const fetchPlaylists = useCallback(async (platform: Platform, options?: { force?: boolean }) => {
    try {
      const client = getClient(platform);
      if (!client) return;

      // TODO(reauth): if not logged in, surface a connect/reauthorize prompt instead
      const loggedIn = await client.isLoggedIn().catch(() => false);
      if (!loggedIn) return;

      const res = await client.getUserPlaylists({ fetch: !!options?.force });
      setPlaylists((prev) => ({ ...prev, [platform]: res.items }));
      setLastUpdated((prev) => ({ ...prev, [platform]: new Date() }));
    } catch (err) {
      console.error(`Failed to fetch playlists for ${platform}`, err);
    }
  }, []);

  // Demo mode/real data toggle
  useEffect(() => {
    if (isDemoMode) {
      setPlaylists({
        [Platform.APPLE_MUSIC]: DEMO_PLAYLISTS_APPLE,
        [Platform.SPOTIFY]: DEMO_PLAYLISTS_SPOTIFY,
        [Platform.SOUNDCLOUD]: DEMO_PLAYLISTS_SOUNDCLOUD
      });
      setLastUpdated({});
      setPendingDisplayedOn(null);
      setPendingPlaylists([]);
      return;
    }

    // Real data
    setPlaylists({});
    setPendingDisplayedOn(null);
    fetchPlaylists(Platform.APPLE_MUSIC);
    fetchPlaylists(Platform.SPOTIFY);
  }, [isDemoMode, fetchPlaylists]);

  // Pending helpers
  const addToPending = useCallback((pl: Playlist, destination: Platform) => {
    setPendingPlaylists((prev) => (prev.some((p) => p.id === pl.id) ? prev : [...prev, { ...pl, status: state.PENDING }]));
    setPendingDisplayedOn(destination);
  }, []);

  const removeFromPending = useCallback((pl: Playlist) => {
    setPendingPlaylists((prev) => prev.filter((p) => p.id !== pl.id));
    setPendingDisplayedOn((prevSide) => {
      const willBeEmpty = pendingPlaylists.length <= 1; // using current closure value
      return willBeEmpty ? null : prevSide;
    });
  }, [pendingPlaylists.length]);

  const cancelPending = useCallback(() => {
    setPendingPlaylists([]);
    setPendingDisplayedOn(null);
  }, []);

  // Render helpers
  const leftPlaylists = playlists[leftPanelPlatform] ?? [];
  const rightPlaylists = playlists[rightPanelPlatform] ?? [];

  return (
    <div data-testid="app-container">
      <nav className="navbar">
        <div className="flex-1" />
        <a href="#" className="flex-1 text-center m-0! place-items-center">
          <img src={DarkLogo} alt="logo" id="logo" className="w-32 h-i padding-0 align-center" />
        </a>
        <div className="flex flex-1 justify-end gap-[0.5rem]">
          <Account />
        </div>
      </nav>

      <div className="flex flex-row">
        {/* LEFT PANEL */}
        <PlaylistSection
          platform={leftPanelPlatform}
          playlists={pendingDisplayedOn === leftPanelPlatform ? [] : leftPlaylists}
          lastUpdated={lastUpdated[leftPanelPlatform]}
          onRefresh={() => fetchPlaylists(leftPanelPlatform, { force: true })}
          onAddToPending={addToPending}
          onChangePlatform={(p) => { // prevent same providers on both sides (auto-swap)
            if (p === rightPanelPlatform) {
              setRightPanelPlatform(leftPanelPlatform);
            }
            setLeftPanelPlatform(p);
          }}
        >
          {pendingDisplayedOn === leftPanelPlatform && (
            <PendingSection
              playlists={pendingPlaylists}
              onCommit={() => { /* TODO: implement transfer action */ }}
              onRemoveAll={cancelPending}
              onRemove={removeFromPending}
            />
          )}
        </PlaylistSection>

        {/* RIGHT PANEL */}
        <PlaylistSection
          platform={rightPanelPlatform}
          playlists={pendingDisplayedOn === rightPanelPlatform ? [] : rightPlaylists}
          lastUpdated={lastUpdated[rightPanelPlatform]}
          onRefresh={() => fetchPlaylists(rightPanelPlatform, { force: true })}
          onAddToPending={addToPending}
          onChangePlatform={(p) => {
            if (p === leftPanelPlatform) {
              setLeftPanelPlatform(rightPanelPlatform);
            }
            setRightPanelPlatform(p);
          }}
        >
          {pendingDisplayedOn === rightPanelPlatform && (
            <PendingSection
              playlists={pendingPlaylists}
              onCommit={() => { /* TODO: implement transfer action */ }}
              onRemoveAll={cancelPending}
              onRemove={removeFromPending}
            />
          )}
        </PlaylistSection>
      </div>

      {/* TODO(reauth): show a lightweight banner/modal if a panel's client isn't linked */}

      {showCreateAccount && pendingAccount && (
        <CreateAccountModal pendingAccount={pendingAccount} />
      )}
    </div>
  );
};

export default App;