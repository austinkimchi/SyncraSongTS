import React, { useState, useEffect, useCallback } from "react";
import DarkLogo from "./assets/logo/logo-dark.svg";
import PlaylistSection from "./components/PlaylistSection";
import PendingPlaylist from "./components/PendingPlaylist";
import Account from "./components/Account";
import { Playlist } from "./types/playlist";
import "./css/App.css";
import Reauthorize from "./components/Reauthorize";

import config from "../config.json";

const App: React.FC = () => {
  const [playlists, setPlaylists] = useState<{
    apple: Playlist[];
    spotify: Playlist[];
  }>({
    apple: [],
    spotify: [],
  });
  const [pendingPlaylists, setPendingPlaylists] = useState<Playlist[]>([]);
  const [pendingDisplayedOn, setPendingDisplayedOn] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Object | null | any>(
    {
      apple: null,
      spotify: null
    }
  );
  const [status, setStatus] = useState<Object | any>(
    {
      apple: 200,
      spotify: 200
    }
  );

  const fetchPlaylists = useCallback(async (provider: "apple" | "spotify") => {
    try {
      const response = await fetch(
        `https://${config.subdomain}.${config.domain_name}/api/getPlaylist/${provider}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (response.status == 500) {
        setStatus((prev: any) => ({
          ...prev,
          [provider]: 500
        }));
      }

      const data = await response.json();
      setPlaylists((prev) => ({
        ...prev,
        [provider]: data.items,
      }));

      setLastUpdated((prev: any) => ({
        ...prev,
        [provider]: new Date(),
      }));
      localStorage.setItem(
        `${provider}-playlists`,
        JSON.stringify({
          items: data.items || [],
          lastUpdated: new Date().toISOString(),
        })
      );
      setStatus((prev: any) => ({
        ...prev,
        [provider]: response.status
      }));
    } catch (error) {
      console.error(`Failed to fetch playlists for ${provider}:`, error);
      setStatus((prev: any) => ({
        ...prev,
        [provider]: 500
      }));
    }
  }, []);

  const handleAddToPending = (playlist: Playlist, provider: string) => {
    setPendingDisplayedOn(provider);
    setPendingPlaylists((prev) =>
      prev.find((p) => p.id === playlist.id) ? prev : [...prev, playlist]
    );
  };

  useEffect(() => {
    console.log("Pending playlists:", pendingPlaylists);
    console.log("Pending displayed on:", pendingDisplayedOn);
  }, [pendingPlaylists]);

  const handleRemoveFromPending = (id: string) => {
    console.log("Removing playlist from pending:", id);
    setPendingPlaylists((prev) =>
      prev.filter((playlist) => playlist.id !== id)
    );
  };

  const handleCommit = () => {
    console.log("Committing playlists:", pendingPlaylists);
    setPendingPlaylists([]);
    setPendingDisplayedOn(null);
  };

  const handleCancel = () => {
    setPendingPlaylists([]);
    setPendingDisplayedOn(null);
  };

  useEffect(() => {
    // check if token exists
    const token = localStorage.getItem("token");
    if (!token) return;

    // Load playlists from localStorage on initial load
    // if available and not expired, if expired, fetch new playlists
    const appleStorage = localStorage.getItem("apple-playlists");
    const spotifyStorage = localStorage.getItem("spotify-playlists");

    // Parse user data to check if {apple: true, spotify: true}
    const userData = JSON.parse(localStorage.getItem("user_data") || "{}");

    if (appleStorage && !userData.apple) {
      const { items, lastUpdated } = JSON.parse(appleStorage);
      if (new Date(lastUpdated) > new Date(Date.now() - 1000 * 60 * 60)) {
        setPlaylists((prev) => ({
          ...prev,
          apple: items,
        }));
        setLastUpdated((prev: any) => ({
          ...prev,
          apple: new Date(lastUpdated),
        }));
      } else {
        fetchPlaylists("apple");
      }
    } else {
      fetchPlaylists("apple");
    }

    if (spotifyStorage && !userData.spotify) {
      const { items, lastUpdated } = JSON.parse(spotifyStorage);
      if (new Date(lastUpdated) > new Date(Date.now() - 1000 * 60 * 60)) {
        setPlaylists((prev) => ({
          ...prev,
          spotify: items,
        }));
        setLastUpdated((prev: any) => ({
          ...prev,
          spotify: new Date(lastUpdated),
        }));
      } else {
        fetchPlaylists("spotify");
      }
    } else {
      fetchPlaylists("spotify");
    }
  }, [fetchPlaylists]);

  return (
    <div>
      <nav className="bg-black top-0 flex pt-24 items-center padding-1 justifyc-space padding-lr-2">
        <div className="flex left-flex-comp"></div>
        <div className="container flex flex-row">
          <div className="flex flex-row items-center" id="hamburger">
            <a href="#" className="h-full">
              <img
                src={DarkLogo}
                alt="logo"
                id="logo"
                className="w-32 h-i padding-0"
              />
            </a>
            {/* <a href="#">Dashboard</a> */}
          </div>
        </div>
        <div className="flex right-flex-comp">
          <Account />
        </div>
      </nav>

      <div className="flex flex-row">
        <PlaylistSection
          provider="apple"
          playlists={
            (pendingDisplayedOn === "apple") ? [] : playlists.apple
          }
          onAddToPending={(playlist) => handleAddToPending(playlist, "apple")}
          onRefresh={() => fetchPlaylists("apple")}
          lastUpdated={lastUpdated.apple}
        >
          {status.apple === 500 && <Reauthorize provider="apple" />}
          {pendingDisplayedOn === "apple" && (
            <PendingPlaylist
              pendingPlaylists={pendingPlaylists}
              onCommit={handleCommit}
              onRemoveAll={handleCancel}
              onRemove={handleRemoveFromPending}
            />
          )}
        </PlaylistSection>

        <PlaylistSection
          provider="spotify"
          playlists={
            pendingDisplayedOn === "spotify"
              ? []
              : playlists.spotify
          }
          onAddToPending={(playlist) => handleAddToPending(playlist, "spotify")}
          onRefresh={async () => await fetchPlaylists("spotify")}
          lastUpdated={lastUpdated.spotify}
        >
          {status.spotify == 500 && <Reauthorize provider="spotify" />}
          {pendingDisplayedOn === "spotify" && (
            <PendingPlaylist
              pendingPlaylists={pendingPlaylists}
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
