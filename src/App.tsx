import React, { useState, useEffect, useCallback } from "react";
import DarkLogo from "./assets/logo/logo-dark.svg";
import PlaylistSection from "./components/PlaylistSection";
import PendingPlaylist from "./components/PendingPlaylist";
import Account from "./components/Account";
import { Playlist } from "./types/playlist";
import "./css/App.css";

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
  const [lastUpdated, setLastUpdated] = useState<Date | null | any>(
    {
      apple: null,
      spotify: null
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
          items: data.items,
          lastUpdated: new Date().toISOString(),
        })
      );
    } catch (error) {
      console.error(`Failed to fetch playlists for ${provider}:`, error);
    }
  }, []);

  const handleAddToPending = (playlist: Playlist, provider: string) => {
    setPendingPlaylists((prev) => [...prev, playlist]);
    setPendingDisplayedOn(provider);
  };

  const handleRemoveFromPending = (id: string) => {
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
    // Load playlists from localStorage on initial load
    // if available and not expired, if expired, fetch new playlists
    const appleStorage = localStorage.getItem("apple-playlists");
    const spotifyStorage = localStorage.getItem("spotify-playlists");

    if (appleStorage) {
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

    if (spotifyStorage) {
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
            pendingDisplayedOn === "apple" ? pendingPlaylists : playlists.apple
          }
          onAddToPending={(playlist) => handleAddToPending(playlist, "apple")}
          onRefresh={() => fetchPlaylists("apple")}
          lastUpdated={lastUpdated.apple}
        >
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
              ? pendingPlaylists
              : playlists.spotify
          }
          onAddToPending={(playlist) => handleAddToPending(playlist, "spotify")}
          onRefresh={() => fetchPlaylists("spotify")}
          lastUpdated={lastUpdated.spotify}
        >
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
