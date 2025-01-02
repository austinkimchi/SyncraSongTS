import React from "react";
import PlaylistComponent from "./PlaylistComponent";
import { PlaylistCollectionProps } from "../types/playlist";
import "../css/PlaylistCollection.css";

const PlaylistCollection: React.FC<PlaylistCollectionProps> = ({
  playlists,
  provider,
  status,
  onRemove,
}) => {
  return (
    <div className="playlist-collection">
      {playlists?.map((playlist) => (
        <PlaylistComponent
          key={playlist.id}
          {...playlist}
          source={provider || playlist.source}
          status={status}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
};

export default PlaylistCollection;
