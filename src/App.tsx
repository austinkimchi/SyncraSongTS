import React, { useState, useEffect, useCallback } from "react";
import DarkLogo from "./assets/logo/logo-dark.svg";

// Components
import PlaylistSection from "./components/PlaylistSection";
import PendingSection from "./components/PendingSection";
import Account from "./components/Account";
import CreateAccountModal from "./components/CreateAccountModal";


// Types and helpers
import type { Playlist } from "./types/playlist";
import Platform from "./types/platform";
import { state } from "./types/status";
import { } from "./handler/callback"; // just run on import

import { DEMO_PLAYLISTS_APPLE, DEMO_PLAYLISTS_SPOTIFY } from "./data/demoPlaylists";
import { getClient } from "./handler/getClient";
import { SpotifyClient } from "./data/clients/SpotifyClient";
import { AppleMusicClient } from "./data/clients/AppleMusicClient";
import {
  PendingAccountInfo,
  getPendingAccount,
  subscribeToPendingAccount,
} from "./handler/pendingAccount";

import "./css/App.css";

const providerKey = (p: Platform): Platform =>
  p === Platform.APPLE_MUSIC ? Platform.APPLE_MUSIC : Platform.SPOTIFY;

// App component
const App: React.FC = () => {
  // TODO: Update for more panels in the future
  const [playlists, setPlaylists] = useState<Partial<Record<Platform, Playlist[]>>>({});
  const [pendingPlaylists, setPendingPlaylists] = useState<Playlist[]>([]);
  const [pendingDisplayedOn, setPendingDisplayedOn] = useState<Platform | null>(null);
  const [pendingAccount, setPendingAccount] = useState<PendingAccountInfo | null>(() => getPendingAccount());
  const [showCreateAccount, setShowCreateAccount] = useState<boolean>(() => getPendingAccount() !== null);

  const [lastUpdated, setLastUpdated] = useState<{ apple: Date | null; spotify: Date | null }>({
    apple: null,
    spotify: null,
  });

  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => !localStorage.getItem("token"));
  // initialize clients
  const appleClient = getClient(Platform.APPLE_MUSIC) as AppleMusicClient;
  const spotifyClient = getClient(Platform.SPOTIFY) as SpotifyClient;

  // fetch playlists via IPlatformClient (no hardcoding)
  const fetchPlaylists = useCallback(async (platform: Platform) => {
    const client = getClient(platform);
    console.log(client)
    if (!client) return;
    const loggedIn = await client.profile?.id ? true : false;
    if (!loggedIn) return;

    const res = await client.getUserPlaylists({ limit: 100 });
    setPlaylists((prev) => ({
      ...prev,
      [platform]: res.items,
    }));
    setLastUpdated((prev) => ({
      ...prev,
      [platform]: new Date(),
    }));
  }, []);

  // Set demo mode on/off
  useEffect(() => {
    if (localStorage.getItem("spotify-profile"))
      setIsDemoMode(false);

    if (isDemoMode) {
      setPlaylists({
        [Platform.APPLE_MUSIC]: DEMO_PLAYLISTS_APPLE,
        [Platform.SPOTIFY]: DEMO_PLAYLISTS_SPOTIFY,
      });
      setLastUpdated({ apple: null, spotify: null });
      setPendingPlaylists([]);
      setPendingDisplayedOn(null);
      return;
    }
    setPendingDisplayedOn(null);
    setPlaylists({});

    // Fetch real data
    fetchPlaylists(Platform.APPLE_MUSIC);
    fetchPlaylists(Platform.SPOTIFY);
  }, [isDemoMode, fetchPlaylists]);

  // ---------- Helper Functions for Pending Section ----------
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

  const handleCancel = () => {
    setPendingPlaylists([]);
    setPendingDisplayedOn(null);
  };

  useEffect(() => {
    const handlePendingAccountChange = () => {
      const info = getPendingAccount();
      setPendingAccount(info);
      setShowCreateAccount(info !== null);
      setIsDemoMode(false);
    };

    const unsubscribe = subscribeToPendingAccount(handlePendingAccountChange);
    window.addEventListener("auth-changed", handlePendingAccountChange);
    handlePendingAccountChange();

    return () => {
      unsubscribe();
      window.removeEventListener("auth-changed", handlePendingAccountChange);
    };
  }, []);

  useEffect(() => {
    if (showCreateAccount) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
    return undefined;
  }, [showCreateAccount]);


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
        <PlaylistSection
          platform={Platform.APPLE_MUSIC}
          playlists={pendingDisplayedOn === "apple" ? [] : (playlists.apple || [])}
          onAddToPending={handleAddToPending}
          onRefresh={() => fetchPlaylists(Platform.APPLE_MUSIC)}
          lastUpdated={lastUpdated.apple}
        >

          {pendingDisplayedOn === "apple" && (
            <PendingSection
              playlists={pendingPlaylists}
              onCommit={() => { }} // TODO: implement
              onRemoveAll={handleCancel}
              onRemove={handleRemoveFromPending}
            />
          )}
        </PlaylistSection>

        <PlaylistSection
          platform={Platform.SPOTIFY}
          playlists={pendingDisplayedOn === Platform.SPOTIFY ? [] : (playlists.spotify || [])}
          onAddToPending={handleAddToPending}
          onRefresh={() => fetchPlaylists(Platform.SPOTIFY)}
          lastUpdated={lastUpdated.spotify}
        >

          {pendingDisplayedOn === Platform.SPOTIFY && (
            <PendingSection
              playlists={pendingPlaylists}
              onCommit={() => { }} // TODO: implement
              onRemoveAll={handleCancel}
              onRemove={handleRemoveFromPending}
            />
          )}
        </PlaylistSection>
      </div>

      {showCreateAccount && pendingAccount && <CreateAccountModal pendingAccount={pendingAccount} />}
    </div>
  );
};

export default App;
