import React from "react";
import Button from '@mui/material/Button';
import PlaylistCollection from "./PlaylistCollection";
import { Playlist } from "../types/playlist";
import { useDrop } from "react-dnd";
import AppleLogo from "../assets/provider/applemusic.svg";
import SpotifyLogo from "../assets/provider/spotify.png";
import "../css/PlaylistSection.css";

const loggedIn = !!localStorage.getItem("token");

interface Props {
  provider: "apple" | "spotify";          // ← stricter
  playlists: Playlist[];
  lastUpdated?: string | null;
  onRefresh: () => void;
  /** playlist + destination */
  onAddToPending: (p: Playlist, destination: "apple" | "spotify") => void;
  children?: React.ReactNode;
}

const PlaylistSection: React.FC<Props> = ({
  provider,
  playlists,
  lastUpdated,
  onRefresh,
  onAddToPending,
  children,
}) => {
  const [{ isOver, canDrop }, drop] = useDrop<Playlist, void, any>(() => ({
    accept: ["DRAG_FROM_PROVIDER"],
    canDrop: (pl) => pl.source !== provider,
    drop: (pl) => onAddToPending(pl, provider),
    collect: (m) => ({ isOver: m.isOver(), canDrop: m.canDrop() }),
  }));

  /* helper: opposite provider for “click-to-queue” */
  const dest = provider === "apple" ? "spotify" : "apple";

  return (
    <div ref={drop} style={{ padding: 12 }} className={`playlist-section ${isOver && canDrop ? "over" : ""}`}>
      <header className="provider-header">
        <img src={provider === "apple" ? AppleLogo : SpotifyLogo}
          alt={`${provider} logo`} className="provider-logo" />
        <h2 className="no-margin">{provider === "apple" ? "Apple Music" : "Spotify"}</h2>

        <div className="justify-center flex flex-column margin-left-auto">
          {lastUpdated && (
            <small className="align-center left-align" style={{ marginLeft: "auto" }}>
              Last updated: {""} <br />
              {new Date(lastUpdated).toLocaleString()}
            </small>
          )}


          {loggedIn && (
            <Button variant="outlined" size="small" fullWidth={false} onClick={onRefresh}>
              Refresh
            </Button>
          )}
        </div>

      </header>

      <PlaylistCollection
        playlists={playlists}
        provider={provider}
        status="pending"
        /* click inside this column should add to *other* column */
        onAdd={(pl) => onAddToPending(pl, dest)}
      />

      {children}
    </div>
  );
};

export default PlaylistSection;
