import React from "react";
import PlaylistComponent from "./PlaylistComponent";
import { PlaylistCollectionProps } from "../types/playlist";
import "../css/PlaylistCollection.css";


const PlaylistCollection: React.FC<PlaylistCollectionProps> = ({
  playlists,
  provider,
  // status,
  onRemove,
  onAdd,
}) => (
  <div className="playlist-collection">
    {playlists?.map((pl) => (
      <PlaylistComponent
        key={pl.id}
        {...pl}
        source={provider || pl.source}
        onRemove={onRemove}
        onAdd={onAdd}
      />
    ))}
  </div>
);

export default PlaylistCollection;
