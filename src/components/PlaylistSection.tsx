import React from "react";
import { Button } from "react-bootstrap";
import PlaylistCollection from "./PlaylistCollection";
import { Playlist } from "../types/playlist";
import { useDrop } from "react-dnd";

// Asset Imports
import AppleLogo from "../assets/provider/applemusic.svg";
import SpotifyLogo from "../assets/provider/spotify.png";
import "../css/PlaylistSection.css";

interface PlaylistSectionProps {
  provider: string;
  playlists: Playlist[];
  lastUpdated?: string | null;
  onRefresh: () => void;
  onAddToPending: (playlist: Playlist) => void;
  children?: React.ReactNode;
}

const PlaylistSection: React.FC<PlaylistSectionProps> = ({
  provider,
  playlists,
  lastUpdated,
  onRefresh,
  onAddToPending,
  children,
}) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ["DRAG_FROM_PROVIDER"],
    drop: (item: Playlist) => {
      onAddToPending(item);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div ref={drop} className={`playlist-section ${isOver ? "over" : ""}`}>

      <div className="provider-header">
        <img
          // Can't hard code this b/c more providers, but for now...
          src={provider === "apple" ? AppleLogo : SpotifyLogo}
          alt={`${provider} logo`}
          className="provider-logo"
        />
        <h2>
          {provider === "apple" ? "Apple Music" : "Spotify"}

          <Button onClick={onRefresh} variant="outlined" style={{ marginLeft: 10 }}>
            Refresh
          </Button>
        </h2>
        {lastUpdated && <p>Last Refreshed: {new Date(lastUpdated).toLocaleString()}</p>}
      </div>

      <PlaylistCollection
        playlists={playlists}
        provider={provider}
        status="provider"
      />
      {children}
    </div>
  );
};

export default PlaylistSection;
