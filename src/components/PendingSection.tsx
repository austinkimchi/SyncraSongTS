import React from "react";
import PlaylistCollection from "./PlaylistCollection";
import { PlaylistCollectionProps } from "../types/playlist";
import { state } from "../types/status";

interface PendingPlaylistProps extends PlaylistCollectionProps {
  onCommit: () => void;
  onRemoveAll: () => void;
}

const PendingSection: React.FC<PendingPlaylistProps> = ({
  playlists,
  onCommit,
  onRemoveAll,
  onRemove
}) => {
  return (
    <div className="pending-playlists">
      <h3>Pending Playlists</h3>
      <PlaylistCollection
        playlists={playlists}
        platform={playlists[0]?.platform || null}
        status={state.QUEUED}
        onRemove={onRemove}
      />
      <button onClick={onCommit}>Commit Transfer</button>
      <button onClick={onRemoveAll}>Cancel All</button>
    </div>
  );
};

export default PendingSection;
