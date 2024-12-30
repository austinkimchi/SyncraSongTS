import React from "react";
import PlaylistCollection from "./PlaylistCollection";
import { Playlist } from "../types/playlist";

interface PendingPlaylistProps {
  pendingPlaylists: Playlist[];
  onCommit: () => void;
  onRemoveAll: () => void;
  onRemove: (id: string) => void;
}

const PendingPlaylist: React.FC<PendingPlaylistProps> = ({
  pendingPlaylists,
  onCommit,
  onRemoveAll,
  onRemove,
}) => {
  return (
    <div className="pending-playlists">
      <h3>Pending Playlists</h3>
      <PlaylistCollection
        playlists={pendingPlaylists}
        status="pending"
        onRemove={onRemove}
      />
      <button onClick={onCommit}>Commit Transfer</button>
      <button onClick={onRemoveAll}>Cancel All</button>
    </div>
  );
};

export default PendingPlaylist;
