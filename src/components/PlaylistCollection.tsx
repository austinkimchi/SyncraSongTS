import React from "react";
import PlaylistComponent from "./PlaylistComponent";
import { PlaylistCollectionProps } from "../types/playlist";

const PlaylistCollection: React.FC<PlaylistCollectionProps> = ({
  playlists,
  provider,
  // status,
  onRemove,
  onAdd,
}) => (
  <div className="grid playlist-collection display-grid md:grid-cols-2 lg:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4">
    {playlists?.map((pl) => (
      <PlaylistComponent
        key={pl.id}
        {...pl}
        platform={provider || pl.platform}
        onRemove={onRemove}
        onAdd={onAdd}
      />
    ))}
  </div>
);

export default PlaylistCollection;
